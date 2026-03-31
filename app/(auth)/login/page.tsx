"use client";

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../lib/auth';
import { SupplierRegistration, UserRole } from '../../../types';
import { prependCollectionItem, STORAGE_KEYS } from '@/lib/platformStore';
import { Thermometer, Lock, Mail, ArrowRight, MapPin, ShieldCheck, Building2, PackageSearch, User, GraduationCap } from 'lucide-react';

// HEVACRAZ Color Scheme (matching landing page)
const colors = {
    primary: '#2C2420', // Rich charcoal
    secondary: '#D4A574', // Warm terracotta
    accent: '#5A7D5A', // Sage green
    highlight: '#FF6B35', // Electric orange
    background: '#FDF8F3', // Warm off-white
};

const DEMO_ROLES: Array<{
  role: UserRole;
  label: string;
  description: string;
  icon: typeof User;
}> = [
  {
    role: 'program_admin',
    label: 'Program Admin',
    description: 'National dashboards and full oversight.',
    icon: ShieldCheck,
  },
  {
    role: 'org_admin',
    label: 'Org Admin',
    description: 'Operations, suppliers, and team visibility.',
    icon: Building2,
  },
  {
    role: 'technician',
    label: 'Technician',
    description: 'Field tools, jobs, and certifications.',
    icon: Thermometer,
  },
  {
    role: 'trainer',
    label: 'Trainer',
    description: 'Learning flows and assessor tools.',
    icon: GraduationCap,
  },
  {
    role: 'vendor',
    label: 'Vendor',
    description: 'Supplier-facing demo workspace.',
    icon: PackageSearch,
  },
];

type SupplierFormState = {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  province: string;
  refrigerants: string;
  businessRegNumber: string;
  category: string;
};

function getSupplierType(category: string): SupplierRegistration['supplierType'] {
  switch (category) {
    case 'Importer':
      return 'importer';
    case 'Service Partner':
      return 'service-partner';
    case 'Equipment Supplier':
      return 'wholesaler';
    default:
      return 'distributor';
  }
}

function buildSupplierRegistration(supplierForm: SupplierFormState): SupplierRegistration {
  const timestamp = Date.now();

  return {
    id: `SUP-APP-${timestamp}`,
    companyName: supplierForm.companyName,
    registrationNumber: supplierForm.businessRegNumber || `SUP-${timestamp}`,
    supplierType: getSupplierType(supplierForm.category),
    contactName: supplierForm.contactPerson,
    email: supplierForm.email,
    phone: supplierForm.phone,
    province: supplierForm.province,
    city: supplierForm.province,
    address: supplierForm.province,
    refrigerantsSupplied: supplierForm.refrigerants
      .split(',')
      .map(item => item.trim())
      .filter(Boolean),
    status: 'submitted',
    submittedAt: new Date().toISOString(),
    notes: `Submitted from login supplier onboarding flow (${supplierForm.category}).`,
  };
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, demo } = useAuth();
  const [manualMode, setManualMode] = useState<'signin' | 'demo' | 'supplier' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [supplierSubmitted, setSupplierSubmitted] = useState(false);

  // Demo Specific State
  const [selectedRegion, setSelectedRegion] = useState('Harare');
  const [supplierForm, setSupplierForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    province: 'Harare',
    refrigerants: 'R-290, R-32, R-744',
    businessRegNumber: '',
    category: 'Distributor',
  });

  const REGIONS = ["Harare", "Bulawayo", "Mutare", "Gweru", "Masvingo", "Other"];
  const isSupplierFlow = searchParams.get('flow') === 'supplier';
  const activeMode = manualMode ?? (isSupplierFlow ? 'supplier' : 'signin');
  const nextPath = searchParams.get('next') || (isSupplierFlow ? '/suppliers' : '/dashboard');

  const handleNormalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    await login(email);
    router.push(nextPath);
  };

  const handleDemoAccess = async (role: UserRole) => {
    setIsLoading(true);
    if (demo) {
      demo(role, selectedRegion);
      router.push(nextPath);
    }
  };

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.companyName || !supplierForm.contactPerson || !supplierForm.email || !supplierForm.phone) return;

    setIsLoading(true);

    if (typeof window !== 'undefined') {
      const registration = buildSupplierRegistration(supplierForm);

      prependCollectionItem<SupplierRegistration>(
        STORAGE_KEYS.supplierApplications,
        registration,
        [],
        [STORAGE_KEYS.supplierProfilesLegacy]
      );
    }

    if (demo) {
      demo('vendor', supplierForm.province);
    }
    setSupplierSubmitted(true);
    router.push(nextPath);
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
              onClick={() => setManualMode('signin')}
              className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all ${
                activeMode === 'signin' 
                  ? 'text-white shadow-sm' 
                  : ''
              }`}
              style={{ 
                backgroundColor: activeMode === 'signin' ? colors.highlight : 'transparent',
                color: activeMode === 'signin' ? 'white' : colors.primary
              }}
            >
              Sign In
            </button>
            <button 
              onClick={() => setManualMode('demo')}
              className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all ${
                activeMode === 'demo' 
                  ? 'text-white shadow-sm' 
                  : ''
              }`}
              style={{ 
                backgroundColor: activeMode === 'demo' ? colors.highlight : 'transparent',
                color: activeMode === 'demo' ? 'white' : colors.primary
              }}
            >
              Demo Access
            </button>
            <button 
              onClick={() => setManualMode('supplier')}
              className={`flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all ${
                activeMode === 'supplier' 
                  ? 'text-white shadow-sm' 
                  : ''
              }`}
              style={{ 
                backgroundColor: activeMode === 'supplier' ? colors.highlight : 'transparent',
                color: activeMode === 'supplier' ? 'white' : colors.primary
              }}
            >
              Supplier
            </button>
          </div>

          {activeMode === 'signin' ? (
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
          ) : activeMode === 'demo' ? (
            // Demo Access Form
            <div className="space-y-5">
              <div className="rounded-xl p-4 border" style={{ backgroundColor: colors.secondary + '20', borderColor: colors.secondary }}>
                <p className="text-sm" style={{ color: colors.primary }}>
                  <strong className="font-semibold">Demo Mode:</strong> No password required. Select a persona to test role-specific tools and dashboards.
                </p>
              </div>

              <div className="space-y-4">
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

                <div className="space-y-2">
                  <p className="block text-sm font-semibold text-gray-700">Choose Demo Role</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {DEMO_ROLES.map((demoRole) => {
                      const Icon = demoRole.icon;

                      return (
                        <button
                          key={demoRole.role}
                          type="button"
                          onClick={() => handleDemoAccess(demoRole.role)}
                          disabled={isLoading}
                          className="group rounded-xl border border-gray-200 bg-gray-50 p-4 text-left transition-all hover:border-[#FF6B35] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-gray-900">{demoRole.label}</p>
                              <p className="text-xs leading-5 text-gray-500">{demoRole.description}</p>
                            </div>
                            <div
                              className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm transition-transform group-hover:scale-105"
                              style={{ backgroundColor: colors.highlight }}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                          </div>
                          <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#FF6B35]">
                            Open demo
                            <ArrowRight className="h-3.5 w-3.5" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSupplierSubmit} className="space-y-5">
              <div className="rounded-xl p-4 border flex items-start gap-3" style={{ backgroundColor: colors.secondary + '20', borderColor: colors.secondary }}>
                <div className="rounded-lg bg-white p-2 text-[#5A7D5A]">
                  <Building2 className="h-5 w-5" />
                </div>
                <p className="text-sm" style={{ color: colors.primary }}>
                  <strong className="font-semibold">Supplier Onboarding:</strong> Register your business for approved supplier consideration and NOU traceability.
                </p>
              </div>

              {supplierSubmitted && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                  Supplier registration saved locally. You can continue into the vendor portal.
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Business Name</label>
                  <input
                    value={supplierForm.companyName}
                    onChange={(e) => setSupplierForm({ ...supplierForm, companyName: e.target.value })}
                    className="block w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Zimbabwe Refrigeration Supplies"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Contact Person</label>
                    <input
                      value={supplierForm.contactPerson}
                      onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                      className="block w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Business Reg. No.</label>
                    <input
                      value={supplierForm.businessRegNumber}
                      onChange={(e) => setSupplierForm({ ...supplierForm, businessRegNumber: e.target.value })}
                      className="block w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="CO/24/0001"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Email</label>
                    <input
                      type="email"
                      value={supplierForm.email}
                      onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                      className="block w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="supplier@company.co.zw"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Phone</label>
                    <input
                      value={supplierForm.phone}
                      onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                      className="block w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="+263 77 123 4567"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Province</label>
                    <select
                      value={supplierForm.province}
                      onChange={(e) => setSupplierForm({ ...supplierForm, province: e.target.value })}
                      className="block w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                    >
                      {REGIONS.map(reg => (
                        <option key={reg} value={reg}>{reg}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Category</label>
                    <select
                      value={supplierForm.category}
                      onChange={(e) => setSupplierForm({ ...supplierForm, category: e.target.value })}
                      className="block w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="Distributor">Distributor</option>
                      <option value="Importer">Importer</option>
                      <option value="Equipment Supplier">Equipment Supplier</option>
                      <option value="Service Partner">Service Partner</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Refrigerants Supplied</label>
                  <input
                    value={supplierForm.refrigerants}
                    onChange={(e) => setSupplierForm({ ...supplierForm, refrigerants: e.target.value })}
                    className="block w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="R-290, R-32, R-744"
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
                    Register Supplier
                    <PackageSearch className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
