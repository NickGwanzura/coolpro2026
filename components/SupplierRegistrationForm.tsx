'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileCheck,
  MapPin,
  Sparkles,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { ZIMBABWE_PROVINCES } from '@/constants/registry';
import type { SupplierRegistration } from '@/types/index';
import { prependCollectionItem, readCollection, STORAGE_KEYS } from '@/lib/platformStore';

const SUPPLIER_TYPES: Array<SupplierRegistration['supplierType']> = [
  'importer',
  'wholesaler',
  'distributor',
  'manufacturer',
  'service-partner',
];

type SupplierFormState = {
  companyName: string;
  tradingName: string;
  registrationNumber: string;
  supplierType: SupplierRegistration['supplierType'];
  contactName: string;
  email: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  refrigerantsSupplied: string[];
  taxNumber: string;
  pesepayMerchantId: string;
  website: string;
  notes: string;
};

const APPROVED_REFRIGERANTS = [
  { code: 'R-290', name: 'R-290', safety: 'A3' },
  { code: 'R-32', name: 'R-32', safety: 'A2L' },
  { code: 'R-744', name: 'R-744', safety: 'A1' },
];

const INITIAL_FORM: SupplierFormState = {
  companyName: '',
  tradingName: '',
  registrationNumber: '',
  supplierType: 'distributor',
  contactName: '',
  email: '',
  phone: '',
  province: 'Harare',
  city: '',
  address: '',
  refrigerantsSupplied: [],
  taxNumber: '',
  pesepayMerchantId: '',
  website: '',
  notes: '',
};

export default function SupplierRegistrationForm() {
  const router = useRouter();
  const [form, setForm] = useState<SupplierFormState>(INITIAL_FORM);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState<SupplierRegistration | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    setSavedCount(readCollection<SupplierRegistration>(STORAGE_KEYS.supplierApplications, []).length);
  }, []);

  const toggleRefrigerant = (code: string) => {
    setForm(prev => ({
      ...prev,
      refrigerantsSupplied: prev.refrigerantsSupplied.includes(code)
        ? prev.refrigerantsSupplied.filter(item => item !== code)
        : [...prev.refrigerantsSupplied, code],
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.companyName || !form.registrationNumber || !form.contactName || !form.email || !form.phone) {
      setMessage('Please complete the required company and contact fields.');
      return;
    }

    if (form.refrigerantsSupplied.length === 0) {
      setMessage('Select at least one refrigerant category before submitting.');
      return;
    }

    const record: SupplierRegistration = {
      id: `SUP-APP-${Date.now()}`,
      companyName: form.companyName,
      tradingName: form.tradingName || undefined,
      registrationNumber: form.registrationNumber,
      supplierType: form.supplierType,
      contactName: form.contactName,
      email: form.email,
      phone: form.phone,
      province: form.province,
      city: form.city,
      address: form.address,
      refrigerantsSupplied: form.refrigerantsSupplied,
      taxNumber: form.taxNumber || undefined,
      pesepayMerchantId: form.pesepayMerchantId || undefined,
      website: form.website || undefined,
      notes: form.notes || undefined,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
    };

    const nextApplications = prependCollectionItem<SupplierRegistration>(
      STORAGE_KEYS.supplierApplications,
      record,
      [],
      [STORAGE_KEYS.supplierProfilesLegacy]
    );
    setSavedCount(nextApplications.length);

    setSubmitted(record);
    setMessage('');
  };

  if (submitted) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">
                Submission received
              </p>
              <h2 className="text-2xl font-bold text-gray-900">Supplier registration submitted</h2>
              <p className="max-w-2xl text-sm leading-6 text-gray-600">
                Your application is now in the mock review queue for the National Compliance Oversight Unit.
                We have saved it locally on this device for the demo flow.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Reference</p>
              <p className="mt-2 text-lg font-bold text-gray-900">{submitted.id}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Submitted</p>
              <p className="mt-2 text-lg font-bold text-gray-900">
                {new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(submitted.submittedAt))}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Business</p>
              <p className="mt-2 text-lg font-bold text-gray-900">{submitted.companyName}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</p>
              <p className="mt-2 text-lg font-bold text-gray-900">Under review</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setSubmitted(null)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Register Another Supplier
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Go to Dashboard
            </button>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">What happens next</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-600">
              <li className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                HEVACRAZ reviews your business registration and compliance documents.
              </li>
              <li className="flex items-start gap-3">
                <FileCheck className="mt-0.5 h-4 w-4 text-blue-600" />
                Approved suppliers can appear in the NOU supplier monitoring module.
              </li>
              <li className="flex items-start gap-3">
                <Truck className="mt-0.5 h-4 w-4 text-amber-600" />
                Your refrigerant categories are stored for the mock supply-chain flow.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-900 p-5 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-300">Saved submissions</p>
            </div>
            <p className="mt-3 text-3xl font-bold">{savedCount}</p>
            <p className="mt-2 text-sm text-gray-300">Mock applications stored locally on this device.</p>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">Supplier onboarding</p>
          <h2 className="text-2xl font-bold text-gray-900">Register your business as an approved supplier</h2>
          <p className="max-w-2xl text-sm leading-6 text-gray-600">
            Complete the mock registration form below to enter the HEVACRAZ supplier review flow.
            This keeps all supplier data local to the demo and uses the existing Tailwind patterns.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company Name" required>
              <input
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                placeholder="e.g. Zimbabwe Refrigeration Supplies"
              />
            </Field>
            <Field label="Trading Name">
              <input
                value={form.tradingName}
                onChange={(e) => setForm({ ...form, tradingName: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                placeholder="Optional trading name"
              />
            </Field>
            <Field label="Registration Number" required>
              <input
                value={form.registrationNumber}
                onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                placeholder="CR 123/2026"
              />
            </Field>
            <Field label="Supplier Type" required>
              <select
                value={form.supplierType}
                onChange={(e) => setForm({ ...form, supplierType: e.target.value as SupplierRegistration['supplierType'] })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
              >
                {SUPPLIER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replace('-', ' ')}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Contact Name" required>
              <input
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                placeholder="Primary contact person"
              />
            </Field>
            <Field label="Email" required>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                placeholder="supplier@example.co.zw"
              />
            </Field>
            <Field label="Phone" required>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                placeholder="+263 77 000 0000"
              />
            </Field>
            <Field label="Province" required>
              <select
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
              >
                {ZIMBABWE_PROVINCES.map((province) => (
                  <option key={province.id} value={province.name}>
                    {province.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="City / Town" required>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                placeholder="Harare, Bulawayo, Mutare..."
              />
            </Field>
          </div>

          <Field label="Physical Address" required>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
              placeholder="Warehouse / office address"
            />
          </Field>

          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-700">Refrigerants Supplied</p>
              <span className="text-xs font-medium text-amber-700">Choose at least one</span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {APPROVED_REFRIGERANTS.map((item) => {
                const active = form.refrigerantsSupplied.includes(item.code);
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => toggleRefrigerant(item.code)}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      active
                        ? 'border-blue-300 bg-blue-50 shadow-sm'
                        : 'border-gray-200 bg-gray-50 hover:bg-white'
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                    <p className="mt-1 text-xs text-gray-500">Safety class {item.safety}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tax Number">
              <input
                value={form.taxNumber}
                onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                placeholder="Optional tax reference"
              />
            </Field>
            <Field label="Pesepay Merchant ID">
              <input
                value={form.pesepayMerchantId}
                onChange={(e) => setForm({ ...form, pesepayMerchantId: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
                placeholder="Required for rewards onboarding"
              />
            </Field>
          </div>

          <Field label="Website / Notes">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
              placeholder="Website, business notes, branch locations"
            />
          </Field>

          {message && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Submit Supplier Application
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </section>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Supplier requirements</h3>
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-600">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
              Business registration details and contact information.
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
              At least one refrigerant category that you can reliably supply.
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
              Pesepay merchant ID if you want to connect rewards or verified purchases.
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-900 p-5 text-white shadow-lg">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-amber-400" />
            <h3 className="text-lg font-bold">Coverage</h3>
          </div>
          <p className="mt-3 text-sm leading-6 text-gray-300">
            Supplier applications are accepted across all Zimbabwe provinces in the mock flow and can be reviewed
            by the National Compliance Oversight Unit.
          </p>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">Local submissions</p>
            <p className="mt-2 text-2xl font-bold text-white">{savedCount}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push('/login')}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Back to Portal
        </button>
      </aside>
    </div>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-gray-700">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}
