'use client';

import { EmergencyModePanel } from '@/components/EmergencyModePanel';
import { RefrigerantIntelligencePanel } from '@/components/RefrigerantIntelligencePanel';
import SizingTool from '@/components/SizingTool';

export default function SizingToolPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Commercial Refrigeration System Sizing Tool</h1>
                    <p className="text-gray-500 mt-1">Calculate refrigeration load, review WhatGas guidance, and surface refrigerant risk controls</p>
                </div>
            </div>
            <RefrigerantIntelligencePanel initialCode="R-744" />
            <EmergencyModePanel />
            <SizingTool />
        </div>
    );
}
