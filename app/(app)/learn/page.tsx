'use client';

import TrainerLearningHub from '@/components/TrainerLearningHub';
import LMS from '@/components/LMS';
import { useAuth } from '@/lib/auth';

export default function LearnPage() {
    const { user: session, isLoading } = useAuth();
    const isTrainer = session?.role === 'trainer';

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="h-8 w-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{isTrainer ? 'Training Operations' : 'RAC Technician Learning Hub'}</h1>
                    <p className="text-gray-500 mt-1">
                        {isTrainer
                            ? 'Schedule trainings, publish course details, and manage upcoming sessions'
                            : 'Continue your RAC safety, compliance, and certification courses'}
                    </p>
                </div>
            </div>
            {isTrainer && session ? <TrainerLearningHub session={session} /> : <LMS />}
        </div>
    );
}
