'use client';

import { useMemo, useSyncExternalStore } from 'react';
import SupplierComplianceHub from '@/components/SupplierComplianceHub';
import { getSession, type UserSession } from '@/lib/auth';
import { STORAGE_KEYS } from '@/lib/platformStore';
import type { SupplierRegistration } from '@/types/index';

export default function SupplierCompliancePage() {
    const session = useSyncExternalStore<UserSession | null>(
        () => () => undefined,
        () => getSession(),
        () => null
    );
    const supplierApplications = useSyncExternalStore(
        () => () => undefined,
        () => {
            if (typeof window === 'undefined') return [] as SupplierRegistration[];
            const raw = window.localStorage.getItem(STORAGE_KEYS.supplierApplications);
            if (!raw) return [] as SupplierRegistration[];

            try {
                return JSON.parse(raw) as SupplierRegistration[];
            } catch {
                return [] as SupplierRegistration[];
            }
        },
        () => [] as SupplierRegistration[]
    );

    const application = useMemo(() => {
        if (!session) return undefined;
        return supplierApplications.find((entry) => entry.email === session.email);
    }, [session, supplierApplications]);

    if (!session) {
        return null;
    }

    return <SupplierComplianceHub session={session} application={application} />;
}
