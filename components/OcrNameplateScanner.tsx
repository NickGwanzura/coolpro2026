'use client';

import { useMemo, useState } from 'react';
import { Camera, Clock, LoaderCircle, ScanText, Wrench } from 'lucide-react';
import { extractNameplateData } from '@/lib/refrigerantIntelligence';
import { createOcrScan, useOcrScans } from '@/lib/api';
import { RefrigerantRiskBadge } from '@/components/RefrigerantRiskBadge';
import type { OcrScanRecord } from '@/types/index';

function formatScanDate(iso: string) {
    return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

interface OcrNameplateScannerProps {
    /** Called when the technician chooses to carry a scanned refrigerant code into the Field Toolkit gas register. */
    onUseRefrigerant?: (refrigerantCode: string) => void;
}

export function OcrNameplateScanner({ onUseRefrigerant }: OcrNameplateScannerProps = {}) {
    const [preview, setPreview] = useState<string>('');
    const [result, setResult] = useState<OcrScanRecord | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [error, setError] = useState('');
    const { data: historyData } = useOcrScans();
    const history = historyData?.data ?? [];

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
        if (!file.type.startsWith('image/')) {
            setError('Choose an image file for the nameplate scan.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('Use an image smaller than 10 MB. Crop the nameplate and try again.');
            return;
        }

        setError('');
        setIsScanning(true);
        setResult(null);
        setConfirmed(false);

        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);

        try {
            const { createWorker } = await import('tesseract.js');
            const worker = await createWorker('eng');
            const scan = await worker.recognize(file);
            await worker.terminate();

            const parsed = await extractNameplateData(scan.data.text);
            setResult(parsed);
        } catch (scanError) {
            console.error(scanError);
            setError('OCR scan failed. Try a clearer image or use a higher-contrast photo.');
        } finally {
            setIsScanning(false);
        }
    };

    const updateResult = (key: 'manufacturer' | 'model' | 'serialNumber' | 'refrigerantCode', value: string) => {
        setResult((current) => current ? {
            ...current,
            [key]: value || undefined,
            ...(key === 'refrigerantCode' ? { whatGasMatch: undefined } : {}),
        } : current);
        setConfirmed(false);
    };

    const confirmScan = async () => {
        if (!result) return;
        setIsSaving(true);
        setError('');
        try {
            await createOcrScan({
                rawText: result.rawText,
                refrigerantCode: result.refrigerantCode,
                manufacturer: result.manufacturer,
                model: result.model,
                serialNumber: result.serialNumber,
                matchConfidence: result.matchConfidence,
                whatGasRefrigerantId: result.whatGasMatch?.id,
            });
            setConfirmed(true);
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : 'Could not save the confirmed scan.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">OCR nameplate scanning</p>
                    <h2 className="mt-2 text-xl font-bold text-gray-900">Scan Equipment Nameplates</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                        Capture a nameplate image, extract refrigerant details with Tesseract.js, and immediately classify safety risk.
                    </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 bg-[#D97706] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#b45309]">
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
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <ScanText className="h-4 w-4" />
                            OCR status
                        </div>
                        <div className="mt-3">
                            {isScanning ? (
                                <div className="flex items-center gap-2 text-sm text-[#D97706]">
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                    Extracting text from the uploaded image...
                                </div>
                            ) : error ? (
                                <p className="text-sm text-rose-700">{error}</p>
                            ) : result ? (
                                <div className="space-y-3 text-sm text-gray-700">
                                    <EditableDetail label="Manufacturer" value={result.manufacturer ?? ''} onChange={(value) => updateResult('manufacturer', value)} />
                                    <EditableDetail label="Model" value={result.model ?? ''} onChange={(value) => updateResult('model', value)} />
                                    <EditableDetail label="Serial" value={result.serialNumber ?? ''} onChange={(value) => updateResult('serialNumber', value)} />
                                    <EditableDetail label="Refrigerant" value={result.refrigerantCode ?? ''} onChange={(value) => updateResult('refrigerantCode', value.toUpperCase())} />
                                    <button type="button" onClick={confirmScan} disabled={isSaving || confirmed} className="inline-flex items-center gap-2 bg-[#D97706] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b45309] disabled:cursor-not-allowed disabled:opacity-60">
                                        {isSaving ? 'Saving confirmed scan…' : confirmed ? 'Scan confirmed and saved' : 'Confirm and save scan'}
                                    </button>
                                    {result.refrigerantCode && onUseRefrigerant && (
                                        <button
                                            type="button"
                                            onClick={() => onUseRefrigerant(result.refrigerantCode!)}
                                            className="inline-flex items-center gap-2 bg-[#1C1917] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#292524]"
                                        >
                                            <Wrench className="h-4 w-4" />
                                            Use in Field Toolkit
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No scan has been processed yet.</p>
                            )}
                        </div>
                    </div>

                    {result?.whatGasMatch && risk && (
                        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
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

            {history.length > 0 && (
                <div className="mt-6 border-t border-gray-100 pt-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <Clock className="h-4 w-4" />
                        Recent scans
                    </div>
                    <div className="mt-3 divide-y divide-gray-100 border border-gray-200">
                        {history.map((scan) => (
                            <div key={scan.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                                <div className="min-w-0">
                                    <p className="truncate font-medium text-gray-900">
                                        {scan.manufacturer || 'Unknown manufacturer'} {scan.model ? `· ${scan.model}` : ''}
                                    </p>
                                    <p className="text-xs text-gray-400">{formatScanDate(scan.createdAt)}</p>
                                </div>
                                <span className="shrink-0 text-xs font-semibold text-gray-500">
                                    {scan.refrigerantCode || 'No refrigerant detected'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}

function EditableDetail({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <div className="flex items-center justify-between gap-3 border border-gray-200 bg-white px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">{label}</span>
            <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Not detected" className="min-w-0 flex-1 bg-transparent text-right text-sm font-medium text-gray-900 outline-none focus:ring-1 focus:ring-[#D97706]" />
        </div>
    );
}
