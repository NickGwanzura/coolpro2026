'use client';

import FieldToolkit from '@/components/FieldToolkit';

export default function FieldToolkitPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Field Toolkit</h1>
                    <p className="text-gray-500 mt-1">Offline-ready checklists and refrigerant logging</p>
                </div>
            </div>
            <FieldToolkit />
        </div>
    );
}
