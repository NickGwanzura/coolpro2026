'use client';

import React, { useMemo, useState } from 'react';
import {
  SELECTABLE_REFRIGERANTS,
  defaultEvaporatorTd,
  selectEquipment,
  suggestRefrigerant,
  type SelectableRefrigerant,
} from '@/lib/equipment-selection';

interface Props {
  loadKw: number;
  roomTempC: number;
  ambientTempC: number;
}

const fieldClass = 'mt-1 w-full border border-emerald-200 bg-white px-2 py-1.5 text-sm text-gray-900';

const Row = ({ label, value, note }: { label: string; value: string; note?: string }) => (
  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-emerald-100 py-2 last:border-b-0">
    <dt className="text-xs font-semibold text-gray-700">{label}</dt>
    <dd className="text-right text-sm font-semibold text-gray-900">
      {value}
      {note && <span className="block text-xs font-normal text-gray-600">{note}</span>}
    </dd>
  </div>
);

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="border border-emerald-100 bg-white p-3">
    <h4 className="text-xs font-bold uppercase tracking-wide text-emerald-900">{title}</h4>
    <dl className="mt-1">{children}</dl>
  </section>
);

const EquipmentSelectionPanel: React.FC<Props> = ({ loadKw, roomTempC, ambientTempC }) => {
  const [refrigerant, setRefrigerant] = useState<SelectableRefrigerant>(suggestRefrigerant(roomTempC));
  const [runtime, setRuntime] = useState(18);
  const [evapTd, setEvapTd] = useState<number | null>(null);
  const [condTd, setCondTd] = useState(12);

  const evaporatorTdK = evapTd ?? defaultEvaporatorTd(roomTempC);
  const valid = loadKw > 0 && runtime >= 8 && runtime <= 24 && evaporatorTdK > 0 && condTd > 0;

  const sel = useMemo(
    () => (valid ? selectEquipment({ refrigerant, loadKw, roomTempC, ambientTempC, runtimeHoursPerDay: runtime, evaporatorTdK, condenserTdK: condTd }) : null),
    [valid, refrigerant, loadKw, roomTempC, ambientTempC, runtime, evaporatorTdK, condTd],
  );

  const num = (v: string) => (v === '' ? 0 : Number(v));

  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm font-semibold text-emerald-900">Indicative equipment and pipe sizes</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="text-xs font-semibold text-gray-700">Refrigerant
          <select className={fieldClass} value={refrigerant} onChange={(e) => setRefrigerant(e.target.value as SelectableRefrigerant)}>
            {SELECTABLE_REFRIGERANTS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-gray-700">Compressor run time (h/day)
          <input type="number" min={8} max={24} step={1} className={fieldClass} value={runtime} onChange={(e) => setRuntime(num(e.target.value))} />
        </label>
        <label className="text-xs font-semibold text-gray-700">Evaporator TD (K)
          <input type="number" min={2} max={15} step={1} className={fieldClass} value={evaporatorTdK} onChange={(e) => setEvapTd(num(e.target.value))} />
        </label>
        <label className="text-xs font-semibold text-gray-700">Condenser TD over ambient (K)
          <input type="number" min={5} max={25} step={1} className={fieldClass} value={condTd} onChange={(e) => setCondTd(num(e.target.value))} />
        </label>
      </div>

      {!sel && <p className="text-xs text-amber-900">Enter a cooling load above zero and a run time between 8 and 24 hours to see sizes.</p>}

      {sel && (
        <>
          <p className="text-xs leading-5 text-emerald-900">
            Design point: evaporating {sel.evaporatingC.toFixed(0)} °C ({sel.evaporatingBar.toFixed(1)} bar abs), condensing {sel.condensingC.toFixed(0)} °C ({sel.condensingBar.toFixed(1)} bar abs), pressure ratio {sel.pressureRatio.toFixed(1)}.
            Required capacity {sel.designCapacityKw.toFixed(1)} kW (average load {loadKw.toFixed(1)} kW over {runtime} h/day).
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <Card title="Compressor">
              <Row label="Capacity needed" value={`${sel.compressor.capacityKw.toFixed(1)} kW`} note={`at ${sel.evaporatingC.toFixed(0)} / ${sel.condensingC.toFixed(0)} °C`} />
              <Row label="Swept volume" value={`${sel.compressor.sweptVolumeM3h.toFixed(0)} m³/h`} />
              <Row label="Electrical input" value={`about ${sel.compressor.electricalKw.toFixed(1)} kW`} note={`COP about ${sel.compressor.cop.toFixed(1)}`} />
              <Row label="Type" value={sel.compressor.type} />
            </Card>
            <Card title="Condenser">
              <Row label="Heat rejection" value={`${sel.condenser.heatRejectionKw.toFixed(1)} kW`} note={`at ${condTd} K above ${ambientTempC} °C ambient`} />
            </Card>
            <Card title="Evaporator (air cooler)">
              <Row label="Capacity" value={`${sel.evaporator.capacityKw.toFixed(1)} kW`} note={`at ${evaporatorTdK} K TD`} />
              <Row label="Air flow" value={`${Math.round(sel.evaporator.airflowM3h).toLocaleString()} m³/h`} note={`${sel.evaporator.airDeltaTK} K air temperature drop`} />
            </Card>
            <Card title="Expansion device">
              <Row label="Valve capacity needed" value={`${sel.expansion.requiredKw.toFixed(1)} kW`} note={`${sel.expansion.requiredTr.toFixed(1)} TR`} />
              <Row label="Typical nominal class" value={sel.expansion.nominalClassTr ? `${sel.expansion.nominalClassTr} TR` : 'Above standard range'} note="includes a 25% allowance" />
              <Row label="Suggested type" value={sel.expansion.type} />
            </Card>
          </div>
          <Card title="Copper line sizes (ACR, outside diameter)">
            <Row label="Suction line" value={sel.lines.suction.size} note={`${sel.lines.suction.velocityMs.toFixed(1)} m/s`} />
            <Row label="Discharge line" value={sel.lines.discharge.size} note={`${sel.lines.discharge.velocityMs.toFixed(1)} m/s`} />
            <Row label="Liquid line" value={sel.lines.liquid.size} note={`${sel.lines.liquid.velocityMs.toFixed(2)} m/s`} />
          </Card>
          {sel.warnings.length > 0 && (
            <ul role="note" className="list-disc space-y-1 border border-amber-200 bg-amber-50 py-3 pl-7 pr-4 text-xs leading-5 text-amber-900">
              {sel.warnings.map((w) => <li key={w}>{w}</li>)}
            </ul>
          )}
          <p className="text-xs leading-5 text-emerald-900">
            These are first-pass sizes from estimated refrigerant properties. Lines are sized on velocity only (suction 12 m/s, discharge 15 m/s, liquid 1.2 m/s maximum), so check pressure drop for the real route and length, and oil return in risers.
            Confirm every item against the manufacturer&apos;s selection software at the design conditions before ordering. Charge limits, safety class and local codes still apply.
          </p>
        </>
      )}
    </div>
  );
};

export default EquipmentSelectionPanel;
