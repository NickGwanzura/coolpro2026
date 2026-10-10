'use client';

import React, { useMemo, useState } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Download, ShieldCheck, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import OccupationalAccidentSection from './OccupationalAccidentSection';
import { useReorders, useTechnicians, useGasLogs } from '@/lib/api';
import { REFRIGERANT_REFERENCE } from '@/constants/refrigerants';
import { Drilldown } from '@/components/ui/Drilldown';
import {
  complianceKpis,
  expiringCertificates,
  monthlyApprovedKg,
  PERIOD_LABEL,
  type CompliancePeriod,
} from '@/lib/compliance-stats';

const NATURAL_REFRIGERANTS = new Set(['R-290', 'R-600a', 'R-744', 'R-717', 'R-1270']);

interface KpiCardProps {
  label: string;
  value: string;
  unit: string;
  trend: string;
  positive: boolean;
  description: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, unit, trend, positive, description }) => (
  <div className="min-w-0 bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <span className={`inline-flex max-w-full flex-wrap items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${positive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        }`}>
        {positive ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
        {trend}
      </span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-3xl font-bold text-gray-900">{value}</span>
      <span className="text-sm font-medium text-gray-400">{unit}</span>
    </div>
    <Drilldown label="Calculation and scope" className="mt-3 border-t border-gray-100 pt-1">
      <p>{description}</p>
      <p className="mt-2">Trend/context: {trend}. The metric reflects the records currently available to this report.</p>
    </Drilldown>
  </div>
);

const LEAK_LOG_LIMIT = 1000;

const ComplianceDashboard: React.FC = () => {
  const [period, setPeriod] = useState<CompliancePeriod>('ytd');
  const [now] = useState(() => Date.now());
  const { data: reorders = [], isLoading: reordersLoading, error: reordersError } = useReorders();
  const { data: technicians = [], isLoading: techniciansLoading, error: techniciansError } = useTechnicians();
  const leakLookbackFrom = useMemo(() => new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(), [now]);
  const { data: gasLogs = [], isLoading: gasLogsLoading, error: gasLogsError } = useGasLogs(leakLookbackFrom, undefined, LEAK_LOG_LIMIT);
  const isLoading = reordersLoading || techniciansLoading || gasLogsLoading;
  const failed = [reordersError && 'reorders', techniciansError && 'the technician registry', gasLogsError && 'leak reports'].filter(Boolean) as string[];

  // Leak Repair entries logged via the Field Toolkit in the last 30 days, most recent first.
  const allLeaks = useMemo(
    () =>
      gasLogs
        .filter(log => log.actionType === 'Leak Repair')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [gasLogs]
  );
  const leakAlerts = allLeaks.slice(0, 5);
  const leaksMayBeTruncated = gasLogs.length >= LEAK_LOG_LIMIT;

  // Approved volume per month. Year to date shows January onward; the other views show 12 months.
  const usageData = useMemo(
    () => monthlyApprovedKg(reorders, period === 'ytd' ? new Date(now).getUTCMonth() + 1 : 12, now),
    [reorders, period, now]
  );

  const expiring = useMemo(() => expiringCertificates(technicians, now), [technicians, now]);

  const kpiValues = useMemo(() => {
    const base = complianceKpis({
      reorders,
      period,
      now,
      gwpOf: gas => REFRIGERANT_REFERENCE[gas]?.gwp,
      naturalGases: NATURAL_REFRIGERANTS,
    });
    const activeCerts = technicians.reduce(
      (sum, tech) => sum + tech.certifications.filter(cert => cert.status === 'valid').length,
      0
    );
    return { ...base, activeCerts };
  }, [reorders, technicians, period, now]);

  const exportPdf = async () => {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('HEVACRAZ Compliance Report', 14, 18);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString('en-ZW')}  |  Period: ${PERIOD_LABEL[period]}`, 14, 26);

    autoTable(doc, {
      startY: 34,
      head: [['Metric', 'Value']],
      body: [
        [`GWP Impact (${PERIOD_LABEL[period]})`, `${kpiValues.gwpImpactTonnes.toLocaleString()} tCO2e`],
        [`Approved Refrigerant Volume (${PERIOD_LABEL[period]})`, `${kpiValues.approvedKg.toLocaleString()} kg`],
        ['Active Technicians', `${technicians.filter(t => t.status === 'active').length}`],
        ['Valid Certifications', `${kpiValues.activeCerts}`],
        [`Natural Gas Share (${PERIOD_LABEL[period]})`, `${kpiValues.naturalSharePct}%`],
        ['Pending Reorder Reviews (now)', `${kpiValues.pendingReviewCount}`],
      ],
      headStyles: { fillColor: [15, 23, 42] },
    });

    doc.save(`hevacraz-compliance-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {failed.length > 0 && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Some figures could not be loaded ({failed.join(', ')}). The numbers below may be incomplete, so do not treat them as final.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">Figures for <span className="font-semibold text-gray-800">{PERIOD_LABEL[period].toLowerCase()}</span>, unless a card says it is current.</p>
        <div className="flex rounded-lg border border-gray-200 bg-white divide-x divide-gray-200" role="group" aria-label="Reporting period">
          {(Object.keys(PERIOD_LABEL) as CompliancePeriod[]).map(option => (
            <button
              key={option}
              type="button"
              onClick={() => setPeriod(option)}
              aria-pressed={period === option}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${period === option ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {PERIOD_LABEL[option]}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="GWP of Approved Reorders"
          value={kpiValues.gwpImpactTonnes.toLocaleString()}
          unit="tCO2e"
          trend={PERIOD_LABEL[period]}
          positive={false}
          description="Approved reorders in the selected period, each weighted by its refrigerant's global warming potential. This is the potential impact of what was bought."
        />
        <KpiCard
          label="Approved Volume"
          value={kpiValues.approvedKg.toLocaleString()}
          unit="kg"
          trend={`${kpiValues.pendingReviewCount} pending now`}
          positive={true}
          description="Refrigerant reorders approved in the selected period. The pending count is the review backlog right now, whatever the period."
        />
        <KpiCard
          label="Active Technicians"
          value={String(technicians.filter(t => t.status === 'active').length)}
          unit="active"
          trend={`${kpiValues.activeCerts} valid certificates`}
          positive={true}
          description="Technicians marked active in the registry right now, and the valid certificates they hold. Not affected by the period."
        />
        <KpiCard
          label="Natural Gas Share"
          value={String(kpiValues.naturalSharePct)}
          unit="%"
          trend={PERIOD_LABEL[period]}
          positive={true}
          description="Share of the approved volume in the selected period that is a natural refrigerant (R-290, R-600a, R-744, R-717, R-1270)."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Refrigerant Purchased</h3>
              <p className="text-sm text-gray-500">Approved reorder volume per month, in kg. Rejected and pending reorders are not included.</p>
            </div>
            <button
              type="button"
              onClick={exportPdf}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </button>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageData}>
                <defs>
                  <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="kg" name="Approved kg" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorCons)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Alerts */}
          <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-lg">
            <h4 className="text-base font-semibold mb-1">Leak Repairs, last 30 days</h4>
            <p className="mb-4 text-xs text-gray-400">{allLeaks.length}{leaksMayBeTruncated ? '+' : ''} reported{leaksMayBeTruncated ? ' (the most recent ' + LEAK_LOG_LIMIT + ' log entries were checked)' : ''}. Showing the latest 5.</p>
            {leakAlerts.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-400" />
                  <p>
                    No leak repairs were reported in the last 30 days. They appear here when technicians log them in the Field Toolkit.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {leakAlerts.map((log) => (
                  <div key={log.id} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                      <div>
                        <p className="font-semibold text-white">{log.technicianName} · {log.amount} kg {log.refrigerantType}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{log.clientName} · {new Date(log.timestamp).toLocaleDateString('en-ZW')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Certificates expiring */}
          <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
            <h4 className="text-base font-semibold text-amber-900 mb-1">Certificates expiring soon</h4>
            <p className="mb-4 text-xs text-amber-800">Active technicians, within 90 days or already expired.</p>
            {expiring.length === 0 ? (
              <p className="rounded-xl border border-amber-200 bg-white/60 p-3 text-sm text-amber-900">
                No certificates are due for renewal in the next 90 days.
              </p>
            ) : (
              <div className="space-y-2">
                {expiring.map((row) => (
                  <div key={`${row.technicianId}-${row.certificate}`} className="flex items-center justify-between gap-3 p-3 bg-white/60 rounded-xl border border-amber-200">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-amber-900">{row.technicianName}</span>
                      <span className="block truncate text-xs text-amber-800">{row.certificate}</span>
                    </span>
                    <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded-full text-white ${row.daysLeft < 0 ? 'bg-red-600' : 'bg-amber-500'}`}>
                      {row.daysLeft < 0 ? `${Math.abs(row.daysLeft)} d overdue` : `${row.daysLeft} d left`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <OccupationalAccidentSection isAdmin={true} />
    </div>
  );
};

export default ComplianceDashboard;
