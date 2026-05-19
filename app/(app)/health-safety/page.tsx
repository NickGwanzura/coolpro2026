'use client';

import { useState } from 'react';
import { ShieldCheck, HeartPulse, Stethoscope, FileText, CheckCircle2, Circle } from 'lucide-react';

const CHECKLIST_ITEMS = [
    { id: '1', title: 'Annual Respiratory Exam', desc: 'Spirometry and lung function test due to refrigerant exposure.' },
    { id: '2', title: 'Hearing Assessment', desc: 'Audiometry test for exposure to loud plant rooms and compressors.' },
    { id: '3', title: 'Vision Screening', desc: 'Regular eye exams to ensure safety when working with detailed schematics and high-pressure systems.' },
    { id: '4', title: 'Musculoskeletal Check', desc: 'Assessment of back and joints due to heavy lifting and awkward postures.' },
    { id: '5', title: 'Dermatological Check', desc: 'Skin exam for irritation from lubricants, oils, and chemical exposure.' },
];

const KNOWLEDGE_BASE = [
    {
        title: 'Managing Thermal Stress',
        desc: 'Technicians often work in extreme temperatures (roofs in summer, cold rooms). Stay hydrated, take regular breaks, and wear breathable clothing. Recognize signs of heat exhaustion and hypothermia.',
    },
    {
        title: 'Proper Lifting Techniques',
        desc: 'Compressors and cylinders are heavy. Always use your legs to lift, keep the load close to your body, and do not twist while lifting. Use mechanical aids like hoists when possible.',
    },
    {
        title: 'Chemical and Refrigerant Safety',
        desc: 'Avoid skin contact with POE oils and refrigerants. Always wear appropriate PPE (nitrile gloves, safety glasses). Be aware of the asphyxiation risks of refrigerants in confined spaces.',
    },
    {
        title: 'Mental Health and Fatigue',
        desc: 'On-call shifts and long hours can lead to fatigue, increasing the risk of accidents. Ensure you get 7-8 hours of sleep and communicate with dispatch if you feel too fatigued to work safely.',
    }
];

export default function HealthSafetyPage() {
    const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

    const toggleItem = (id: string) => {
        setCompletedItems(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mb-1">
                        <HeartPulse className="h-3.5 w-3.5" />
                        Technician Wellness
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Health & Wellness</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Track your annual health checkups and review best practices for staying healthy in the field.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
                {/* Left Column: Checklist */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-rose-50 p-2 text-rose-600">
                                <Stethoscope className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Annual Health Checklist</h2>
                                <p className="text-sm text-gray-500">Recommended checkups for RAC technicians</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {CHECKLIST_ITEMS.map((item) => {
                                const isChecked = completedItems.has(item.id);
                                return (
                                    <div 
                                        key={item.id} 
                                        onClick={() => toggleItem(item.id)}
                                        className={`group flex items-start gap-3 p-3 border cursor-pointer transition-colors ${
                                            isChecked 
                                                ? 'bg-emerald-50/50 border-emerald-200' 
                                                : 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-white'
                                        }`}
                                    >
                                        <div className="mt-0.5 flex-shrink-0">
                                            {isChecked ? (
                                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                            ) : (
                                                <Circle className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
                                            )}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${isChecked ? 'text-emerald-900 line-through opacity-70' : 'text-gray-900'}`}>
                                                {item.title}
                                            </p>
                                            <p className={`mt-0.5 text-xs ${isChecked ? 'text-emerald-700/70' : 'text-gray-500'}`}>
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-600">
                                {completedItems.size} of {CHECKLIST_ITEMS.length} completed
                            </p>
                            <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-emerald-500 transition-all duration-500" 
                                    style={{ width: `${(completedItems.size / CHECKLIST_ITEMS.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Knowledge Base */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-blue-50 p-2 text-blue-600">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Occupational Health Guide</h2>
                                <p className="text-sm text-gray-500">Best practices for maintaining long-term health</p>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {KNOWLEDGE_BASE.map((item, idx) => (
                                <div key={idx} className="border border-gray-200 p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                        <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 border border-blue-100 bg-blue-50 p-4 flex gap-3 items-start">
                            <HeartPulse className="h-5 w-5 text-blue-700 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="text-sm font-bold text-blue-900">Your health is your most important tool.</h4>
                                <p className="text-sm text-blue-800 mt-1">
                                    Do not ignore chronic pain, persistent coughs, or signs of exhaustion. 
                                    Report injuries immediately and ensure your employer provides necessary health screenings.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
