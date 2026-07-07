"use client";

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../lib/auth';
import { UserRole } from '../../../types';
import { Thermometer, Lock, Mail, ArrowRight, MapPin, Building2, PackageSearch, User, GraduationCap } from 'lucide-react';

const DEMO_ROLES: Array<{
  role: UserRole;
  label: string;
  description: string;
  icon: typeof User;
}> = [
  { role: 'org_admin',   label: 'Org Admin',   description: 'Operations, suppliers, and team visibility.', icon: Building2 },
  { role: 'technician', label: 'Technician',  description: 'Field tools, jobs, and certifications.', icon: Thermometer },
  { role: 'trainer',    label: 'Trainer',     description: 'Learning flows and assessor tools.', icon: GraduationCap },
  { role: 'lecturer',   label: 'Lecturer',    description: 'Course delivery and learner management.', icon: GraduationCap },
  { role: 'vendor',     label: 'Vendor',      description: 'Supplier-facing demo workspace.', icon: PackageSearch },
];

const inputCls = 'block w-full px-3 py-2.5 rounded-lg bg-white border border-[#E7E5E4] text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] transition-colors text-sm';
const REGIONS = ["Harare", "Bulawayo", "Mutare", "Gweru", "Masvingo", "Other"];
const DEMO_LOGIN_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, demo } = useAuth();
  const [manualMode, setManualMode] = useState<'signin' | 'demo' | 'supplier' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedRegion, setSelectedRegion] = useState('Harare');

  const isSupplierFlow = searchParams.get('flow') === 'supplier';
  const activeMode = manualMode ?? (isSupplierFlow ? 'supplier' : 'signin');
  const nextPath = searchParams.get('next') || (isSupplierFlow ? '/suppliers' : '/dashboard');

  const redirectAfterLogin = () => {
    // Hard navigation to avoid any stale client bundle / SWR cache.
    window.location.assign(nextPath);
  };

  const handleNormalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!email) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address';
    if (!password) errors.password = 'Password is required';
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    setIsLoading(true);
    try {
      await login(email, password);
      redirectAfterLogin();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed.';
      setFieldErrors({ form: message });
      setIsLoading(false);
    }
  };

  const handleDemoAccess = async (role: UserRole) => {
    if (!demo) return;
    setIsLoading(true);
    setFieldErrors({});
    try {
      await demo(role, selectedRegion);
      redirectAfterLogin();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Demo login failed.';
      setFieldErrors({ form: message });
      setIsLoading(false);
    }
  };

  const tabs: { id: typeof activeMode; label: string }[] = [
    { id: 'signin',   label: 'Sign In' },
    { id: 'supplier', label: 'Supplier' },
  ];

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-lg">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center bg-[#D97706] mb-4">
            <Thermometer className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1C1917]">HEVACRAZ</h1>
          <p className="mt-1 text-sm text-[#78716C]">HVAC-R Professionals Zimbabwe Member Portal</p>
        </div>

        {/* Card */}
        <div className="rounded-lg bg-white border border-[#E7E5E4] shadow-sm">

          {/* Tabs */}
          <div className="flex border-b border-[#E7E5E4]">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setManualMode(tab.id as 'signin' | 'demo' | 'supplier')}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeMode === tab.id
                    ? 'border-[#D97706] text-[#1C1917]'
                    : 'border-transparent text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-5">
            {activeMode === 'signin' && (
              <div className="space-y-5">
                {DEMO_LOGIN_ENABLED && (
                  <>
                    {/* Demo personas — instant access, no password. Never shown in production. */}
                    <div>
                      <div className="mb-3 border border-[#FED7AA] bg-[#FFF7ED] px-3 py-2.5 text-sm text-[#9A3412]">
                        <strong className="font-semibold text-[#7C2D12]">Demo access</strong> — pick a persona below to log in instantly. No password required.
                      </div>

                      {fieldErrors.form && (
                        <div className="mb-3 border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                          {fieldErrors.form}
                        </div>
                      )}

                      <div className="mb-3 space-y-1.5">
                        <label className="block text-[10px] font-semibold uppercase tracking-wide text-[#78716C]">
                          Operating Region
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A29E]" />
                          <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            className={`${inputCls} pl-9`}
                          >
                            {REGIONS.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {DEMO_ROLES.map(({ role, label, icon: Icon }) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => handleDemoAccess(role)}
                            disabled={isLoading}
                            className="group inline-flex items-center gap-2 border border-[#E7E5E4] bg-white px-3 py-2.5 text-left text-sm hover:border-[#D97706] hover:bg-[#FFF7ED] disabled:opacity-50 transition-colors"
                          >
                            <span className="flex h-7 w-7 items-center justify-center bg-[#D97706]/10 text-[#D97706] flex-shrink-0">
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <span className="font-semibold text-[#1C1917] truncate">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative flex items-center">
                      <div className="flex-grow border-t border-[#E7E5E4]" />
                      <span className="flex-shrink mx-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A8A29E]">
                        Or use your account
                      </span>
                      <div className="flex-grow border-t border-[#E7E5E4]" />
                    </div>
                  </>
                )}

                {!DEMO_LOGIN_ENABLED && fieldErrors.form && (
                  <div className="border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    {fieldErrors.form}
                  </div>
                )}

                <form onSubmit={handleNormalLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wide text-[#78716C]">Work Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A29E]" />
                    <input
                      id="email" type="email" required value={email}
                      onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: '' })); }}
                      placeholder="name@company.com"
                      className={`${inputCls} pl-9 ${fieldErrors.email ? 'border-red-400' : ''}`}
                    />
                  </div>
                  {fieldErrors.email && <p className="text-xs text-red-600">{fieldErrors.email}</p>}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wide text-[#78716C]">Password</label>
                    <button type="button" className="text-xs font-medium text-[#D97706] hover:text-[#b45309]">Forgot?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A29E]" />
                    <input
                      id="password" type="password" required value={password}
                      onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })); }}
                      placeholder="••••••••"
                      className={`${inputCls} pl-9 ${fieldErrors.password ? 'border-red-400' : ''}`}
                    />
                  </div>
                  {fieldErrors.password && <p className="text-xs text-red-600">{fieldErrors.password}</p>}
                </div>

                <button
                  type="submit" disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-[#D97706] text-white text-sm font-semibold py-2.5 px-4 hover:bg-[#b45309] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading
                    ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><span>Sign In</span><ArrowRight className="h-4 w-4" /></>
                  }
                </button>
                </form>

                <p className="text-center text-sm text-[#78716C]">
                  New here?{' '}
                  <Link href="/join" className="font-semibold text-[#D97706] hover:underline">
                    Create an account
                  </Link>
                </p>
              </div>
            )}

            {activeMode === 'supplier' && (
              <div className="space-y-4">
                <div className="border border-[#E7E5E4] bg-[#FAFAF9] p-3 flex items-start gap-3 text-sm text-[#44403C]">
                  <Building2 className="h-4 w-4 text-[#D97706] mt-0.5 flex-shrink-0" />
                  <span><strong className="font-semibold text-[#1C1917]">Supplier Onboarding</strong> Register for approved supplier consideration and NOU traceability.</span>
                </div>
                <p className="text-sm text-[#78716C] leading-relaxed">
                  Supplier registration collects company, compliance, and account details on a dedicated
                  page. HEVACRAZ and the NOU review every application before an account is activated.
                </p>
                <Link
                  href="/supplier-register"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#D97706] text-white text-sm font-semibold py-2.5 px-4 hover:bg-[#b45309] transition-colors"
                >
                  <span>Continue to Supplier Registration</span>
                  <PackageSearch className="h-4 w-4" />
                </Link>
                <p className="text-center text-sm text-[#78716C]">
                  Already an approved supplier?{' '}
                  <button
                    type="button"
                    onClick={() => setManualMode('signin')}
                    className="font-semibold text-[#D97706] hover:underline"
                  >
                    Sign in instead
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-[#A8A29E] mt-6">
          HEVACRAZ Compliance Platform · v1.4
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
