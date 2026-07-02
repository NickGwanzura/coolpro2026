'use client';

import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { BarChart3, TrendingUp } from 'lucide-react';
import { useRefrigerantAnalytics } from '@/lib/api';

const PIE_COLORS = ['#D97706', '#2563eb', '#7c3aed', '#dc2626', '#059669', '#0891b2', '#db2777'];

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-gray-900">{title}</h2>
      {children}
    </div>
  );
}

export default function RefrigerantAnalyticsPage() {
  const { data, isLoading } = useRefrigerantAnalytics();

  if (isLoading || !data) {
    return <div className="p-8 text-sm text-gray-500">Loading analytics…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <BarChart3 className="h-6 w-6 text-[#D97706]" /> Refrigerant Analytics
        </h1>
        <p className="mt-1 text-gray-500">Usage, classification, and trend analysis across field gas logs.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Most Used Refrigerants (kg logged)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.mostUsed}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="refrigerant" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="totalKg" fill="#D97706" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Most Installed (planner jobs)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.mostInstalled}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="refrigerant" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Most Recovered Refrigerants (kg)">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data.mostRecovered}
                dataKey="totalKg"
                nameKey="refrigerant"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => entry.name}
              >
                {data.mostRecovered.map((entry, index) => (
                  <Cell key={entry.refrigerant} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Regulatory Classification Breakdown (kg)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.classificationBreakdown} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={140} />
              <Tooltip />
              <Bar dataKey="totalKg" fill="#7c3aed" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="lg:col-span-2">
          <ChartCard title="Monthly Usage Trend (last 6 months)">
            <div className="mb-2 flex items-center gap-1.5 text-xs text-gray-500">
              <TrendingUp className="h-3.5 w-3.5" /> Total kg logged per month across all refrigerants
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="totalKg" stroke="#D97706" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
