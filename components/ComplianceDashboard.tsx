'use client';

import React, { useMemo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Download, ShieldCheck, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import OccupationalAccidentSection from './OccupationalAccidentSection';
import { useReorders, useTechnicians, useGasLogs } from '@/lib/api';
import { REFRIGERANT_REFERENCE } from '@/constants/refrigerants';

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
  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-default">
    <div className="flex justify-between items-start mb-3">
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${positive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        }`}>
        {positive ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
        {trend}
      </span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-3xl font-bold text-gray-900">{value}</span>
      <span className="text-sm font-medium text-gray-400">{unit}</span>
    </div>
    <p className="mt-3 text-xs text-gray-500">{description}</p>
  </div>
);

const ComplianceDashboard: React.FC = () => {
  const { data: reorders = [] } = useReorders();
  const { data: technicians = [] } = useTechnicians();
  const leakLookbackFrom = useMemo(() => {
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return from.toISOString();
  }, []);
  const { data: gasLogs = [] } = useGasLogs(leakLookbackFrom, undefined, 100);

  // Leak Repair entries logged via the Field Toolkit in the last 30 days, most recent first.
  const leakAlerts = useMemo(
    () =>
      gasLogs
        .filter(log => log.actionType === 'Leak Repair')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5),
    [gasLogs]
  );

  // Compute last 6 months of refrigerant volume from reorders
  const usageData = useMemo(() => {
    const now = new Date();
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const buckets: Array<{ key: string; month: string; consumption: number }> = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.push({ key, month: monthLabels[d.getMonth()], consumption: 0 });
    }

    for (const reorder of reorders) {
      const created = new Date(reorder.createdAt);
      const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
      const bucket = buckets.find(b => b.key === key);
      if (bucket) {
        bucket.consumption += reorder.quantityKg;
      }
    }

    return buckets.map(({ month, consumption }) => ({ month, consumption }));
  }, [reorders]);

  const topPerformers = useMemo(
    () =>
      technicians
        .map(tech => ({
          id: tech.id,
          name: tech.name,
          validCertCount: tech.certifications.filter(cert => cert.status === 'valid').length,
        }))
        .sort((a, b) => b.validCertCount - a.validCertCount)
        .slice(0, 3),
    [technicians]
  );

  const kpiValues = useMemo(() => {
    const approvedReorders = reorders.filter(r => r.status === 'approved');
    const totalKg = approvedReorders.reduce((sum, r) => sum + r.quantityKg, 0);

    const gwpImpactTonnes = approvedReorders.reduce((sum, r) => {
      const gwp = REFRIGERANT_REFERENCE[r.gasType]?.gwp ?? 0;
      return sum + (r.quantityKg * gwp) / 1000;
    }, 0);

    const naturalKg = approvedReorders
      .filter(r => NATURAL_REFRIGERANTS.has(r.gasType))
      .reduce((sum, r) => sum + r.quantityKg, 0);
    const naturalSharePct = totalKg > 0 ? Math.round((naturalKg / totalKg) * 100) : 0;

    const activeCerts = technicians.reduce(
      (sum, tech) => sum + tech.certifications.filter(cert => cert.status === 'valid').length,
      0
    );

    return {
      gwpImpactTonnes: Math.round(gwpImpactTonnes),
      naturalSharePct,
      activeCerts,
      approvedKg: Math.round(totalKg),
      pendingReviewCount: reorders.filter(r => r.status === 'pending_hevacraz' || r.status === 'pending_nou').length,
    };
  }, [reorders, technicians]);

  const exportPdf = async () => {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('HEVACRAZ Compliance Report', 14, 18);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString('en-ZW')}`, 14, 26);

    autoTable(doc, {
      startY: 34,
      head: [['Metric', 'Value']],
      body: [
        ['Total GWP Impact', `${kpiValues.gwpImpactTonnes.toLocaleString()} tCO2e`],
        ['Approved Refrigerant Volume', `${kpiValues.approvedKg.toLocaleString()} kg`],
        ['Active Technicians', `${technicians.filter(t => t.status === 'active').length}`],
        ['Valid Certifications', `${kpiValues.activeCerts}`],
        ['Natural Gas Transition', `${kpiValues.naturalSharePct}%`],
        ['Pending Reorder Reviews', `${kpiValues.pendingReviewCount}`],
      ],
      headStyles: { fillColor: [15, 23, 42] },
    });

    doc.save(`hevacraz-compliance-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total GWP Impact"
          value={kpiValues.gwpImpactTonnes.toLocaleString()}
          unit="tCO2e"
          trend="YTD"
          positive={false}
          description="Approved reorders weighted by refrigerant GWP"
        />
        <KpiCard
          label="Approved Volume"
          value={kpiValues.approvedKg.toLocaleString()}
          unit="kg"
          trend={`${kpiValues.pendingReviewCount} pending`}
          positive={true}
          description="Approved refrigerant reorders with active review backlog"
        />
        <KpiCard
          label="Active Technicians"
          value={String(technicians.filter(t => t.status === 'active').length)}
          unit="Certified"
          trend={`${kpiValues.activeCerts} valid certs`}
          positive={true}
          description="Technicians currently active in the registry"
        />
        <KpiCard
          label="Natural Gas Transition"
          value={String(kpiValues.naturalSharePct)}
          unit="%"
          trend="Approved volumes"
          positive={true}
          description="Share of approved reorders using R-290/R-744/R-717"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Refrigerant Phasedown Progress</h3>
              <p className="text-sm text-gray-500">Monthly aggregate of approved and submitted reorders</p>
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
                <Area type="monotone" dataKey="consumption" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorCons)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Alerts */}
          <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-lg">
            <h4 className="text-base font-semibold mb-4">Critical Leak Alerts</h4>
            {leakAlerts.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-400" />
                  <p>
                    No active leak alerts in the last 30 days. Leak reports appear here when submitted via the Field Toolkit.
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

          {/* Top Performers */}
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
            <h4 className="text-base font-semibold text-emerald-900 mb-4">Top Tech Performers</h4>
            {topPerformers.length === 0 ? (
              <p className="rounded-xl border border-emerald-200 bg-white/60 p-3 text-sm text-emerald-800">
                No technicians registered yet.
              </p>
            ) : (
              <div className="space-y-2">
                {topPerformers.map((tech) => (
                  <div key={tech.id} className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-emerald-200">
                    <span className="text-sm font-semibold text-emerald-800">{tech.name}</span>
                    <span className="text-xs font-bold bg-emerald-500 text-white px-2 py-1 rounded-full">
                      {tech.validCertCount} {tech.validCertCount === 1 ? 'cert' : 'certs'}
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
