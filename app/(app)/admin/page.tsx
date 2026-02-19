'use client';

import { useEffect, useState } from 'react';
import { getSession, UserSession } from '@/lib/auth';
import ComplianceDashboard from '@/components/ComplianceDashboard';

export default function AdminPage() {
    const [session, setSession] = useState<UserSession | null>(null);

    useEffect(() => {
        setSession(getSession());
    }, []);

    if (!session) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-500 mt-1">Program administration and compliance monitoring</p>
                </div>
            </div>
            <ComplianceDashboard role={session.role as any} />
        </div>
    );
}
