'use client';

import { useEffect, useState } from 'react';
import { getSession, UserSession } from '@/lib/auth';
import { Menu, RefreshCw, CheckCircle, AlertCircle, Cloud } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
    const [session, setSession] = useState<UserSession | null>(null);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('synced');

    useEffect(() => {
        setSession(getSession());

        // Mock sync cycle
        const interval = setInterval(() => {
            setSyncStatus('syncing');
            setTimeout(() => {
                setSyncStatus(Math.random() > 0.9 ? 'error' : 'synced');
            }, 2000);
        }, 30000); // Every 30s

        return () => clearInterval(interval);
    }, []);

    return (
        <header className="bg-white border-b border-gray-200 h-16 px-4 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center">
                <button
                    onClick={onMenuClick}
                    className="mr-4 p-2 rounded-md hover:bg-gray-100 lg:hidden focus:outline-none"
                >
                    <Menu className="h-6 w-6 text-gray-500" />
                </button>
                <span className="lg:hidden font-semibold text-gray-900">CoolPro</span>
            </div>

            <div className="flex items-center space-x-4">
                {/* Sync Status */}
                <div className="hidden md:flex items-center text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                    <Cloud className="h-4 w-4 mr-2" />
                    <span className="mr-2">Status:</span>
                    {syncStatus === 'idle' && <span>Idle</span>}
                    {syncStatus === 'syncing' && <span className="text-blue-600 flex items-center"><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Syncing...</span>}
                    {syncStatus === 'synced' && <span className="text-green-600 flex items-center"><CheckCircle className="h-3 w-3 mr-1" /> Synced</span>}
                    {syncStatus === 'error' && <span className="text-red-600 flex items-center"><AlertCircle className="h-3 w-3 mr-1" /> Failed</span>}
                </div>

                {/* User Info */}
                {session && (
                    <div className="flex items-center space-x-3">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-medium text-gray-900">{session.name}</div>
                            <div className="text-xs text-gray-500 flex items-center justify-end">
                                {session.role.replace('_', ' ')} • {session.region}
                            </div>
                        </div>

                        {session.isDemo && (
                            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full border border-orange-200 font-medium">
                                DEMO
                            </span>
                        )}

                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                            {session.name.charAt(0)}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
