"use client";

export const STORAGE_KEYS = {
    plannerJobs: 'coolpro_job_planner_jobs',
    fieldSchedulingRecords: 'coolpro_field_scheduling_records',
    trainingSessions: 'coolpro_training_sessions',
    trainerCertificateRequests: 'coolpro_trainer_certificate_requests',
    supplierApplications: 'coolpro_supplier_applications',
    supplierComplianceApplications: 'coolpro_supplier_compliance_applications',
    supplierLedger: 'coolpro_supplier_ledger',
    supplierProfilesLegacy: 'coolpro_supplier_profiles',
    fieldToolkitInstallations: 'field_toolkit_installations',
    fieldToolkitLogs: 'refrigerant_logs',
} as const;

function isBrowser() {
    return typeof window !== 'undefined';
}

export function readCollection<T>(key: string, fallback: T[] = [], legacyKeys: string[] = []): T[] {
    if (!isBrowser()) return fallback;

    const keysToCheck = [key, ...legacyKeys];
    for (const currentKey of keysToCheck) {
        const stored = window.localStorage.getItem(currentKey);
        if (!stored) continue;

        try {
            const parsed = JSON.parse(stored) as T[];
            if (currentKey !== key) {
                window.localStorage.setItem(key, JSON.stringify(parsed));
                window.localStorage.removeItem(currentKey);
            }
            return parsed;
        } catch {
            window.localStorage.removeItem(currentKey);
        }
    }

    return fallback;
}

export function writeCollection<T>(key: string, items: T[]) {
    if (!isBrowser()) return;
    window.localStorage.setItem(key, JSON.stringify(items));
}

export function prependCollectionItem<T>(key: string, item: T, fallback: T[] = [], legacyKeys: string[] = []) {
    const existing = readCollection<T>(key, fallback, legacyKeys);
    const next = [item, ...existing];
    writeCollection(key, next);
    return next;
}
