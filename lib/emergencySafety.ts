import type { AppLanguage, EmergencySafetyScript } from '@/types/index';

/**
 * Offline Emergency Safety Scripts
 *
 * Self-contained module for emergency mode safety protocols.
 * No dependencies on refrigerant intelligence, OCR, or WhatGas profiles.
 * These scripts are also mirrored in public/emergency-safety/{lang}.json
 * for service-worker offline caching.
 */

const SAFETY_SCRIPTS: Record<AppLanguage, EmergencySafetyScript[]> = {
  en: [
    {
      id: 'en-r290',
      language: 'en',
      title: 'Propane leak response',
      refrigerantCode: 'R-290',
      severity: 'red',
      steps: [
        'Stop ignition sources.',
        'Ventilate the area immediately.',
        'Do not re-energize until the leak is cleared.',
      ],
      offlineReady: true,
    },
    {
      id: 'en-r32',
      language: 'en',
      title: 'A2L site control',
      refrigerantCode: 'R-32',
      severity: 'orange',
      steps: [
        'Verify continuous ventilation.',
        'Confirm leak detector availability.',
        'Record controls before charging.',
      ],
      offlineReady: true,
    },
    {
      id: 'en-r717',
      language: 'en',
      title: 'Ammonia escalation',
      refrigerantCode: 'R-717',
      severity: 'blue',
      steps: [
        'Evacuate and notify the supervisor.',
        'Use respiratory protection.',
        'Isolate the area before intervention.',
      ],
      offlineReady: true,
    },
  ],
  fr: [
    {
      id: 'fr-r290',
      language: 'fr',
      title: 'Fuite de propane',
      refrigerantCode: 'R-290',
      severity: 'red',
      steps: [
        "Couper les sources d'allumage.",
        'Ventiler immediatement la zone.',
        'Ne pas re-energiser avant verification.',
      ],
      offlineReady: true,
    },
    {
      id: 'fr-r32',
      language: 'fr',
      title: 'Controle A2L sur site',
      refrigerantCode: 'R-32',
      severity: 'orange',
      steps: [
        'Verifier la ventilation continue.',
        'Confirmer le detecteur de fuite.',
        'Consigner les controles avant recharge.',
      ],
      offlineReady: true,
    },
    {
      id: 'fr-r717',
      language: 'fr',
      title: 'Escalade ammoniac',
      refrigerantCode: 'R-717',
      severity: 'blue',
      steps: [
        'Evacuer et notifier le superviseur.',
        'Porter la protection respiratoire.',
        'Isoler la zone avant toute intervention.',
      ],
      offlineReady: true,
    },
  ],
};

export function getEmergencySafetyScripts(language: AppLanguage): EmergencySafetyScript[] {
  return SAFETY_SCRIPTS[language] ?? SAFETY_SCRIPTS.en;
}

export function getEmergencySafetyScriptForQuery(
  query: string,
  language: AppLanguage,
): EmergencySafetyScript | null {
  const normalized = query.toUpperCase().replace(/\s+/g, '');
  return getEmergencySafetyScripts(language).find((script) =>
    normalized.includes(script.refrigerantCode.replace('-', '')),
  ) ?? null;
}

/**
 * Fetch scripts from the static JSON files cached by the service worker.
 * Falls back to the in-memory scripts if the fetch fails (e.g. offline).
 */
export async function fetchOfflineSafetyScripts(language: AppLanguage): Promise<EmergencySafetyScript[]> {
  try {
    const res = await fetch(`/emergency-safety/${language}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { scripts: Omit<EmergencySafetyScript, 'id' | 'language' | 'offlineReady'>[] };
    return data.scripts.map((script, index) => ({
      ...script,
      id: `${language}-fetched-${index}`,
      language,
      offlineReady: true,
    }));
  } catch {
    return getEmergencySafetyScripts(language);
  }
}
