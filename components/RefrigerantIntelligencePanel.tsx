'use client';

import { useMemo, useState } from 'react';
import { Info, Search, ShieldAlert } from 'lucide-react';
import { buildPreJobChecklist, getRiskSummary, getWhatGasProfile } from '@/lib/refrigerantIntelligence';
import { RefrigerantRiskBadge } from '@/components/RefrigerantRiskBadge';

export function RefrigerantIntelligencePanel({
    initialCode = 'R-290',
}: {
    initialCode?: string;
}) {
    const [query, setQuery] = useState(initialCode);
    const profile = useMemo(() => getWhatGasProfile(query), [query]);
    const summary = useMemo(() => getRiskSummary(query), [query]);
    const checklist = useMemo(() => buildPreJobChecklist(query), [query]);

    return (
        <section className="border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">WhatGas + risk engine</p>
                    <h2 className="mt-2 text-xl font-bold text-gray-900">Refrigerant Intelligence</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                        Look up refrigerant handling guidance, safety class, and the pre-job controls that should be loaded into the field pack.
                    </p>
                </div>
                <label className="flex w-full items-center gap-2 border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 lg:max-w-xs" aria-label="Search refrigerants">
                    <Search className="h-4 w-4" aria-hidden="true" />
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search refrigerant code"
                        aria-label="Search refrigerant by code"
                        className="w-full bg-transparent outline-none"
                    />
                </label>
            </div>

            {!profile || !summary ? (
                <div className="mt-5 border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-600">
                    Enter a refrigerant code like `R-290`, `R-32`, `R-744`, or `R-717`.
                </div>
            ) : (
                <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                    <article className="border border-gray-200 bg-gray-50 p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-gray-500">{profile.code}</p>
                                <h3 className="mt-1 text-2xl font-bold text-gray-900">{profile.commonName}</h3>
                                <p className="mt-2 text-sm text-gray-600">{profile.typicalUse}</p>
                            </div>
                            <RefrigerantRiskBadge color={summary.color} label={summary.label} />
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            <Metric label="ASHRAE" value={profile.ashraeSafetyClass} />
                            <Metric label="ODP" value={String(profile.odp)} />
                            <Metric label="GWP" value={String(profile.gwp)} />
                        </div>

                        <div className="mt-5 border border-gray-200 bg-white p-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <Info className="h-4 w-4" />
                                Mock WhatGas match
                            </div>
                            <p className="mt-2 text-sm text-gray-600">{profile.whatGasReference}</p>
                            <p className="mt-3 text-sm text-gray-700">{summary.guidance}</p>
                        </div>
                    </article>

                    <article className="border border-gray-200 bg-gray-900 p-5 text-white">
                        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">
                            <ShieldAlert className="h-4 w-4" />
                            Pre-job safety checklist
                        </div>
                        <div className="mt-4 space-y-3">
                            {checklist.map((item) => (
                                <div key={item} className="border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-100">
                                    {item}
                                </div>
                            ))}
                        </div>
                    </article>
                </div>
            )}
        </section>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div className="border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">{label}</p>
            <p className="mt-2 text-xl font-bold text-gray-900">{value}</p>
        </div>
    );
}
