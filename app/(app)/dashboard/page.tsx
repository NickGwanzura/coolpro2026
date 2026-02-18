'use client';

import { useEffect, useState } from 'react';
import { getSession, UserSession, logout } from '@/lib/auth';

export default function DashboardPage() {
    const [session, setSession] = useState<UserSession | null>(null);

    useEffect(() => {
        setSession(getSession());
    }, []);

    if (!session) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <button
                    onClick={() => logout()}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                    Reset Demo
                </button>
            </div>

            {session.isDemo && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-blue-700">
                                You are viewing this dashboard as <span className="font-bold">{session.role}</span> in <span className="font-bold">{session.region}</span>.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Completed Jobs</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">12</dd>
                    </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">Pending Certifications</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">2</dd>
                    </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">Rewards Points</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">450</dd>
                    </div>
                </div>
            </div>
        </div>
    );
}
