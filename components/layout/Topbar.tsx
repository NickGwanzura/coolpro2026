'use client';

import { useEffect, useState } from 'react';
import { getSession, UserSession } from '@/lib/auth';
import { Menu, RefreshCw, CheckCircle, AlertCircle, Cloud, Bell } from 'lucide-react';
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
        <header className="sticky top-0 z-50 h-16 bg-white border-b border-gray-200/80 backdrop-blur-sm bg-white/95">
            <div className="h-full px-4 lg:px-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 -ml-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
                        aria-label="Open menu"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <span className="lg:hidden font-semibold text-gray-900 text-lg">CoolPro</span>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Sync Status */}
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200/60 text-xs font-medium">
                        <Cloud className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-gray-500">Status:</span>
                        {syncStatus === 'idle' && <span className="text-gray-600">Idle</span>}
                        {syncStatus === 'syncing' && (
                            <span className="text-blue-600 flex items-center gap-1">
                                <RefreshCw className="h-3 w-3 animate-spin" /> Syncing...
                            </span>
                        )}
                        {syncStatus === 'synced' && (
                            <span className="text-emerald-600 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" /> Synced
                            </span>
                        )}
                        {syncStatus === 'error' && (
                            <span className="text-red-600 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> Failed
                            </span>
                        )}
                    </div>

                    {/* Notifications */}
                    <button className="relative p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
                    </button>

                    {/* User Info */}
                    {session && (
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:block text-right">
                                <div className="text-sm font-semibold text-gray-900">{session.name}</div>
                                <div className="text-xs text-gray-500 flex items-center justify-end gap-1">
                                    <span className="capitalize">{session.role.replace('_', ' ')}</span>
                                    <span className="text-gray-300">•</span>
                                    <span>{session.region}</span>
                                </div>
                            </div>

                            {session.isDemo && (
                                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                    DEMO
                                </span>
                            )}

                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                                {session.name.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
