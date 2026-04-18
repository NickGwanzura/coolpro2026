'use client';

import { EmergencyModePanel } from '@/components/EmergencyModePanel';
import FieldToolkit from '@/components/FieldToolkit';
import { ImageAnnotationWorkbench } from '@/components/ImageAnnotationWorkbench';
import { OcrNameplateScanner } from '@/components/OcrNameplateScanner';
import { RefrigerantIntelligencePanel } from '@/components/RefrigerantIntelligencePanel';

export default function FieldToolkitPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Field Toolkit - Installations, COC, Logs</h1>
                    <p className="text-gray-500 mt-1">Offline-ready installations, safety packs, OCR nameplate scanning, and refrigerant tracking</p>
                </div>
            </div>
            <div className="grid gap-6">
                <OcrNameplateScanner />
                <RefrigerantIntelligencePanel />
                <ImageAnnotationWorkbench />
                <EmergencyModePanel />
            </div>
            <FieldToolkit />
        </div>
    );
}
