'use client';

import { useEffect, useState } from 'react';
import { BellRing, CalendarDays, Gauge, ShieldCheck, Wrench } from 'lucide-react';
import { getSession, type UserSession } from '@/lib/auth';
import FieldScheduling from '@/components/FieldScheduling';

const ALLOWED_ROLES: UserSession['role'][] = ['technician'];

function AccessDenied() {
    return (
        <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-red-50 p-3 text-red-600">
                    <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900">Field Scheduling Access Required</h1>
                    <p className="text-sm text-gray-600">
                        This equipment and alert workspace is available to technicians only.
                    </p>
                </div>
            </div>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="flex min-h-[320px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
    );
}

export default function FieldSchedulingPage() {
    const [session, setSession] = useState<UserSession | null | undefined>(undefined);

    useEffect(() => {
        setSession(getSession());
    }, []);

    if (session === undefined) {
        return <LoadingState />;
    }

    if (!session || !ALLOWED_ROLES.includes(session.role)) {
        return <AccessDenied />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
                        <BellRing className="h-4 w-4" />
                        Predictive Maintenance
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Field Scheduling</h1>
                    <p className="max-w-2xl text-sm text-gray-500 sm:text-base">
                        Monitor service intervals, surface due-soon equipment, and move predictive alerts into the planner.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
                    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
                            <Gauge className="h-3.5 w-3.5" />
                            Equipment
                        </div>
                        <p className="mt-1 text-sm font-semibold text-gray-900">Mock fleet view</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Alerts
                        </div>
                        <p className="mt-1 text-sm font-semibold text-gray-900">Predictive reminders</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
                            <Wrench className="h-3.5 w-3.5" />
                            Action
                        </div>
                        <p className="mt-1 text-sm font-semibold text-gray-900">Schedule service</p>
                    </div>
                </div>
            </div>

            <FieldScheduling />
        </div>
    );
}
