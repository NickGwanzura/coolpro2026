"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth';
import { UserRole } from '../../../types';
import { ROLE_LABELS } from '../../../lib/roles';
import { Thermometer, Lock, Mail, ArrowRight, User, MapPin, ShieldCheck } from 'lucide-react';

// HEVACRAZ Color Scheme (matching landing page)
const colors = {
    primary: '#2C2420', // Rich charcoal
    secondary: '#D4A574', // Warm terracotta
    accent: '#5A7D5A', // Sage green
    highlight: '#FF6B35', // Electric orange
    background: '#FDF8F3', // Warm off-white
};

export default function LoginPage() {
  const router = useRouter();
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
    router.push('/dashboard');
  };

  const handleDemoAccess = async () => {
    setIsLoading(true);
    if (demo) {
      demo(selectedRole, selectedRegion);
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8" style={{ backgroundColor: colors.background }}>
      <div className="w-full max-w-md">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div 
            className="inline-flex h-16 w-16 items-center justify-center rounded-2xl shadow-xl mb-5"
            style={{ backgroundColor: colors.highlight }}
          >
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: colors.primary }}>HEVACRAZ</h1>
          <p className="mt-2 text-sm" style={{ color: colors.secondary }}>
            HVAC-R Professionals Zimbabwe<br className="hidden sm:block" />
            Member Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Tab Switcher */}
          <div className="flex rounded-xl p-1" style={{ backgroundColor: colors.background }}>
            <button 
              onClick={() => setIsDemoView(false)}
              className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all ${
                !isDemoView 
                  ? 'text-white shadow-sm' 
                  : ''
              }`}
              style={{ 
                backgroundColor: !isDemoView ? colors.highlight : 'transparent',
                color: !isDemoView ? 'white' : colors.primary
              }}
            >
              Sign In
            </button>
            <button 
              onClick={() => setIsDemoView(true)}
              className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all ${
                isDemoView 
                  ? 'text-white shadow-sm' 
                  : ''
              }`}
              style={{ 
                backgroundColor: isDemoView ? colors.highlight : 'transparent',
                color: isDemoView ? 'white' : colors.primary
              }}
            >
              Demo Access
            </button>
          </div>

          {!isDemoView ? (
            // Login Form
            <form onSubmit={handleNormalLogin} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  Work Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    id="email"
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <button type="button" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    id="password"
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg active:scale-[0.98]"
                style={{ backgroundColor: colors.highlight }}
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            // Demo Access Form
            <div className="space-y-5">
              <div className="rounded-xl p-4 border" style={{ backgroundColor: colors.secondary + '20', borderColor: colors.secondary }}>
                <p className="text-sm" style={{ color: colors.primary }}>
                  <strong className="font-semibold">Demo Mode:</strong> No password required. Select a persona to test role-specific tools and dashboards.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="role" className="block text-sm font-semibold text-gray-700">
                    Select Role
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <select 
                      id="role"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                      className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="org_admin">Admin</option>
                      <option value="technician">Technician</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="region" className="block text-sm font-semibold text-gray-700">
                    Operating Region
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <select 
                      id="region"
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                    >
                      {REGIONS.map(reg => (
                        <option key={reg} value={reg}>{reg}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handleDemoAccess}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg active:scale-[0.98]"
                  style={{ backgroundColor: colors.highlight }}
                >
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Continue with Demo
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs font-medium mt-8">
          Industrial Grade Compliance Architecture v1.4
        </p>
      </div>
    </div>
  );
}
