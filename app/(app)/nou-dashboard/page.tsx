'use client';

import NouDashboard from '@/components/NouDashboard';

export default function NouDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">NOU Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            National compliance oversight for supplier verification and refrigerant tracking
          </p>
        </div>
      </div>

      <NouDashboard />
    </div>
  );
}
