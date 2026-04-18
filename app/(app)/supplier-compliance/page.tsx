'use client';

import { useMemo } from 'react';
import SupplierComplianceHub from '@/components/SupplierComplianceHub';
import { useAuth } from '@/lib/auth';
import { useSupplierApplications } from '@/lib/api';

export default function SupplierCompliancePage() {
    const { user: session } = useAuth();
    const { data: supplierApplications = [] } = useSupplierApplications();

    const application = useMemo(() => {
        if (!session) return undefined;
        return supplierApplications.find((entry) => entry.email === session.email);
    }, [session, supplierApplications]);

    if (!session) {
        return null;
    }

    return <SupplierComplianceHub session={session} application={application} />;
}
