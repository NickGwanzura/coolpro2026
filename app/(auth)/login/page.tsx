"use client";

import React, { useState } from 'react';
import { useAuth } from '../../../lib/auth';
import { UserRole } from '../../../types';
import { ROLE_LABELS } from '../../../lib/roles';

export default function LoginPage() {
  const { login, demo } = useAuth();
  const [isDemoView, setIsDemoView] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Demo Specific State
  const [selectedRole, setSelectedRole] = useState<UserRole>('technician' as UserRole);
  const [selectedRegion, setSelectedRegion] = useState('Harare');

  const REGIONS = ["Harare", "Bulawayo", "Mutare", "Gweru", "Masvingo", "Other"];

  const handleNormalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    await login(email);
  };

  const handleDemoAccess = async () => {
    setIsLoading(true);
    if (demo) {
      await demo(selectedRole, selectedRegion);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 selection:bg-cyan-500/30">
      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-cyan-600 to-cyan-400 rounded-2xl mx-auto flex items-center justify-center font-black text-3xl text-white shadow-2xl shadow-cyan-500/20 mb-6 rotate-3">CP</div>
          <h1 className="text-2xl font-black text-white tracking-tight">CoolPro Toolkit</h1>
          <p className="text-slate-400 mt-2 text-sm font-medium leading-relaxed">
            Commercial Refrigeration Training & <br/> Low-GWP Compliance Platform
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[32px] shadow-2xl space-y-6">
          <div className="flex p-1 bg-slate-950 rounded-2xl">
            <button 
              onClick={() => setIsDemoView(false)}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${!isDemoView ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Secure Login
            </button>
            <button 
              onClick={() => setIsDemoView(true)}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${isDemoView ? 'bg-slate-800 text-cyan-400 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Demo Access
            </button>
          </div>

          {!isDemoView ? (
            <form onSubmit={handleNormalLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Work Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Password</label>
                  <button type="button" className="text-[10px] font-black text-cyan-500 uppercase tracking-widest hover:text-cyan-400 transition-colors">Forgot?</button>
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                />
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-cyan-600/10 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Sign In to Dashboard"}
              </button>
            </form>
          ) : (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-2xl">
                <p className="text-xs text-cyan-200 leading-relaxed font-medium">
                  <strong>Demo Mode:</strong> No password required. Select a persona to test role-specific tools and dashboards.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Persona</label>
                  <select 
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    {Object.entries(ROLE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Operating Region</label>
                  <select 
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    {REGIONS.map(reg => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={handleDemoAccess}
                  disabled={isLoading}
                  className="w-full bg-slate-100 hover:bg-white text-slate-900 font-black py-4 rounded-2xl transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isLoading ? <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" /> : "Continue with Demo Access"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-slate-700 text-[10px] font-bold uppercase tracking-[0.2em] mt-10">
          Industrial Grade Compliance Architecture v1.4
        </p>
      </div>
    </div>
  );
}