"use client";

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../lib/auth';
import { SupplierRegistration, UserRole } from '../../../types';
import { createSupplierApplication } from '@/lib/api';
import { Thermometer, Lock, Mail, ArrowRight, MapPin, ShieldCheck, Building2, PackageSearch, User, GraduationCap, Scale } from 'lucide-react';

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
  { role: 'regulator',  label: 'Regulator',   description: 'Read-only compliance and verification access.', icon: Scale },
];

type SupplierFormState = {
  companyName: string; contactPerson: string; email: string; phone: string;
  province: string; refrigerants: string; businessRegNumber: string; category: string;
};

function getSupplierType(category: string): SupplierRegistration['supplierType'] {
  switch (category) {
    case 'Importer': return 'importer';
    case 'Service Partner': return 'service-partner';
    case 'Equipment Supplier': return 'wholesaler';
    default: return 'distributor';
  }
}

function buildSupplierRegistration(f: SupplierFormState): SupplierRegistration {
  const ts = Date.now();
  return {
    id: `SUP-APP-${ts}`,
    companyName: f.companyName,
    registrationNumber: f.businessRegNumber || `SUP-${ts}`,
    supplierType: getSupplierType(f.category),
    contactName: f.contactPerson,
    email: f.email,
    phone: f.phone,
    province: f.province,
    city: f.province,
    address: f.province,
    refrigerantsSupplied: f.refrigerants.split(',').map(s => s.trim()).filter(Boolean),
    status: 'submitted',
    submittedAt: new Date().toISOString(),
    notes: `Submitted from login supplier onboarding flow (${f.category}).`,
  };
}

const inputCls = 'block w-full px-3 py-2.5 bg-white border border-[#E7E5E4] text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706] transition-colors text-sm';
const REGIONS = ["Harare", "Bulawayo", "Mutare", "Gweru", "Masvingo", "Other"];

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, demo } = useAuth();
  const [manualMode, setManualMode] = useState<'signin' | 'demo' | 'supplier' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [supplierSubmitted, setSupplierSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedRegion, setSelectedRegion] = useState('Harare');
  const [supplierForm, setSupplierForm] = useState<SupplierFormState>({
    companyName: '', contactPerson: '', email: '', phone: '',
    province: 'Harare', refrigerants: 'R-290, R-32, R-744',
    businessRegNumber: '', category: 'Distributor',
  });

  const isSupplierFlow = searchParams.get('flow') === 'supplier';
  const activeMode = manualMode ?? (isSupplierFlow ? 'supplier' : 'signin');
  const nextPath = searchParams.get('next') || (isSupplierFlow ? '/suppliers' : '/dashboard');

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
      await login(email);
      router.push(nextPath);
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
      router.push(nextPath);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Demo login failed.';
      setFieldErrors({ form: message });
      setIsLoading(false);
    }
  };

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.companyName || !supplierForm.contactPerson || !supplierForm.email || !supplierForm.phone) return;
    setIsLoading(true);
    const reg = buildSupplierRegistration(supplierForm);
    await createSupplierApplication({
      companyName: reg.companyName,
      tradingName: reg.tradingName,
      registrationNumber: reg.registrationNumber,
      supplierType: reg.supplierType,
      contactName: reg.contactName,
      email: reg.email,
      phone: reg.phone,
      province: reg.province,
      city: reg.city,
      address: reg.address,
      refrigerantsSupplied: reg.refrigerantsSupplied,
      notes: reg.notes,
    }).catch(() => undefined);
    if (demo) { demo('vendor', supplierForm.province); }
    setSupplierSubmitted(true);
    router.push(nextPath);
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
        <div className="bg-white border border-[#E7E5E4] shadow-sm">

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
              <form onSubmit={handleNormalLogin} className="space-y-4">
                {fieldErrors.form && (
                  <div className="border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    {fieldErrors.form}
                  </div>
                )}
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

                {/* Divider + Demo personas */}
                <div className="pt-2">
                  <div className="relative flex items-center my-4">
                    <div className="flex-grow border-t border-[#E7E5E4]" />
                    <span className="flex-shrink mx-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A8A29E]">
                      Or try a demo persona
                    </span>
                    <div className="flex-grow border-t border-[#E7E5E4]" />
                  </div>

                  <div className="space-y-1.5 mb-3">
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
                        className="group inline-flex items-center gap-2 border border-[#E7E5E4] bg-white px-3 py-2 text-left text-sm hover:border-[#D97706] hover:bg-[#FAFAF9] disabled:opacity-50 transition-colors"
                      >
                        <span className="flex h-7 w-7 items-center justify-center bg-[#D97706]/10 text-[#D97706] flex-shrink-0">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="font-semibold text-[#1C1917] truncate">{label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-[#A8A29E]">
                    Demo personas log you in instantly without a password.
                  </p>
                </div>
              </form>
            )}

            {activeMode === 'supplier' && (
              <form onSubmit={handleSupplierSubmit} className="space-y-4">
                <div className="border border-[#E7E5E4] bg-[#FAFAF9] p-3 flex items-start gap-3 text-sm text-[#44403C]">
                  <Building2 className="h-4 w-4 text-[#D97706] mt-0.5 flex-shrink-0" />
                  <span><strong className="font-semibold text-[#1C1917]">Supplier Onboarding</strong> Register for approved supplier consideration and NOU traceability.</span>
                </div>

                {supplierSubmitted && (
                  <div className="border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-800">
                    Registration saved. Continuing to vendor portal.
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#78716C]">Business Name</label>
                  <input value={supplierForm.companyName} onChange={e => setSupplierForm({ ...supplierForm, companyName: e.target.value })} className={inputCls} placeholder="Zimbabwe Refrigeration Supplies" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-[#78716C]">Contact Person</label>
                    <input value={supplierForm.contactPerson} onChange={e => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })} className={inputCls} placeholder="Full name" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-[#78716C]">Reg. No.</label>
                    <input value={supplierForm.businessRegNumber} onChange={e => setSupplierForm({ ...supplierForm, businessRegNumber: e.target.value })} className={inputCls} placeholder="CO/24/0001" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-[#78716C]">Email</label>
                    <input type="email" value={supplierForm.email} onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })} className={inputCls} placeholder="supplier@co.zw" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-[#78716C]">Phone</label>
                    <input value={supplierForm.phone} onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })} className={inputCls} placeholder="+263 77 123 4567" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-[#78716C]">Province</label>
                    <select value={supplierForm.province} onChange={e => setSupplierForm({ ...supplierForm, province: e.target.value })} className={inputCls}>
                      {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-[#78716C]">Category</label>
                    <select value={supplierForm.category} onChange={e => setSupplierForm({ ...supplierForm, category: e.target.value })} className={inputCls}>
                      <option>Distributor</option>
                      <option>Importer</option>
                      <option>Equipment Supplier</option>
                      <option>Service Partner</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#78716C]">Refrigerants Supplied</label>
                  <input value={supplierForm.refrigerants} onChange={e => setSupplierForm({ ...supplierForm, refrigerants: e.target.value })} className={inputCls} placeholder="R-290, R-32, R-744" />
                </div>

                <button
                  type="submit" disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-[#D97706] text-white text-sm font-semibold py-2.5 px-4 hover:bg-[#b45309] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading
                    ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><span>Register Supplier</span><PackageSearch className="h-4 w-4" /></>
                  }
                </button>
              </form>
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
