
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { UserRole } from '../types';
import { TrendingDown, TrendingUp, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import OccupationalAccidentSection from './OccupationalAccidentSection';

const usageData = [
  { month: 'Jan', consumption: 1200, leaks: 15 },
  { month: 'Feb', consumption: 950, leaks: 8 },
  { month: 'Mar', consumption: 1400, leaks: 12 },
  { month: 'Apr', consumption: 400, leaks: 4 },
  { month: 'May', consumption: 600, leaks: 2 },
  { month: 'Jun', consumption: 350, leaks: 1 },
];

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

interface AlertItemProps {
  severity: 'critical' | 'warning' | 'info';
  label: string;
  info: string;
}

const AlertItem: React.FC<AlertItemProps> = ({ severity, label, info }) => {
  const styles = {
    critical: 'bg-red-50 border-red-400',
    warning: 'bg-amber-50 border-amber-400',
    info: 'bg-blue-50 border-blue-400',
  };

  const textStyles = {
    critical: 'text-red-800',
    warning: 'text-amber-800',
    info: 'text-blue-800',
  };

  const dotStyles = {
    critical: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
  };

  return (
    <div className={`p-4 rounded-xl border-l-4 ${styles[severity]}`}>
      <div className="flex justify-between items-center">
        <span className={`text-sm font-semibold ${textStyles[severity]}`}>{label}</span>
        <span className={`w-2 h-2 rounded-full ${dotStyles[severity]}`}></span>
      </div>
      <p className={`text-xs mt-1 font-medium uppercase tracking-wide ${textStyles[severity]} opacity-70`}>{info}</p>
    </div>
  );
};

const ComplianceDashboard: React.FC<{ role: UserRole }> = ({ role }) => {
  return (
    <div className="space-y-6">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total GWP Impact"
          value="4,250"
          unit="tCO2e"
          trend="-18%"
          positive={false}
          description="Cumulative emissions for Region A"
        />
        <KpiCard
          label="Leak Rate"
          value="4.2"
          unit="%"
          trend="-2.1%"
          positive={true}
          description="Target: < 5% (Kigali Limit)"
        />
        <KpiCard
          label="Active Technicians"
          value="156"
          unit="Certified"
          trend="+12"
          positive={true}
          description="Q2 Training progress"
        />
        <KpiCard
          label="Natural Gas Transition"
          value="24"
          unit="%"
          trend="+5%"
          positive={true}
          description="Sites using R-290/R-744"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Refrigerant Phasedown Progress</h3>
              <p className="text-sm text-gray-500">Monthly aggregate for commercial sector</p>
            </div>
            <button className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">
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
            <div className="space-y-3">
              <AlertItem severity="critical" label="SuperStore #22" info="12kg loss in 24h" />
              <AlertItem severity="warning" label="Warehouse C-5" info="Detected low suction" />
              <AlertItem severity="info" label="Logistics Hub" info="Maintenance due in 2d" />
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
            <h4 className="text-base font-semibold text-emerald-900 mb-4">Top Tech Performers</h4>
            <div className="space-y-2">
              {[
                { name: "Sarah Miller", points: 1450 },
                { name: "Kwame Nkrumah", points: 1220 },
                { name: "Elena Rossi", points: 1180 }
              ].map((tech, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-emerald-200">
                  <span className="text-sm font-semibold text-emerald-800">{tech.name}</span>
                  <span className="text-xs font-bold bg-emerald-500 text-white px-2 py-1 rounded-full">{tech.points} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <OccupationalAccidentSection
        isAdmin={true}
        initialAccidents={[
          {
            id: 'acc1',
            date: '2026-02-24',
            jobSite: 'Harare Central Substation',
            clientName: 'ZESA Holdings',
            severity: 'High',
            description: 'Electrical arc flash during maintenance. No injuries reported.',
            technicianName: 'John Moyo'
          },
          {
            id: 'acc2',
            date: '2026-02-25',
            jobSite: 'Bulawayo Cold Storage',
            clientName: 'Cold Storage Commission',
            severity: 'Critical',
            description: 'Major refrigerant leak (R-717) detected. Site evacuated.',
            technicianName: 'Sarah Miller'
          }
        ]}
      />
    </div>
  );
};

export default ComplianceDashboard;
