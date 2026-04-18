'use client';

import { EmergencyModePanel } from '@/components/EmergencyModePanel';

export default function EmergencyModePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Emergency Mode</h1>
        <p className="text-gray-500 mt-1">Offline safety protocols, emergency scripts, and high-contrast field operations</p>
      </div>
      <EmergencyModePanel />
    </div>
  );
}
