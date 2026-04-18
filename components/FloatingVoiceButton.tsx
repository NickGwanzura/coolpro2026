'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Globe2, Mic, MicOff, Radio, Volume2, Waves, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useEmergencyMode } from '@/lib/emergencyMode';
import { useI18n } from '@/lib/i18n';
import { prependCollectionItem, readCollection, STORAGE_KEYS } from '@/lib/platformStore';
import { buildSafetyAssistantResponse, getEmergencySafetyScripts, getRiskSummary } from '@/lib/refrigerantIntelligence';
import type { SafetySession } from '@/types/index';
import { RefrigerantRiskBadge } from './RefrigerantRiskBadge';

type BrowserSpeechRecognitionResult = {
  0: { transcript: string };
};

type BrowserSpeechRecognitionEvent = {
  results: ArrayLike<BrowserSpeechRecognitionResult>;
};

type BrowserSpeechRecognitionErrorEvent = {
  error: string;
};

interface BrowserSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type RecognitionConstructor = new () => BrowserSpeechRecognition;

function buildContextualResponse(query: string, emergencyMode: boolean, language: 'en' | 'fr') {
  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();

  if (!trimmed) {
    return language === 'fr'
      ? 'Posez une question de securite, de refrigerant, ou de certificat pour commencer.'
      : 'Ask a safety, refrigerant, or certificate question to get started.';
  }

  if (lower.includes('coc')) {
    return language === 'fr'
      ? 'Le flux COC reste dans Field Toolkit. Confirmez l’installation, joignez les photos, puis soumettez la demande avant emission.'
      : 'The COC workflow stays in Field Toolkit. Confirm the installation, attach photos, then submit the request before issuance.';
  }

  if (lower.includes('certificate') || lower.includes('certification')) {
    return language === 'fr'
      ? 'Utilisez le portail public de verification avec le numero de certificat ou le code QR pour confirmer le statut et la date d’expiration.'
      : 'Use the public verification portal with the certificate number or QR code to confirm status and expiry.';
  }

  const baseline = buildSafetyAssistantResponse(trimmed, language);

  if (!emergencyMode) {
    return baseline;
  }

  const scripts = getEmergencySafetyScripts(language);
  const emergencySteps = scripts
    .slice(0, 2)
    .map((script) => `${script.refrigerantCode}: ${script.steps[0]}`)
    .join(' ');

  return `${baseline} ${emergencySteps}`;
}

export function FloatingVoiceButton() {
  const { user } = useAuth();
  const { language, speechLocale } = useI18n();
  const { emergencyMode, toggleEmergencyMode } = useEmergencyMode();
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const [browserCapabilities] = useState(() => {
    if (typeof window === 'undefined') {
      return { speechSupported: false };
    }

    const browserWindow = window as Window & {
      SpeechRecognition?: RecognitionConstructor;
      webkitSpeechRecognition?: RecognitionConstructor;
    };

    return {
      speechSupported: Boolean(browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition),
    };
  });
  const [showOverlay, setShowOverlay] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported] = useState(browserCapabilities.speechSupported);
  const [query, setQuery] = useState('');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [sessions, setSessions] = useState<SafetySession[]>(() =>
    readCollection<SafetySession>(STORAGE_KEYS.voiceSessions, [])
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const browserWindow = window as Window & {
      SpeechRecognition?: RecognitionConstructor;
      webkitSpeechRecognition?: RecognitionConstructor;
      speechSynthesis?: SpeechSynthesis;
    };

    const RecognitionClass = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
    if (!RecognitionClass) {
      return;
    }

    const recognition = new RecognitionClass();
    recognition.lang = speechLocale;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const nextTranscript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(' ')
        .trim();
      setTranscript(nextTranscript);
      setQuery(nextTranscript);
    };
    recognition.onerror = (event) => {
      setErrorMessage(`Voice input error: ${event.error}`);
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [speechLocale]);

  const latestRisk = useMemo(() => getRiskSummary(query || transcript), [query, transcript]);
  const recentSessions = sessions.slice(0, 3);

  const speakResponse = (message: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = speechLocale;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const persistSession = (nextQuery: string, nextResponse: string) => {
    const risk = getRiskSummary(nextQuery);
    const session: SafetySession = {
      id: `voice-${Date.now()}`,
      technicianId: user?.id ?? 'public-user',
      query: nextQuery,
      response: nextResponse,
      sourceDocuments: emergencyMode
        ? ['Offline safety scripts', 'Mock WhatGas refrigerant intelligence']
        : ['Mock WhatGas refrigerant intelligence', 'HEVACRAZ workflow guidance'],
      refrigerantClass: risk?.profile.ashraeSafetyClass,
      createdAt: new Date().toISOString(),
      language,
      emergencyMode,
    };

    const nextSessions = prependCollectionItem<SafetySession>(STORAGE_KEYS.voiceSessions, session, sessions);
    setSessions(nextSessions);
  };

  const submitQuery = (value: string) => {
    const nextQuery = value.trim();
    if (!nextQuery) return;

    const nextResponse = buildContextualResponse(nextQuery, emergencyMode, language);
    setResponse(nextResponse);
    setErrorMessage('');
    persistSession(nextQuery, nextResponse);
    speakResponse(nextResponse);
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      setErrorMessage('Voice capture is not available in this browser.');
      return;
    }

    setErrorMessage('');
    setTranscript('');
    setQuery('');
    setIsListening(true);
    recognitionRef.current.lang = speechLocale;
    recognitionRef.current.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const quickPrompts = [
    'R-290 leak response',
    'R-32 pre-job checklist',
    'COC request status',
    'Certificate verification help',
  ];

  return (
    <>
      <div className="fixed bottom-5 right-5 z-50">
        <button
          onClick={() => setShowOverlay(true)}
          className={`group relative flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-105 ${
            emergencyMode
              ? 'bg-gradient-to-br from-red-600 to-red-700'
              : 'bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500'
          }`}
          aria-label="Voice assistant"
        >
          {isListening && <span className="absolute inset-0 rounded-full bg-red-400/70 animate-ping" />}
          {isListening ? <Mic className="relative z-10 h-7 w-7 text-white" /> : <Mic className="h-6 w-6 text-white" />}
          <div className="pointer-events-none absolute bottom-full left-1/2 mb-3 -translate-x-1/2 whitespace-nowrap bg-gray-900 px-3 py-2 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
            {emergencyMode ? 'Emergency safety assistant' : 'Voice assistant'}
          </div>
        </button>
      </div>

      {showOverlay && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
          <div className="max-h-[88vh] w-full overflow-hidden -3xl bg-white sm:w-[560px] sm:">
            <div className="flex items-center justify-between border-b border-gray-100 p-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Voice AI Safety Desk</h3>
                <p className="text-sm text-gray-500">
                  {language === 'fr' ? 'Assistant vocal EN / FR pour la securite RAC' : 'EN / FR refrigerant-aware field guidance'}
                </p>
              </div>
              <button
                onClick={() => setShowOverlay(false)}
                className="rounded-full p-2 transition-colors hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-5 overflow-y-auto p-5">
              <div
                className={`border p-4 ${
                  emergencyMode ? 'border-red-200 bg-red-50' : 'border-blue-100 bg-blue-50'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {emergencyMode ? (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Radio className="h-5 w-5 text-blue-600" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {emergencyMode ? 'Emergency Mode active' : 'Operational Mode active'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {isSpeechSupported ? `Voice locale: ${speechLocale}` : 'Voice capture unavailable, use text input.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleEmergencyMode}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      emergencyMode ? 'bg-red-600 text-white' : 'bg-white text-blue-700'
                    }`}
                  >
                    {emergencyMode ? 'Disable' : 'Enable'} emergency mode
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
                  <Globe2 className="h-3.5 w-3.5" />
                  {language === 'fr' ? 'Francais' : 'English'}
                </div>
                {latestRisk && (
                  <div className="rounded-full border border-gray-200 bg-white px-2 py-1">
                    <RefrigerantRiskBadge color={latestRisk.color} label={latestRisk.label} />
                  </div>
                )}
              </div>

              <div className="border border-gray-200 bg-gray-50 p-6">
                <div className="mb-4 flex items-center justify-center">
                  <div
                    className={`relative flex h-28 w-28 items-center justify-center rounded-full ${
                      isListening ? 'bg-red-50' : 'bg-white'
                    }`}
                  >
                    {isListening && (
                      <>
                        <span className="absolute inset-0 rounded-full border-2 border-red-400/40 animate-ping" />
                        <span
                          className="absolute inset-3 rounded-full border-2 border-red-400/60 animate-ping"
                          style={{ animationDelay: '0.2s' }}
                        />
                      </>
                    )}
                    <div
                      className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-full ${
                        isListening ? 'bg-red-500' : 'bg-orange-500'
                      }`}
                    >
                      {isListening ? <Mic className="h-8 w-8 text-white" /> : <Waves className="h-8 w-8 text-white" />}
                    </div>
                  </div>
                </div>

                <p className="text-center text-lg font-medium text-gray-700">
                  {isListening ? 'Listening for field guidance...' : 'Speak or type a safety question'}
                </p>
                <p className="mt-1 text-center text-sm text-gray-500">
                  {emergencyMode
                    ? 'Emergency mode adds offline safety scripts and faster response prompts.'
                    : 'Ask about refrigerant class, leak response, COC steps, or certificate verification.'}
                </p>

                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={isListening ? stopListening : startListening}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white ${
                      isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'
                    }`}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    {isListening ? 'Stop listening' : 'Start voice capture'}
                  </button>
                  {response && (
                    <button
                      onClick={() => speakResponse(response)}
                      className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                    >
                      <Volume2 className="h-4 w-4" />
                      Replay response
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">Prompt</label>
                <textarea
                  rows={3}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Example: What safety controls do I need before charging R-290?"
                  className="w-full border border-gray-200 px-4 py-3 outline-none transition focus:border-blue-500"
                />
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => {
                        setQuery(prompt);
                        submitQuery(prompt);
                      }}
                      className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-200"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => submitQuery(query)}
                  className="w-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Generate response
                </button>
                {transcript && (
                  <div className="border border-orange-100 bg-orange-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-500">Transcript</p>
                    <p className="mt-2 text-sm text-orange-900">{transcript}</p>
                  </div>
                )}
                {errorMessage && (
                  <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</div>
                )}
              </div>

              {response && (
                <div className="border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">Assistant response</p>
                  <p className="mt-3 text-sm leading-6 text-gray-700">{response}</p>
                  {latestRisk && (
                    <div className="mt-4 border border-gray-100 bg-gray-50 p-4">
                      <p className="text-sm font-semibold text-gray-900">{latestRisk.profile.code} risk summary</p>
                      <p className="mt-1 text-sm text-gray-600">{latestRisk.guidance}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="border border-gray-200 bg-white p-5">
                <p className="text-sm font-semibold text-gray-900">Recent safety sessions</p>
                <div className="mt-3 space-y-3">
                  {recentSessions.length === 0 ? (
                    <p className="text-sm text-gray-500">No sessions saved yet.</p>
                  ) : (
                    recentSessions.map((session) => (
                      <div key={session.id} className="bg-gray-50 p-3">
                        <p className="text-sm font-semibold text-gray-900">{session.query}</p>
                        <p className="mt-1 text-xs text-gray-500">{new Date(session.createdAt).toLocaleString('en-ZW')}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
