
"use client";

import { useAuth } from '../lib/auth';
import { usePWA } from '../lib/pwa';
import { Icons } from '../constants';
import { usePathname } from 'next/navigation';

export default function Topbar() {
  const { logout, user } = useAuth();
  const { syncStatus, triggerSync, isOnline } = usePWA();
  const pathname = usePathname();

  const getTitle = () => {
    const segment = pathname.split('/').pop();
    if (!segment || segment === 'dashboard') return 'Overview';
    return segment.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 py-4 px-6 md:px-10 sticky top-0 z-40 flex justify-between items-center h-20">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">{getTitle()}</h2>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        {/* Sync Status */}
        <div className="hidden sm:flex items-center gap-3 text-slate-400">
          <button 
            onClick={triggerSync}
            disabled={!isOnline || syncStatus === 'syncing'}
            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors hover:text-slate-600 disabled:opacity-50`}
          >
            <Icons.Sync className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
            {syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'synced' ? 'Success' : 'Sync'}
          </button>
          <div className="h-4 w-px bg-slate-200"></div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900 leading-none">{user?.name}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{user?.region}</p>
          </div>
          <button 
            onClick={logout}
            className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 hover:text-slate-800 transition-all"
            title="Logout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          </button>
        </div>
      </div>
    </header>
  );
}
