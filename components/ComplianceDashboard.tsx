
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { UserRole } from '../types';

const usageData = [
  { month: 'Jan', consumption: 1200, leaks: 15 },
  { month: 'Feb', consumption: 950, leaks: 8 },
  { month: 'Mar', consumption: 1400, leaks: 12 },
  { month: 'Apr', consumption: 400, leaks: 4 },
  { month: 'May', consumption: 600, leaks: 2 },
  { month: 'Jun', consumption: 350, leaks: 1 },
];

const ComplianceDashboard: React.FC<{ role: UserRole }> = ({ role }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Refrigerant Phasedown Progress</h3>
              <p className="text-sm text-slate-500">Monthly aggregate for commercial sector</p>
            </div>
            <div className="flex gap-2">
               <button className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">Export PDF</button>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageData}>
                <defs>
                  <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0891b2" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0891b2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="consumption" stroke="#0891b2" strokeWidth={3} fillOpacity={1} fill="url(#colorCons)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar Alerts / Rankings */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl shadow-slate-900/10">
            <h4 className="text-lg font-bold mb-4">Critical Leak Alerts</h4>
            <div className="space-y-4">
               <AlertItem severity="critical" label="SuperStore #22" info="12kg loss in 24h" />
               <AlertItem severity="warning" label="Warehouse C-5" info="Detected low suction" />
               <AlertItem severity="info" label="Logistics Hub" info="Maintenance due in 2d" />
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl">
            <h4 className="text-lg font-bold text-emerald-900 mb-4">Top Tech Performers</h4>
            <div className="space-y-3">
              {[
                { name: "Sarah Miller", points: 1450 },
                { name: "Kwame Nkrumah", points: 1220 },
                { name: "Elena Rossi", points: 1180 }
              ].map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-emerald-200">
                  <span className="text-sm font-bold text-emerald-800">{t.name}</span>
                  <span className="text-xs font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full">{t.points} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ label, value, unit, trend, positive, description }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm group hover:border-cyan-500 transition-all cursor-default">
    <div className="flex justify-between items-start mb-2">
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{label}</p>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${positive ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
        {trend}
      </span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-3xl font-black text-slate-900 tracking-tight">{value}</span>
      <span className="text-sm font-bold text-slate-400">{unit}</span>
    </div>
    <p className="mt-4 text-xs text-slate-400 font-medium">{description}</p>
  </div>
);

const AlertItem = ({ severity, label, info }: any) => (
  <div className={`p-4 rounded-2xl border-l-4 ${severity === 'critical' ? 'bg-rose-500/10 border-rose-500' : severity === 'warning' ? 'bg-amber-500/10 border-amber-500' : 'bg-cyan-500/10 border-cyan-500'}`}>
    <div className="flex justify-between items-center">
      <span className="text-xs font-bold">{label}</span>
      <span className={`w-2 h-2 rounded-full ${severity === 'critical' ? 'bg-rose-500' : severity === 'warning' ? 'bg-amber-500' : 'bg-cyan-500'}`}></span>
    </div>
    <p className="text-[10px] opacity-70 mt-1 font-medium tracking-wide uppercase">{info}</p>
  </div>
);

export default ComplianceDashboard;
