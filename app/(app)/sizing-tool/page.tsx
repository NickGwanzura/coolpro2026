'use client';

import SizingTool from '@/components/SizingTool';

export default function SizingToolPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Sizing Tool</h1>
                    <p className="text-gray-500 mt-1">Calculate refrigeration load and get AI-powered recommendations</p>
                </div>
            </div>
            <SizingTool />
        </div>
    );
}
