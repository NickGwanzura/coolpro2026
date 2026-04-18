'use client';

import { RefrigerantIntelligencePanel } from '@/components/RefrigerantIntelligencePanel';

export default function WhatGasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">WhatGas + Risk Engine</h1>
        <p className="text-gray-500 mt-1">Refrigerant identification, safety classification, and pre-job risk controls</p>
      </div>
      <RefrigerantIntelligencePanel initialCode="R-290" />
    </div>
  );
}
