'use client';

import { AlertTriangle, ShieldCheck } from 'lucide-react';
import type { SafetyAlertColor } from '@/types/index';

const TONE: Record<SafetyAlertColor, string> = {
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    orange: 'border-amber-200 bg-amber-50 text-amber-700',
    red: 'border-rose-200 bg-rose-50 text-rose-700',
    blue: 'border-sky-200 bg-sky-50 text-sky-700',
};

export function RefrigerantRiskBadge({
    color,
    label,
}: {
    color: SafetyAlertColor;
    label: string;
}) {
    const Icon = color === 'green' ? ShieldCheck : AlertTriangle;

    return (
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${TONE[color]}`}>
            <Icon className="h-3.5 w-3.5" />
            {label}
        </span>
    );
}
