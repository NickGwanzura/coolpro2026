import type {
    AppLanguage,
    OcrScanRecord,
    Refrigerant,
    RefrigerantRiskLevel,
    SafetyAlertColor,
    WhatGasRefrigerantProfile,
} from '@/types/index';
export { getEmergencySafetyScripts } from '@/lib/emergencySafety';

const NAMEPLATE_PATTERNS = {
    refrigerantCode: /(R[- ]?\d{2,3}[A-Z]?)/i,
    serialNumber: /(serial|s\/n|sn)[^\w]?[:#]?\s*([A-Z0-9-]{5,})/i,
    model: /(model)[^\w]?[:#]?\s*([A-Z0-9-]{3,})/i,
};

const RISK_TEXT: Record<SafetyAlertColor, string> = {
    green: 'Green: stable handling profile with standard controls.',
    orange: 'Orange: moderate hazard, reinforce ventilation and ignition checks.',
    red: 'Red: high flammability risk, use strict ignition-source control.',
    blue: 'Blue: toxic or specialist handling profile, escalate supervision.',
};

export function normaliseRefrigerantCode(value: string) {
    return value.toUpperCase().replace(/\s+/g, '').replace('R', 'R-').replace('R--', 'R-');
}

function toProfile(record: Refrigerant): WhatGasRefrigerantProfile {
    const code = record.ashraeCode ?? record.odsName ?? 'Unknown';
    const ashraeSafetyClass = record.ashraeSafetyGroup ?? 'Unclassified';
    const classification = classifySafetyAlert(ashraeSafetyClass);

    return {
        code,
        commonName: record.odsName ?? code,
        ashraeSafetyClass,
        riskColor: classification.color,
        riskLevel: classification.riskLevel,
        typicalUse: record.realApplications?.[0] ?? 'See the WhatGas record for application detail.',
        odp: Number(record.odp) || 0,
        gwp: Number(record.gwp) || 0,
        emergencyNotes: buildEmergencyNotes(record, classification.color),
        fieldChecklist: buildFieldChecklist(record, classification.color),
        whatGasReference: `UNEP WhatGas registry record #${record.id}`,
    };
}

function buildEmergencyNotes(record: Refrigerant, color: SafetyAlertColor): string[] {
    if (color === 'red') {
        return ['Remove ignition sources immediately.', 'Ventilate the space before restarting work.'];
    }
    if (color === 'blue') {
        return ['Evacuate immediately on a large leak.', 'Use respiratory protection and escalate to a supervisor.'];
    }
    if (color === 'orange') {
        return ['Treat as mildly flammable.', 'Verify continuous ventilation when charging.'];
    }
    if (record.toxicity) {
        return [`Toxicity note: ${record.toxicity}`, 'Confirm ventilation before opening the system.'];
    }
    return ['Follow standard leak-response procedure.', 'Confirm ventilation before opening the system.'];
}

function buildFieldChecklist(record: Refrigerant, color: SafetyAlertColor): string[] {
    if (color === 'red') {
        return ['Confirm ventilation', 'Isolate sparks and flame', 'Wear anti-static PPE'];
    }
    if (color === 'blue') {
        return ['Confirm emergency wash stations', 'Use respiratory PPE', 'Notify supervisor before entry'];
    }
    if (color === 'orange') {
        return ['Check ignition controls', 'Use leak detector', 'Record confined-space controls'];
    }
    return ['Confirm pressure relief devices', 'Review high-pressure zone markings', 'Validate ventilation'];
}

/**
 * Looks up a refrigerant against the live UNEP WhatGas-backed registry
 * (synced into the `refrigerants` table). Returns null on no match, no
 * session, or a network/API failure.
 */
export async function fetchWhatGasProfile(code: string | undefined | null): Promise<WhatGasRefrigerantProfile | null> {
    if (!code) return null;

    try {
        const res = await fetch(`/api/refrigerants?q=${encodeURIComponent(code)}&pageSize=1`, {
            credentials: 'include',
        });
        if (!res.ok) return null;

        const body = await res.json() as { data: Refrigerant[] };
        const record = body.data?.[0];
        return record ? toProfile(record) : null;
    } catch {
        return null;
    }
}

export function classifySafetyAlert(ashraeSafetyClass: string): {
    color: SafetyAlertColor;
    riskLevel: RefrigerantRiskLevel;
    label: string;
} {
    const value = ashraeSafetyClass.toUpperCase();

    if (value.startsWith('B')) {
        return { color: 'blue', riskLevel: 'critical', label: `Blue / ${ashraeSafetyClass}` };
    }

    if (value === 'A3') {
        return { color: 'red', riskLevel: 'high', label: 'Red / A3' };
    }

    if (value === 'A2L' || value === 'A2') {
        return { color: 'orange', riskLevel: 'moderate', label: `Orange / ${ashraeSafetyClass}` };
    }

    if (value === 'A1') {
        return { color: 'green', riskLevel: 'low', label: `Green / ${ashraeSafetyClass}` };
    }

    return { color: 'green', riskLevel: 'low', label: `Unclassified / ${ashraeSafetyClass}` };
}

export async function getRiskSummary(code: string | undefined | null) {
    const profile = await fetchWhatGasProfile(code);

    if (!profile) {
        return null;
    }

    const classification = classifySafetyAlert(profile.ashraeSafetyClass);
    return {
        ...classification,
        profile,
        guidance: RISK_TEXT[classification.color],
    };
}

export async function buildPreJobChecklist(code: string | undefined | null) {
    const profile = await fetchWhatGasProfile(code);

    if (!profile) {
        return [
            'Confirm refrigerant identity from the equipment nameplate.',
            'Review PPE, ventilation, and leak-response controls before opening the system.',
            'Record the refrigerant class in the job pack before work starts.',
        ];
    }

    return [
        `Refrigerant confirmed: ${profile.code} (${profile.commonName})`,
        ...profile.fieldChecklist,
        'Capture technician sign-off before starting the job.',
    ];
}

export async function extractNameplateData(rawText: string): Promise<OcrScanRecord> {
    const refrigerantCode = rawText.match(NAMEPLATE_PATTERNS.refrigerantCode)?.[1]?.replace(' ', '-') ?? undefined;
    const serialNumber = rawText.match(NAMEPLATE_PATTERNS.serialNumber)?.[2];
    const model = rawText.match(NAMEPLATE_PATTERNS.model)?.[2];
    const whatGasMatch = await fetchWhatGasProfile(refrigerantCode);

    const manufacturerLine = rawText
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line.length > 3 && /^[A-Z0-9 .,&-]+$/.test(line));

    return {
        id: `ocr-${Date.now()}`,
        createdAt: new Date().toISOString(),
        rawText,
        refrigerantCode,
        manufacturer: manufacturerLine,
        model,
        serialNumber,
        matchConfidence: whatGasMatch ? 0.86 : 0.42,
        whatGasMatch,
    };
}

export async function buildSafetyAssistantResponse(query: string, language: AppLanguage): Promise<string> {
    const code = query.match(NAMEPLATE_PATTERNS.refrigerantCode)?.[1]?.replace(' ', '-');
    const profile = code ? await fetchWhatGasProfile(code) : null;

    if (!profile) {
        return language === 'fr'
            ? 'Identifiez d’abord le refrigerant, puis confirmez la ventilation, les EPI et la procedure de fuite avant de commencer.'
            : 'Identify the refrigerant first, then confirm ventilation, PPE, and leak-response controls before starting work.';
    }

    const classification = classifySafetyAlert(profile.ashraeSafetyClass);
    const checklist = await buildPreJobChecklist(profile.code);
    const steps = checklist.slice(0, 4).join(language === 'fr' ? ' | ' : ' | ');

    return language === 'fr'
        ? `${profile.code} ${profile.commonName} est classe ${profile.ashraeSafetyClass}. Alerte ${classification.color}. Etapes: ${steps}.`
        : `${profile.code} ${profile.commonName} is class ${profile.ashraeSafetyClass}. ${classification.color} alert. Steps: ${steps}.`;
}
