'use client';

import { useState } from 'react';
import { Award, BookOpen, CheckCircle, Clock, ArrowRight, ShieldCheck, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CertificationsPage() {
    const router = useRouter();
    const [examTaking, setExamTaking] = useState<string | null>(null);
    const [completedExams, setCompletedExams] = useState<string[]>([]);

    const availableExams = [
        {
            id: 'gwp-basic',
            title: 'Low GWP Refrigerants Safety',
            description: 'Essential safety protocols for handling flammable and high-pressure low GWP refrigerants.',
            duration: '45 mins',
            questions: 20,
            level: 'Basic'
        },
        {
            id: 'co2-advanced',
            title: 'R-744 (CO2) System Specialist',
            description: 'Advanced transcritical and subcritical CO2 system design, installation, and maintenance.',
            duration: '90 mins',
            questions: 45,
            level: 'Advanced'
        },
        {
            id: 'hc-safety',
            title: 'Hydrocarbon Refrigerant Handling',
            description: 'Safe handling and service practices for R-290 and R-600a systems.',
            duration: '60 mins',
            questions: 30,
            level: 'Specialist'
        }
    ];

    const handleStartExam = (id: string) => {
        setExamTaking(id);
        // Mock exam flow
        setTimeout(() => {
            if (confirm('Exam completed! Submit for professional review?')) {
                setCompletedExams([...completedExams, id]);
                setExamTaking(null);
                alert('Assessment submitted successfully. An administrator will review your results and issue your certificate within 24 hours.');
            } else {
                setExamTaking(null);
            }
        }, 1000);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">National Certification Center</h1>
                    <p className="text-gray-500 mt-1">Take professional assessments and earn accredited certifications</p>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-700">Accredited by SA-RACA</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-500" />
                        Available Assessments
                    </h2>
                    <div className="grid gap-4">
                        {availableExams.map((exam) => (
                            <div key={exam.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-blue-300 transition-all group">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${exam.level === 'Advanced' ? 'bg-purple-100 text-purple-700' :
                                                    exam.level === 'Specialist' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-blue-100 text-blue-700'
                                                }`}>
                                                {exam.level}
                                            </span>
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{exam.title}</h3>
                                        </div>
                                        <p className="text-sm text-gray-500 line-clamp-2">{exam.description}</p>
                                        <div className="flex items-center gap-4 pt-2 text-xs text-gray-400 font-medium">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" />
                                                {exam.duration}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <FileText className="h-3.5 w-3.5" />
                                                {exam.questions} Questions
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                        {completedExams.includes(exam.id) ? (
                                            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl font-bold text-sm">
                                                <CheckCircle className="h-4 w-4" />
                                                Pending Review
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleStartExam(exam.id)}
                                                disabled={examTaking !== null}
                                                className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-600 transition-all disabled:opacity-50"
                                            >
                                                Start Exam
                                                <ArrowRight className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Award className="h-5 w-5 text-amber-500" />
                        My Achievements
                    </h2>
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Digital Badges</p>
                                <p className="text-xl font-black text-gray-900">12</p>
                            </div>
                            <Award className="h-8 w-8 text-amber-400 opacity-50" />
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Recently Issued</p>
                            <div className="p-3 border border-gray-100 rounded-xl flex items-center gap-3">
                                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <ShieldCheck className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">F-Gas Core Card</p>
                                    <p className="text-[10px] text-gray-400 font-medium">Verified: 12 Jan 2026</p>
                                </div>
                            </div>
                        </div>

                        <button className="w-full py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                            View All Credentials
                        </button>
                    </div>

                    <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative">
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-2">Need Help?</h3>
                            <p className="text-xs text-slate-400 mb-4 line-height-relaxed">Access our study materials and past exam papers to prepare for your certification assessments.</p>
                            <button className="w-full bg-cyan-500 text-slate-900 py-2.5 rounded-xl font-bold text-sm hover:bg-cyan-400 transition-colors">
                                Exam Prep Zone
                            </button>
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-10">
                            <BookOpen className="h-24 w-24 transform -rotate-12" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

