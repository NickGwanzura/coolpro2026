import { GoogleGenAI, FunctionCallingConfigMode, type FunctionDeclaration, type Content, Type } from '@google/genai';
import { searchRefrigerants } from '@/lib/whatgas/repository';

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.5-flash';

let _client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  if (!API_KEY) return null;
  if (!_client) _client = new GoogleGenAI({ apiKey: API_KEY });
  return _client;
}

const lookupRefrigerantTool: FunctionDeclaration = {
  name: 'lookup_refrigerant',
  description:
    'Looks up a refrigerant in the UNEP WhatGas registry by name, ASHRAE code, formula, or CAS number. ' +
    'Returns real ASHRAE safety class, GWP, ODP, and flammability/toxicity data. Always call this before ' +
    'stating safety-class, GWP, or ODP figures for a specific refrigerant — never state them from memory.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'Refrigerant code, name, or formula to search for, e.g. "R-290" or "propane".',
      },
    },
    required: ['query'],
  },
};

async function runLookupRefrigerant(query: string): Promise<string> {
  const { rows } = await searchRefrigerants({ q: query }, 1, 3);
  if (rows.length === 0) {
    return JSON.stringify({ found: false, message: `No refrigerant matched "${query}" in the WhatGas registry.` });
  }
  return JSON.stringify({
    found: true,
    matches: rows.map((r) => ({
      code: r.ashraeCode,
      name: r.odsName,
      ashraeSafetyClass: r.ashraeSafetyGroup,
      gwp: r.gwp,
      odp: r.odp,
      flammability: r.flammability,
      toxicity: r.toxicity,
      isHFC: r.isHFC,
      isHCFC: r.isHCFC,
      isCFC: r.isCFC,
    })),
  });
}

const SYSTEM_INSTRUCTION = `You are the HEVACRAZ / National Ozone Unit Zimbabwe field safety voice assistant, used by \
HVAC-R technicians on job sites. Be concise (2-4 sentences, this is spoken aloud), practical, and safety-first. \
Cover: refrigerant handling/safety class, leak response, PPE, ventilation, COC/certificate workflow questions, and \
general HVAC-R compliance questions for Zimbabwe. Always use the lookup_refrigerant tool before stating any \
refrigerant's safety class, GWP, or ODP — never guess these from memory. If asked something outside HVAC-R/safety/\
compliance scope, say so briefly and redirect. Respond in the same language the user asked in (English or French).`;

export type ChatTurn = { role: 'user' | 'model'; text: string };

/**
 * Gemini-backed voice assistant response, grounded in the real WhatGas refrigerant registry via
 * function calling. Returns null (never throws) on any failure or missing API key, so callers can
 * fall back to the rule-based responder — field technicians need the assistant to keep working
 * even when Gemini is unreachable or unconfigured.
 */
export async function getVoiceAssistantResponse(
  message: string,
  history: ChatTurn[] = [],
): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const contents: Content[] = [
      ...history.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
      { role: 'user', parts: [{ text: message }] },
    ];

    let response = await client.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: [lookupRefrigerantTool] }],
        toolConfig: { functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO } },
        temperature: 0.3,
        maxOutputTokens: 400,
      },
    });

    const calls = response.functionCalls;
    if (calls && calls.length > 0) {
      const call = calls[0];
      const query = (call.args?.query as string) ?? '';
      const result = await runLookupRefrigerant(query);

      contents.push(
        { role: 'model', parts: [{ functionCall: call }] },
        { role: 'user', parts: [{ functionResponse: { name: call.name!, response: { result } } }] },
      );

      response = await client.models.generateContent({
        model: MODEL,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: [lookupRefrigerantTool] }],
          temperature: 0.3,
          maxOutputTokens: 400,
        },
      });
    }

    return response.text?.trim() || null;
  } catch (err) {
    console.error('[gemini] voice assistant request failed:', err instanceof Error ? err.message : err);
    return null;
  }
}
