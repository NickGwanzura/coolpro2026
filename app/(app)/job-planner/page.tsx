'use client';

import { CalendarRange, ShieldCheck } from 'lucide-react';
import { type UserSession } from '@/lib/auth';
import { useClientSession } from '@/lib/useClientSession';
import JobPlanner from '@/components/JobPlanner';

const ALLOWED_ROLES: UserSession['role'][] = ['technician', 'org_admin'];

export default function JobPlannerPage() {
    const session = useClientSession();

    if (!session || !ALLOWED_ROLES.includes(session.role)) {
        return (
            <div className="mx-auto max-w-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="bg-red-50 p-3 text-red-600">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Access Restricted</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            The Job Planner is available to technicians and organisation admins only.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mb-1">
                        <CalendarRange className="h-3.5 w-3.5" />
                        Technician Operations
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Job Planner</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Plan site visits, track follow-up work, and keep safety checks tied to every refrigerant class.
                    </p>
                </div>
                <div className="flex items-center gap-2 border border-gray-200 bg-white px-4 py-2 shadow-sm self-start sm:self-auto">
                    <CalendarRange className="h-4 w-4 text-[#D97706]" />
                    <span className="text-sm font-semibold text-gray-700">{session.name}</span>
                    <span className="text-xs text-gray-400 capitalize">· {session.role.replace('_', ' ')}</span>
                </div>
            </div>

            <JobPlanner />
        </div>
    );
}
