'use client';

import Link from 'next/link';
import { ArrowRight, FlaskConical } from 'lucide-react';
import { EmergencyModePanel } from '@/components/EmergencyModePanel';
import FieldToolkit from '@/components/FieldToolkit';
import { ImageAnnotationWorkbench } from '@/components/ImageAnnotationWorkbench';
import { OcrNameplateScanner } from '@/components/OcrNameplateScanner';

export default function FieldToolkitPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Field Toolkit - Installations, COC, Logs</h1>
                    <p className="text-gray-500 mt-1">Offline-ready installations, safety packs, OCR nameplate scanning, and refrigerant tracking</p>
                </div>
                <Link
                    href="/whatgas"
                    className="inline-flex items-center gap-2 border border-[#E5E0DB] bg-white px-4 py-2 text-sm font-semibold text-[#1C1917] hover:border-[#D97706] hover:text-[#D97706] transition-colors"
                >
                    <FlaskConical className="h-4 w-4" />
                    WhatGas + Risk Engine
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>
            <div className="grid gap-6">
                <OcrNameplateScanner />
                <ImageAnnotationWorkbench />
                <EmergencyModePanel />
            </div>
            <FieldToolkit />
        </div>
    );
}
