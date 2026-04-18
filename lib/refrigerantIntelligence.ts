import type {
    AppLanguage,
    EmergencySafetyScript,
    OcrScanRecord,
    RefrigerantRiskLevel,
    RefrigerantSafetyClass,
    SafetyAlertColor,
    WhatGasRefrigerantProfile,
} from '@/types/index';

const WHATGAS_PROFILES: Record<string, WhatGasRefrigerantProfile> = {
    'R-290': {
        code: 'R-290',
        commonName: 'Propane',
        ashraeSafetyClass: 'A3',
        riskColor: 'red',
        riskLevel: 'high',
        typicalUse: 'Light commercial cabinets and low-charge systems.',
        odp: 0,
        gwp: 3,
        emergencyNotes: ['Remove ignition sources immediately.', 'Ventilate the space before restarting work.'],
        fieldChecklist: ['Confirm ventilation', 'Isolate sparks and flame', 'Wear anti-static PPE'],
        whatGasReference: 'Mock WhatGas profile for propane systems',
    },
    'R-32': {
        code: 'R-32',
        commonName: 'Difluoromethane',
        ashraeSafetyClass: 'A2L',
        riskColor: 'orange',
        riskLevel: 'moderate',
        typicalUse: 'Split systems and medium-charge commercial equipment.',
        odp: 0,
        gwp: 675,
        emergencyNotes: ['Treat as mildly flammable.', 'Verify continuous ventilation when charging.'],
        fieldChecklist: ['Check ignition controls', 'Use leak detector', 'Record confined-space controls'],
        whatGasReference: 'Mock WhatGas profile for mildly flammable HFC/HFO transition systems',
    },
    'R-744': {
        code: 'R-744',
        commonName: 'Carbon Dioxide',
        ashraeSafetyClass: 'A1',
        riskColor: 'green',
        riskLevel: 'low',
        typicalUse: 'Transcritical commercial refrigeration and cold-chain racks.',
        odp: 0,
        gwp: 1,
        emergencyNotes: ['Monitor pressure closely.', 'Check confined-space ventilation to avoid asphyxiation risk.'],
        fieldChecklist: ['Confirm pressure relief devices', 'Review high-pressure zone markings', 'Validate ventilation'],
        whatGasReference: 'Mock WhatGas profile for CO2 systems',
    },
    'R-717': {
        code: 'R-717',
        commonName: 'Ammonia',
        ashraeSafetyClass: 'B2L',
        riskColor: 'blue',
        riskLevel: 'critical',
        typicalUse: 'Industrial refrigeration plants.',
        odp: 0,
        gwp: 0,
        emergencyNotes: ['Evacuate immediately on large leak.', 'Use respiratory protection and supervisor escalation.'],
        fieldChecklist: ['Confirm emergency wash stations', 'Use respiratory PPE', 'Notify supervisor before entry'],
        whatGasReference: 'Mock WhatGas profile for toxic low-flammability industrial systems',
    },
};

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

export function getWhatGasProfile(code: string | undefined | null) {
    if (!code) {
        return null;
    }

    return WHATGAS_PROFILES[normaliseRefrigerantCode(code)] ?? null;
}

export function classifySafetyAlert(ashraeSafetyClass: RefrigerantSafetyClass): {
    color: SafetyAlertColor;
    riskLevel: RefrigerantRiskLevel;
    label: string;
} {
    if (ashraeSafetyClass.startsWith('B')) {
        return { color: 'blue', riskLevel: 'critical', label: `Blue / ${ashraeSafetyClass}` };
    }

    if (ashraeSafetyClass === 'A3') {
        return { color: 'red', riskLevel: 'high', label: 'Red / A3' };
    }

    if (ashraeSafetyClass === 'A2L' || ashraeSafetyClass === 'A2') {
        return { color: 'orange', riskLevel: 'moderate', label: `Orange / ${ashraeSafetyClass}` };
    }

    return { color: 'green', riskLevel: 'low', label: `Green / ${ashraeSafetyClass}` };
}

export function getRiskSummary(code: string | undefined | null) {
    const profile = getWhatGasProfile(code);

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

export function buildPreJobChecklist(code: string | undefined | null) {
    const profile = getWhatGasProfile(code);

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

export function extractNameplateData(rawText: string): OcrScanRecord {
    const refrigerantCode = rawText.match(NAMEPLATE_PATTERNS.refrigerantCode)?.[1]?.replace(' ', '-') ?? undefined;
    const serialNumber = rawText.match(NAMEPLATE_PATTERNS.serialNumber)?.[2];
    const model = rawText.match(NAMEPLATE_PATTERNS.model)?.[2];
    const whatGasMatch = getWhatGasProfile(refrigerantCode);

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

export function getEmergencySafetyScripts(language: AppLanguage): EmergencySafetyScript[] {
    return [
        {
            id: `${language}-r290`,
            language,
            title: language === 'fr' ? 'Fuite de propane' : 'Propane leak response',
            refrigerantCode: 'R-290',
            severity: 'red',
            steps: language === 'fr'
                ? ['Couper les sources d’allumage.', 'Ventiler immediatement la zone.', 'Ne pas re-energiser avant verification.']
                : ['Stop ignition sources.', 'Ventilate the area immediately.', 'Do not re-energize until the leak is cleared.'],
            offlineReady: true,
        },
        {
            id: `${language}-r32`,
            language,
            title: language === 'fr' ? 'Controle A2L sur site' : 'A2L site control',
            refrigerantCode: 'R-32',
            severity: 'orange',
            steps: language === 'fr'
                ? ['Verifier la ventilation continue.', 'Confirmer le detecteur de fuite.', 'Consigner les controles avant recharge.']
                : ['Verify continuous ventilation.', 'Confirm leak detector availability.', 'Record controls before charging.'],
            offlineReady: true,
        },
        {
            id: `${language}-r717`,
            language,
            title: language === 'fr' ? 'Escalade ammoniac' : 'Ammonia escalation',
            refrigerantCode: 'R-717',
            severity: 'blue',
            steps: language === 'fr'
                ? ['Evacuer et notifier le superviseur.', 'Porter la protection respiratoire.', 'Isoler la zone avant toute intervention.']
                : ['Evacuate and notify the supervisor.', 'Use respiratory protection.', 'Isolate the area before intervention.'],
            offlineReady: true,
        },
    ];
}

export function buildSafetyAssistantResponse(query: string, language: AppLanguage) {
    const queryText = query.toUpperCase();
    const profile = Object.keys(WHATGAS_PROFILES)
        .map((code) => WHATGAS_PROFILES[code])
        .find((item) => queryText.includes(item.code));

    if (!profile) {
        return language === 'fr'
            ? 'Identifiez d’abord le refrigerant, puis confirmez la ventilation, les EPI et la procedure de fuite avant de commencer.'
            : 'Identify the refrigerant first, then confirm ventilation, PPE, and leak-response controls before starting work.';
    }

    const classification = classifySafetyAlert(profile.ashraeSafetyClass);
    const steps = buildPreJobChecklist(profile.code).slice(0, 4).join(language === 'fr' ? ' | ' : ' | ');

    return language === 'fr'
        ? `${profile.code} ${profile.commonName} est classe ${profile.ashraeSafetyClass}. Alerte ${classification.color}. Etapes: ${steps}.`
        : `${profile.code} ${profile.commonName} is class ${profile.ashraeSafetyClass}. ${classification.color} alert. Steps: ${steps}.`;
}
