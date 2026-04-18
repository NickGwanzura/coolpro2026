'use client';

import { useMemo, useRef, useState } from 'react';
import { ImagePlus, MapPin, Save } from 'lucide-react';
import { prependCollectionItem, STORAGE_KEYS } from '@/lib/platformStore';
import type { ImageRecord } from '@/types/index';

type DraftAnnotation = {
    id: string;
    x: number;
    y: number;
    label: string;
};

export function ImageAnnotationWorkbench() {
    const imageRef = useRef<HTMLDivElement>(null);
    const [imageDataUrl, setImageDataUrl] = useState('');
    const [jobId, setJobId] = useState('job-plan-001');
    const [beforeAfter, setBeforeAfter] = useState<ImageRecord['beforeAfter']>('inspection');
    const [gpsTag, setGpsTag] = useState('');
    const [annotations, setAnnotations] = useState<DraftAnnotation[]>([]);
    const [notice, setNotice] = useState('');

    const markerLabel = useMemo(() => `Issue ${annotations.length + 1}`, [annotations.length]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setImageDataUrl(String(reader.result));
            setAnnotations([]);
        };
        reader.readAsDataURL(file);
    };

    const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!imageRef.current || !imageDataUrl) {
            return;
        }

        const bounds = imageRef.current.getBoundingClientRect();
        const x = Number((((event.clientX - bounds.left) / bounds.width) * 100).toFixed(2));
        const y = Number((((event.clientY - bounds.top) / bounds.height) * 100).toFixed(2));

        setAnnotations((current) => [
            ...current,
            {
                id: `annotation-${Date.now()}-${current.length}`,
                x,
                y,
                label: markerLabel,
            },
        ]);
    };

    const saveImageRecord = () => {
        if (!imageDataUrl) {
            setNotice('Upload an image before saving annotations.');
            return;
        }

        const record: ImageRecord = {
            id: `image-${Date.now()}`,
            jobId,
            beforeAfter,
            annotationsJson: annotations,
            gpsTag: gpsTag || undefined,
            imageDataUrl,
            createdAt: new Date().toISOString(),
        };

        prependCollectionItem<ImageRecord>(STORAGE_KEYS.imageRecords, record);
        setNotice(`Saved ${annotations.length} annotations for ${jobId}.`);
    };

    return (
        <section className="border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">Image capture and annotation</p>
                    <h2 className="mt-2 text-xl font-bold text-gray-900">Annotate Field Images</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                        Tag before/after evidence, drop issue markers, and link each image to a job record with optional GPS metadata.
                    </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                    <ImagePlus className="h-4 w-4" />
                    Upload image
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                <div
                    ref={imageRef}
                    onClick={handleCanvasClick}
                    className="relative min-h-[320px] overflow-hidden border border-gray-200 bg-gray-50"
                >
                    {imageDataUrl ? (
                        <>
                            <img src={imageDataUrl} alt="Annotation target" className="h-full w-full object-cover" />
                            {annotations.map((annotation, index) => (
                                <button
                                    key={annotation.id}
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setAnnotations((current) => current.filter((item) => item.id !== annotation.id));
                                    }}
                                    className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-[#FF6B35] text-xs font-bold text-white shadow-lg"
                                    style={{ left: `${annotation.x}%`, top: `${annotation.y}%` }}
                                >
                                    {index + 1}
                                </button>
                            ))}
                        </>
                    ) : (
                        <div className="flex h-full min-h-[320px] items-center justify-center text-sm text-gray-500">
                            Upload an image, then click to place annotation markers.
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-2 text-sm">
                            <span className="font-semibold text-gray-700">Job ID</span>
                            <input
                                value={jobId}
                                onChange={(event) => setJobId(event.target.value)}
                                className="w-full border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </label>
                        <label className="space-y-2 text-sm">
                            <span className="font-semibold text-gray-700">Tag</span>
                            <select
                                value={beforeAfter}
                                onChange={(event) => setBeforeAfter(event.target.value as ImageRecord['beforeAfter'])}
                                className="w-full border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="before">Before</option>
                                <option value="after">After</option>
                                <option value="inspection">Inspection</option>
                            </select>
                        </label>
                    </div>

                    <label className="space-y-2 text-sm">
                        <span className="flex items-center gap-2 font-semibold text-gray-700">
                            <MapPin className="h-4 w-4" />
                            GPS tag
                        </span>
                        <input
                            value={gpsTag}
                            onChange={(event) => setGpsTag(event.target.value)}
                            placeholder="-17.8292, 31.0522"
                            className="w-full border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </label>

                    <div className="border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Current markers</p>
                        <div className="mt-3 space-y-2">
                            {annotations.length === 0 ? (
                                <p className="text-sm text-gray-500">No annotations yet.</p>
                            ) : annotations.map((annotation, index) => (
                                <div key={annotation.id} className="border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
                                    Marker {index + 1}: {annotation.label} at {annotation.x}% / {annotation.y}%
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={saveImageRecord}
                        className="inline-flex items-center gap-2 bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                        <Save className="h-4 w-4" />
                        Save annotated image
                    </button>

                    {notice && (
                        <div className="border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                            {notice}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
