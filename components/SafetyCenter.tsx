'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, ClipboardList, ShieldAlert, ShieldCheck } from 'lucide-react';
import OccupationalAccidentSection from '@/components/OccupationalAccidentSection';
import HealthSafetyPage from '@/app/(app)/health-safety/page';
import { useClientSession } from '@/lib/useClientSession';
import { cn } from '@/lib/utils';

type SafetyTab = 'incidents' | 'hazards';

const TABS: Array<{
    id: SafetyTab;
    label: string;
    description: string;
    icon: typeof ShieldCheck;
}> = [
    {
        id: 'incidents',
        label: 'Incidents',
        description: 'Report accidents, capture investigations, and track corrective actions.',
        icon: ClipboardList,
    },
    {
        id: 'hazards',
        label: 'Hazards',
        description: 'ASHRAE hazard checklist, refrigerant controls, and safety learning.',
        icon: ShieldAlert,
    },
];

function getTab(value: string | null): SafetyTab {
    return value === 'hazards' ? 'hazards' : 'incidents';
}

export default function SafetyCenter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const session = useClientSession();
    const activeTab = getTab(searchParams.get('tab'));
    const isAdmin = session?.role === 'org_admin';

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl space-y-2">
                        <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-700">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Unified safety tool
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">Safety Center</h1>
                        <p className="text-sm leading-6 text-gray-600">
                            One workspace for incident reporting, accident investigations, hazard controls, and ASHRAE safety guidance.
                        </p>
                    </div>
                    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
                        <p className="font-semibold">Field safety workflow</p>
                        <p className="mt-1 text-xs leading-5">Report → investigate → prevent recurrence → reinforce hazard controls.</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => router.push(`/safety-center?tab=${tab.id}`)}
                            className={cn(
                                'rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-red-300',
                                isActive
                                    ? 'border-red-200 bg-red-50 shadow-sm'
                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <span className={cn('rounded-lg p-2', isActive ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500')}>
                                    <Icon className="h-4 w-4" />
                                </span>
                                <span className="font-bold text-gray-900">{tab.label}</span>
                            </div>
                            <p className="mt-3 text-sm leading-5 text-gray-600">{tab.description}</p>
                        </button>
                    );
                })}
            </div>

            {activeTab === 'incidents' && (
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                    <OccupationalAccidentSection isAdmin={isAdmin} />
                </div>
            )}
            {activeTab === 'hazards' && <HealthSafetyPage />}
        </div>
    );
}
