'use client';

import { useMemo, useState } from 'react';
import { Camera, LoaderCircle, ScanText } from 'lucide-react';
import { extractNameplateData } from '@/lib/refrigerantIntelligence';
import { prependCollectionItem, STORAGE_KEYS } from '@/lib/platformStore';
import { RefrigerantRiskBadge } from '@/components/RefrigerantRiskBadge';
import type { OcrScanRecord } from '@/types/index';

export function OcrNameplateScanner() {
    const [preview, setPreview] = useState<string>('');
    const [result, setResult] = useState<OcrScanRecord | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState('');

    const risk = useMemo(() => {
        if (!result?.whatGasMatch) {
            return null;
        }

        return {
            color: result.whatGasMatch.riskColor,
            label: `${result.whatGasMatch.riskColor} / ${result.whatGasMatch.ashraeSafetyClass}`,
        };
    }, [result]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setError('');
        setIsScanning(true);
        setResult(null);

        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);

        try {
            const { createWorker } = await import('tesseract.js');
            const worker = await createWorker('eng');
            const scan = await worker.recognize(file);
            await worker.terminate();

            const parsed = extractNameplateData(scan.data.text);
            setResult(parsed);
            prependCollectionItem<OcrScanRecord>(STORAGE_KEYS.ocrScans, parsed);
        } catch (scanError) {
            console.error(scanError);
            setError('OCR scan failed. Try a clearer image or use a higher-contrast photo.');
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <section className="border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">OCR nameplate scanning</p>
                    <h2 className="mt-2 text-xl font-bold text-gray-900">Scan Equipment Nameplates</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                        Capture a nameplate image, extract refrigerant details with Tesseract.js, and immediately classify safety risk.
                    </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 bg-[#FF6B35] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90">
                    <Camera className="h-4 w-4" />
                    Upload or use camera
                    <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </label>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="overflow-hidden border border-gray-200 bg-gray-50">
                    {preview ? (
                        <img src={preview} alt="Nameplate preview" className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex min-h-[280px] items-center justify-center text-sm text-gray-500">
                            Awaiting a nameplate image.
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="border border-gray-200 bg-gray-50 p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <ScanText className="h-4 w-4" />
                            OCR status
                        </div>
                        <div className="mt-3">
                            {isScanning ? (
                                <div className="flex items-center gap-2 text-sm text-blue-700">
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                    Extracting text from the uploaded image...
                                </div>
                            ) : error ? (
                                <p className="text-sm text-rose-700">{error}</p>
                            ) : result ? (
                                <div className="space-y-3 text-sm text-gray-700">
                                    <Detail label="Manufacturer" value={result.manufacturer || 'Not detected'} />
                                    <Detail label="Model" value={result.model || 'Not detected'} />
                                    <Detail label="Serial" value={result.serialNumber || 'Not detected'} />
                                    <Detail label="Refrigerant" value={result.refrigerantCode || 'Not detected'} />
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No scan has been processed yet.</p>
                            )}
                        </div>
                    </div>

                    {result?.whatGasMatch && risk && (
                        <div className="border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-gray-500">Matched refrigerant</p>
                                    <h3 className="mt-1 text-lg font-bold text-gray-900">
                                        {result.whatGasMatch.code} · {result.whatGasMatch.commonName}
                                    </h3>
                                </div>
                                <RefrigerantRiskBadge color={risk.color} label={risk.label} />
                            </div>
                            <p className="mt-3 text-sm text-gray-600">
                                {result.whatGasMatch.typicalUse}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3 border border-gray-200 bg-white px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">{label}</span>
            <span className="text-sm font-medium text-gray-900">{value}</span>
        </div>
    );
}
