'use client';

import { useEffect, useState } from 'react';
import OccupationalAccidentSection from '@/components/OccupationalAccidentSection';
import { getSession, type UserSession } from '@/lib/auth';

export default function SafetyPage() {
    const [session, setSession] = useState<UserSession | null>(null);

    useEffect(() => {
        setSession(getSession());
    }, []);

    const isAdmin = session?.role === 'org_admin' || session?.role === 'program_admin';

    return (
        <div className="p-6">
            <OccupationalAccidentSection isAdmin={isAdmin} />
        </div>
    );
}
