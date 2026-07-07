'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, FlaskConical, Loader2 } from 'lucide-react';
import { useRefrigerants } from '@/lib/api';
import { refrigerantLabel } from '@/components/RefrigerantAutocomplete';

const SAFETY_BADGE_STYLES: Record<string, string> = {
  A1: 'bg-slate-100 text-slate-600',
  A2: 'bg-orange-100 text-orange-700',
  A2L: 'bg-orange-100 text-orange-700',
  A3: 'bg-red-100 text-red-700',
  B1: 'bg-amber-100 text-amber-700',
  B2: 'bg-red-100 text-red-700',
  B2L: 'bg-red-100 text-red-700',
  B3: 'bg-red-200 text-red-800',
};

type FilterKey = 'isHFC' | 'isHCFC' | 'isCFC' | 'highGwp' | 'isODP' | 'kigali' | 'montreal';

const FILTER_CHIPS: { key: FilterKey; label: string }[] = [
  { key: 'isHFC', label: 'HFC' },
  { key: 'isHCFC', label: 'HCFC' },
  { key: 'isCFC', label: 'CFC' },
  { key: 'highGwp', label: 'High GWP' },
  { key: 'isODP', label: 'ODP' },
  { key: 'kigali', label: 'Kigali Controlled' },
  { key: 'montreal', label: 'Montreal Controlled' },
];

const PAGE_SIZE = 24;

export default function RefrigerantCataloguePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Partial<Record<FilterKey, boolean>>>({});
  const [loadedPages, setLoadedPages] = useState(1);

  const { data, isLoading } = useRefrigerants({
    q: searchTerm || undefined,
    page: 1,
    pageSize: PAGE_SIZE * loadedPages,
    ...filters,
  });

  const toggleFilter = (key: FilterKey) => {
    setLoadedPages(1);
    setFilters((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = true;
      return next;
    });
  };

  const refrigerants = data?.data ?? [];
  const hasMore = data ? refrigerants.length < data.total : false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Refrigerant Catalogue</h1>
        <p className="mt-1 text-gray-500">
          Synced from UNEP OzonAction WhatGas — the single source of truth for refrigerant reference data.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setLoadedPages(1);
            }}
            placeholder="Search by name, ASHRAE code, formula, CAS number, or trade name — e.g. R22, Freon 22, HCFC-22"
            className="w-full border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-300 focus:bg-white"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.key}
              onClick={() => toggleFilter(chip.key)}
              className={`px-3 py-1.5 text-xs font-semibold border transition-colors ${
                filters[chip.key] ? 'border-[#D97706] bg-[#D97706]/10 text-[#D97706]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && loadedPages === 1 && (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading refrigerants…
        </div>
      )}

      {!isLoading && refrigerants.length === 0 && (
        <div className="border border-dashed border-gray-200 bg-white p-12 text-center">
          <FlaskConical className="mx-auto mb-3 h-8 w-8 text-gray-200" />
          <p className="text-sm font-semibold text-gray-400">No refrigerants match your search</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {refrigerants.map((r) => (
          <Link
            key={r.id}
            href={`/refrigerants/${r.id}`}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-gray-900 truncate">{refrigerantLabel(r)}</p>
                <p className="text-xs text-gray-500 truncate">{r.odsName}</p>
              </div>
              {r.ashraeSafetyGroup && (
                <span className={`shrink-0 px-2 py-0.5 text-[11px] font-bold ${SAFETY_BADGE_STYLES[r.ashraeSafetyGroup] ?? 'bg-gray-100 text-gray-500'}`}>
                  {r.ashraeSafetyGroup}
                </span>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3 text-xs">
              <div>
                <p className="font-semibold uppercase tracking-wide text-gray-400">GWP</p>
                <p className="mt-1 font-medium text-gray-900">{r.gwp || '—'}</p>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-wide text-gray-400">ODP</p>
                <p className="mt-1 font-medium text-gray-900">{r.odp || '—'}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {r.isHFC && <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700">HFC</span>}
              {r.isHCFC && <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-purple-50 text-purple-700">HCFC</span>}
              {r.isCFC && <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-50 text-rose-700">CFC</span>}
              {!r.isSingle && <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600">Blend</span>}
            </div>
          </Link>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setLoadedPages((p) => p + 1)}
            disabled={isLoading}
            className="rounded-lg inline-flex items-center gap-2 border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Load more ({refrigerants.length} of {data?.total})
          </button>
        </div>
      )}
    </div>
  );
}
