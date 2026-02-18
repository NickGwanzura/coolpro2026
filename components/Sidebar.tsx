
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth';
import { NAV_ITEMS } from '../lib/nav';
import { Icons } from '../constants';

export default function Sidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const filteredNav = NAV_ITEMS.filter(item => item.roles.includes(user.role));

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed bottom-6 right-6 z-[60] bg-cyan-600 text-white p-4 rounded-full shadow-xl"
      >
        <Icons.Dashboard />
      </button>

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-cyan-500/20">CP</div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">CoolPro</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Toolkit v1.0</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
            {filteredNav.map((item) => (
              <Link 
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all group
                  ${pathname === item.href 
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
                `}
              >
                <item.icon className={pathname === item.href ? 'text-white' : 'text-slate-500 group-hover:text-cyan-400'} />
                <span className="font-bold text-sm">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Footer Info */}
          <div className="p-4 border-t border-slate-800">
            <div className="bg-slate-800/50 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                <Icons.User className="text-slate-400 w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{user.role}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}
    </>
  );
}
