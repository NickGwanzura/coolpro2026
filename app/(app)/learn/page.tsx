'use client';

import { useSyncExternalStore } from 'react';
import TrainerLearningHub from '@/components/TrainerLearningHub';
import LMS from '@/components/LMS';
import { getSession, type UserSession } from '@/lib/auth';

export default function LearnPage() {
    const session = useSyncExternalStore<UserSession | null>(
        () => () => undefined,
        () => getSession(),
        () => null
    );
    const isTrainer = session?.role === 'trainer';

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{isTrainer ? 'Training Operations' : 'Learning Center'}</h1>
                    <p className="text-gray-500 mt-1">
                        {isTrainer
                            ? 'Schedule trainings, publish course details, and manage upcoming sessions'
                            : 'Continue your training and certification courses'}
                    </p>
                </div>
            </div>
            {isTrainer && session ? <TrainerLearningHub session={session} /> : <LMS />}
        </div>
    );
}
