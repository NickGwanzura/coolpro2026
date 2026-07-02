'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, FlaskConical, ShieldAlert, FileText, Wrench, Image as ImageIcon } from 'lucide-react';
import { useRefrigerant } from '@/lib/api';
import { refrigerantLabel } from '@/components/RefrigerantAutocomplete';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-900">{value || '—'}</p>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof FlaskConical; title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
        <Icon className="h-5 w-5 text-[#D97706]" />
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function RefrigerantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: r, isLoading, error } = useRefrigerant(Number(id));

  if (isLoading) {
    return <div className="p-8 text-sm text-gray-500">Loading refrigerant details…</div>;
  }

  if (error || !r) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-gray-500">Refrigerant not found.</p>
        <Link href="/refrigerants" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#D97706]">
          <ArrowLeft className="h-4 w-4" /> Back to catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/refrigerants" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Back to catalogue
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{refrigerantLabel(r)}</h1>
          <p className="mt-1 text-gray-500">{r.odsName}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {r.ashraeSafetyGroup && (
            <span className="px-2.5 py-1 text-xs font-bold bg-gray-100 text-gray-700">ASHRAE {r.ashraeSafetyGroup}</span>
          )}
          {r.isHFC && <span className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700">HFC</span>}
          {r.isHCFC && <span className="px-2.5 py-1 text-xs font-semibold bg-purple-50 text-purple-700">HCFC</span>}
          {r.isCFC && <span className="px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700">CFC</span>}
          {!r.isSingle && <span className="px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-600">Blend</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section icon={FlaskConical} title="General">
          <div className="grid grid-cols-2 gap-4">
            <Field label="ODS Name" value={r.odsName} />
            <Field label="ASHRAE Code" value={r.ashraeCode} />
            <Field label="Chemical Name" value={r.chemicalNameList.join(', ')} />
            <Field label="Chemical Type" value={r.chemicalType} />
            <Field label="Formula" value={r.formulaList.join(', ')} />
            <Field label="Alternative Formula" value={r.alternativeFormulaList.join(', ')} />
            <Field label="Trade Names" value={r.commonTradeNameList.join(', ')} />
            <Field label="Alternative Names" value={r.alternativeChemicalNameList.join(', ')} />
            <Field label="CAS Number" value={r.casCode} />
          </div>
        </Section>

        <Section icon={ShieldAlert} title="Environmental">
          <div className="grid grid-cols-2 gap-4">
            <Field label="GWP" value={r.gwp} />
            <Field label="GWP Source" value={r.gwpSource} />
            <Field label="ODP" value={r.odp} />
            <Field label="ODP Source" value={r.odpSource} />
            <Field label="Kigali GWP Value" value={r.kigaliGwpValue} />
            <Field label="Montreal Protocol Value" value={r.mpValue} />
          </div>
        </Section>

        <Section icon={ShieldAlert} title="Safety">
          <div className="grid grid-cols-2 gap-4">
            <Field label="ASHRAE Safety Group" value={r.ashraeSafetyGroup} />
            <Field label="Flammability" value={r.flammability} />
            <Field label="Toxicity" value={r.toxicity} />
            <Field label="Hazard Symbols" value={r.dangerSymbol.length > 0 ? `${r.dangerSymbol.length} symbol(s)` : null} />
          </div>
        </Section>

        <Section icon={FileText} title="Regulatory">
          <div className="grid grid-cols-2 gap-4">
            <Field label="HS Code" value={r.hsCode} />
            <Field label="HS Code 2017" value={r.hsCode2017} />
            <Field label="HS Code 2022" value={r.hsCode2022} />
            <Field label="UN Number" value={r.unCode} />
            <Field label="Annex Group" value={r.annexGroupName} />
            <Field label="Montreal Protocol Controlled" value={r.isCtrlMontrealProtocol ? 'Yes' : 'No'} />
          </div>
        </Section>

        <Section icon={Wrench} title="Applications">
          {r.realApplications.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {r.realApplications.map((app) => (
                <li key={app} className="bg-gray-50 px-3 py-1.5 text-sm text-gray-700">{app}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No applications on record.</p>
          )}
        </Section>

        <Section icon={ImageIcon} title="Images">
          {r.hasIcon || r.images.length > 0 ? (
            <p className="text-sm text-gray-500">This refrigerant has {r.images.length} image(s) / icon in the WhatGas database.</p>
          ) : (
            <p className="text-sm text-gray-400">No images available.</p>
          )}
        </Section>
      </div>
    </div>
  );
}
