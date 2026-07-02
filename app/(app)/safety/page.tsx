'use client';

import OccupationalAccidentSection from '@/components/OccupationalAccidentSection';
import { useClientSession } from '@/lib/useClientSession';

export default function SafetyPage() {
    const session = useClientSession();

    const isAdmin = session?.role === 'org_admin';

    return (
        <div className="p-6">
            <OccupationalAccidentSection isAdmin={isAdmin} />
        </div>
    );
}
