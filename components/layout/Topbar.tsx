'use client';

import { useEffect, useState } from 'react';
import { getSession, UserSession, logout } from '@/lib/auth';
import { Menu, RefreshCw, CheckCircle, AlertCircle, Cloud, Bell, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
    const [session, setSession] = useState<UserSession | null>(null);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('synced');
    const [showUserMenu, setShowUserMenu] = useState(false);

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
        <header className="sticky top-0 z-50 h-14 sm:h-16 bg-white border-b border-gray-200/80 backdrop-blur-sm bg-white/95">
            <div className="h-full px-3 sm:px-4 lg:px-6 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-4">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 -ml-1 sm:-ml-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors active:bg-gray-200"
                        aria-label="Open menu"
                    >
                        <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                    <span className="lg:hidden font-bold text-gray-900 text-base sm:text-lg tracking-tight">CoolPro</span>
                </div>

                <div className="flex items-center gap-1 sm:gap-3">
                    {/* Sync Status - Hidden on small mobile */}
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200/60 text-xs font-medium">
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

                    {/* Notifications - Better touch target */}
                    <button className="relative p-2 sm:p-2.5 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors active:bg-gray-200">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
                    </button>

                    {/* User Menu */}
                    {session && (
                        <div className="relative">
                            <button 
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-2 p-1 pr-2 sm:pr-3 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                                    {session.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="hidden md:block text-sm font-medium text-gray-700">{session.name.split(' ')[0]}</span>
                            </button>

                            {/* Dropdown Menu */}
                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {/* User Info */}
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <p className="text-sm font-semibold text-gray-900">{session.name}</p>
                                        <p className="text-xs text-gray-500">{session.email}</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                {session.role.replace('_', ' ')}
                                            </span>
                                            <span className="text-xs text-gray-500">{session.region}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Menu Items */}
                                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                        <User className="h-4 w-4" />
                                        My Profile
                                    </button>
                                    <button 
                                        onClick={() => logout()}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
