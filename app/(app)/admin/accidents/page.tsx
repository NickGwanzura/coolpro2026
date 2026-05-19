'use client';

import { useAuth } from '@/lib/auth';
import OccupationalAccidentSection from '@/components/OccupationalAccidentSection';

export default function AccidentsModulePage() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div className="p-8 text-sm text-slate-500">Loading…</div>;
    }

    if (!user || user.role !== 'org_admin') {
        return (
            <div className="border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
                Access restricted to org admins only.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Accidents Module</h1>
                <p className="mt-1 text-gray-500">
                    Centralised oversight of all occupational accidents logged across the network.
                    Investigate incidents, track root causes, and export reports.
                </p>
            </div>
            <OccupationalAccidentSection isAdmin={true} />
        </div>
    );
}
