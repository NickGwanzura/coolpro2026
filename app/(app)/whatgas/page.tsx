'use client';

import { FlaskConical, ShieldAlert, ListChecks, Sparkles } from 'lucide-react';
import { RefrigerantIntelligencePanel } from '@/components/RefrigerantIntelligencePanel';

const QUICK_LOOKUPS = [
  { code: 'R-290', label: 'Propane', safety: 'A3 — Higher flammability' },
  { code: 'R-32', label: 'Difluoromethane', safety: 'A2L — Mildly flammable' },
  { code: 'R-744', label: 'CO₂', safety: 'A1 — Non-flammable, high pressure' },
  { code: 'R-717', label: 'Ammonia', safety: 'B2L — Toxic, mildly flammable' },
];

export default function WhatGasPage() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="border border-[#E5E0DB] bg-white p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="shrink-0 p-2.5 mt-1"
              style={{ backgroundColor: 'rgba(217,119,6,0.10)', color: '#D97706' }}
            >
              <FlaskConical className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.22em] uppercase mb-2" style={{ color: '#D97706' }}>
                Refrigerant Intelligence
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: '#1C1917' }}>
                WhatGas + Risk Engine
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                Identify any refrigerant by code, look up its ASHRAE safety class, and surface the
                pre-job controls and PPE you must have on site before opening a circuit.
              </p>
            </div>
          </div>
        </div>

        {/* Three quick-stat tiles */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Tile
            icon={<Sparkles className="h-4 w-4" />}
            title="WhatGas profiles"
            body="Identification, GWP, ODP, and equivalent retrofit options."
          />
          <Tile
            icon={<ShieldAlert className="h-4 w-4" />}
            title="Risk summary"
            body="ASHRAE safety class, alert level, and required PPE."
          />
          <Tile
            icon={<ListChecks className="h-4 w-4" />}
            title="Pre-job checklist"
            body="Hand-off-ready controls before opening any refrigerant circuit."
          />
        </div>
      </div>

      {/* Quick lookup chips */}
      <div className="border border-[#E5E0DB] bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 mb-3">
          Quick lookups
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {QUICK_LOOKUPS.map((r) => (
            <a
              key={r.code}
              href={`#whatgas-search-${r.code}`}
              onClick={(e) => {
                e.preventDefault();
                const input = document.querySelector<HTMLInputElement>('input[aria-label="Search refrigerant by code"]');
                if (input) {
                  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
                  setter?.call(input, r.code);
                  input.dispatchEvent(new Event('input', { bubbles: true }));
                  input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className="border border-[#E5E0DB] bg-white px-3 py-2.5 text-left text-sm hover:border-[#D97706] hover:bg-[#FFF7ED] transition-colors"
            >
              <p className="font-semibold" style={{ color: '#1C1917' }}>{r.code}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{r.label}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-400">{r.safety}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Main intelligence panel */}
      <RefrigerantIntelligencePanel initialCode="R-290" />
    </div>
  );
}

function Tile({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="border border-[#E5E0DB] bg-[#FAFAF9] p-4">
      <div className="flex items-center gap-2 text-[#D97706]">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-[0.18em]">{title}</p>
      </div>
      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{body}</p>
    </div>
  );
}
