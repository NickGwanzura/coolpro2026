'use client';

import { useEffect, useState } from 'react';
import { getSession, UserSession, logout } from '@/lib/auth';
import { 
    ClipboardCheck, 
    Award, 
    Gift, 
    TrendingUp, 
    ArrowRight,
    RefreshCw
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const [session, setSession] = useState<UserSession | null>(null);

    useEffect(() => {
        setSession(getSession());
    }, []);

    if (!session) return null;

    // Stats data
    const stats = [
        { 
            label: 'Total Completed Jobs', 
            value: '12', 
            icon: ClipboardCheck,
            color: 'blue',
            trend: '+2 this week'
        },
        { 
            label: 'Pending Certifications', 
            value: '2', 
            icon: Award,
            color: 'amber',
            trend: '1 expiring soon'
        },
        { 
            label: 'Rewards Points', 
            value: '450', 
            icon: Gift,
            color: 'emerald',
            trend: '100 points pending'
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 mt-1">Welcome back, {session.name}</p>
                </div>
                <button
                    onClick={() => logout()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                >
                    <RefreshCw className="h-4 w-4" />
                    Reset Demo
                </button>
            </div>

            {/* Demo Banner */}
            {session.isDemo && (
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                            <Award className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-blue-800">
                                You are viewing this dashboard as <span className="font-semibold capitalize">{session.role.replace('_', ' ')}</span> in <span className="font-semibold">{session.region}</span>.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    const colorClasses = {
                        blue: 'bg-blue-50 text-blue-600',
                        amber: 'bg-amber-50 text-amber-600',
                        emerald: 'bg-emerald-50 text-emerald-600',
                    };
                    
                    return (
                        <div 
                            key={index}
                            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div className={`p-3 rounded-xl ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                            </div>
                            <div className="mt-4">
                                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                                <p className="text-xs text-gray-400 mt-2">{stat.trend}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Link 
                        href="/sizing-tool"
                        className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                    >
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                            <Award className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">Sizing Tool</p>
                            <p className="text-xs text-gray-500">Calculate capacity</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </Link>
                    <Link 
                        href="/learn"
                        className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                    >
                        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                            <Award className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">Continue Learning</p>
                            <p className="text-xs text-gray-500">3 courses in progress</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </Link>
                    <Link 
                        href="/jobs"
                        className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                    >
                        <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                            <ClipboardCheck className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">Log New Job</p>
                            <p className="text-xs text-gray-500">Record completion</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </Link>
                    <Link 
                        href="/rewards"
                        className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                    >
                        <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                            <Gift className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">View Rewards</p>
                            <p className="text-xs text-gray-500">Redeem points</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
