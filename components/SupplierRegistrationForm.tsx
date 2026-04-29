'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Loader2, ShieldCheck } from 'lucide-react';
import { ZIMBABWE_PROVINCES } from '@/constants/registry';
import type { SupplierRegistration } from '@/types/index';
import { createSupplierApplication } from '@/lib/api';

const ACCENT = '#D97706';
const ACCENT_TINT = 'rgba(217,119,6,0.10)';
const BORDER = '#E5E0DB';
const BG_INPUT = '#FAFAF9';

const SUPPLIER_TYPES: Array<SupplierRegistration['supplierType']> = [
  'importer',
  'wholesaler',
  'distributor',
  'manufacturer',
  'service-partner',
];

const APPROVED_REFRIGERANTS = [
  { code: 'R-290', safety: 'A3' },
  { code: 'R-32', safety: 'A2L' },
  { code: 'R-744', safety: 'A1' },
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
  agree: boolean;
};

const INITIAL: SupplierFormState = {
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
  agree: false,
};

export default function SupplierRegistrationForm() {
  const [form, setForm] = useState<SupplierFormState>(INITIAL);
  const [submitted, setSubmitted] = useState<SupplierRegistration | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof SupplierFormState>(key: K, value: SupplierFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleRefrigerant = (code: string) =>
    setForm((f) => ({
      ...f,
      refrigerantsSupplied: f.refrigerantsSupplied.includes(code)
        ? f.refrigerantsSupplied.filter((c) => c !== code)
        : [...f.refrigerantsSupplied, code],
    }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || !form.agree) return;

    if (!form.companyName || !form.registrationNumber || !form.contactName || !form.email || !form.phone) {
      setError('Please complete the required company and contact fields.');
      return;
    }
    if (form.refrigerantsSupplied.length === 0) {
      setError('Select at least one refrigerant category before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const record = await createSupplierApplication({
        companyName: form.companyName.trim(),
        tradingName: form.tradingName.trim() || undefined,
        registrationNumber: form.registrationNumber.trim(),
        supplierType: form.supplierType,
        contactName: form.contactName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        province: form.province,
        city: form.city.trim(),
        address: form.address.trim(),
        refrigerantsSupplied: form.refrigerantsSupplied,
        taxNumber: form.taxNumber.trim() || undefined,
        pesepayMerchantId: form.pesepayMerchantId.trim() || undefined,
        website: form.website.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      setSubmitted(record);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Submission failed. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white border p-6 sm:p-8" style={{ borderColor: BORDER }}>
        <div className="text-center py-10 sm:py-14">
          <div className="inline-flex p-3 mb-4" style={{ backgroundColor: ACCENT_TINT }}>
            <CheckCircle className="h-10 w-10" style={{ color: ACCENT }} />
          </div>
          <h2 className="text-2xl font-bold" style={{ color: '#1C1917' }}>
            Application submitted
          </h2>
          <p className="mt-3 text-gray-600 max-w-md mx-auto leading-relaxed">
            Thanks, {submitted.companyName}. Your application is now in the HEVACRAZ review queue.
            The National Compliance Oversight Unit will be notified once HEVACRAZ approves your
            credentials.
          </p>
          <div
            className="mt-5 inline-flex flex-col items-center gap-1 border px-4 py-3 text-xs"
            style={{ borderColor: BORDER, backgroundColor: BG_INPUT }}
          >
            <span className="text-gray-500 uppercase tracking-[0.18em] font-semibold">
              Reference
            </span>
            <span className="font-mono text-sm font-semibold" style={{ color: '#1C1917' }}>
              {submitted.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 font-semibold text-white text-sm transition-colors"
              style={{ backgroundColor: ACCENT }}
            >
              Go to Dashboard
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 font-semibold text-sm border transition-colors hover:bg-[#FAFAF9]"
              style={{ borderColor: BORDER, color: '#1C1917' }}
            >
              Return home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border p-6 sm:p-8" style={{ borderColor: BORDER }}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset className="space-y-5">
          <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 mb-3">
            Company details
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Company name" required>
              <Input
                value={form.companyName}
                onChange={(v) => update('companyName', v)}
                required
                placeholder="Zimbabwe Refrigeration Supplies"
              />
            </Field>
            <Field label="Trading name">
              <Input
                value={form.tradingName}
                onChange={(v) => update('tradingName', v)}
                placeholder="Optional"
              />
            </Field>
            <Field label="Registration number" required>
              <Input
                value={form.registrationNumber}
                onChange={(v) => update('registrationNumber', v)}
                required
                placeholder="CR 123/2026"
              />
            </Field>
            <Field label="Supplier type" required>
              <Select
                value={form.supplierType}
                onChange={(v) => update('supplierType', v as SupplierRegistration['supplierType'])}
                required
              >
                {SUPPLIER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replace('-', ' ')}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </fieldset>

        <fieldset className="space-y-5 pt-5 border-t" style={{ borderColor: BORDER }}>
          <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 mb-3">
            Contact
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Contact name" required>
              <Input
                value={form.contactName}
                onChange={(v) => update('contactName', v)}
                required
                placeholder="Primary contact"
              />
            </Field>
            <Field label="Email" required>
              <Input
                type="email"
                value={form.email}
                onChange={(v) => update('email', v)}
                required
                placeholder="supplier@example.co.zw"
              />
            </Field>
            <Field label="Phone" required>
              <Input
                type="tel"
                value={form.phone}
                onChange={(v) => update('phone', v)}
                required
                placeholder="+263 77 000 0000"
              />
            </Field>
            <Field label="Province" required>
              <Select
                value={form.province}
                onChange={(v) => update('province', v)}
                required
              >
                {ZIMBABWE_PROVINCES.map((province) => (
                  <option key={province.id} value={province.name}>
                    {province.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="City / town" required>
              <Input
                value={form.city}
                onChange={(v) => update('city', v)}
                required
                placeholder="Harare, Bulawayo, Mutare..."
              />
            </Field>
          </div>
          <Field label="Physical address" required>
            <Textarea
              value={form.address}
              onChange={(v) => update('address', v)}
              required
              rows={3}
              placeholder="Warehouse or office address"
            />
          </Field>
        </fieldset>

        <fieldset className="space-y-3 pt-5 border-t" style={{ borderColor: BORDER }}>
          <div className="flex items-baseline justify-between gap-2">
            <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Refrigerants supplied
            </legend>
            <span className="text-[11px] font-medium" style={{ color: ACCENT }}>
              Choose at least one
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {APPROVED_REFRIGERANTS.map((item) => {
              const active = form.refrigerantsSupplied.includes(item.code);
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => toggleRefrigerant(item.code)}
                  className="border px-4 py-4 text-left transition-colors"
                  style={{
                    borderColor: active ? ACCENT : BORDER,
                    backgroundColor: active ? ACCENT_TINT : '#ffffff',
                  }}
                >
                  <p className="text-sm font-semibold" style={{ color: '#1C1917' }}>
                    {item.code}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Safety class {item.safety}</p>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="space-y-5 pt-5 border-t" style={{ borderColor: BORDER }}>
          <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 mb-3">
            Optional
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Tax number">
              <Input
                value={form.taxNumber}
                onChange={(v) => update('taxNumber', v)}
                placeholder="Tax reference"
              />
            </Field>
            <Field label="Pesepay merchant ID">
              <Input
                value={form.pesepayMerchantId}
                onChange={(v) => update('pesepayMerchantId', v)}
                placeholder="For verified purchases"
              />
            </Field>
          </div>
          <Field label="Website / notes">
            <Textarea
              value={form.notes}
              onChange={(v) => update('notes', v)}
              rows={3}
              placeholder="Website, business notes, branch locations"
            />
          </Field>
        </fieldset>

        <fieldset className="pt-5 border-t" style={{ borderColor: BORDER }}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.agree}
              onChange={(e) => update('agree', e.target.checked)}
              className="mt-1"
              required
            />
            <span className="text-sm text-gray-600 leading-relaxed">
              I confirm the information above is accurate. I consent to HEVACRAZ verifying my
              business credentials with the registrar and listing my approved supplier profile in
              the public supplier directory.
            </span>
          </label>
        </fieldset>

        {error && (
          <div
            className="border px-4 py-3 text-sm"
            style={{ borderColor: '#F87171', backgroundColor: '#FEF2F2', color: '#991B1B' }}
          >
            {error}
          </div>
        )}

        <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button
            type="submit"
            disabled={!form.agree || submitting}
            className="group inline-flex items-center justify-center gap-2 font-semibold py-3.5 px-8 text-white text-sm transition-all duration-200 hover:brightness-110 shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100"
            style={{ backgroundColor: ACCENT }}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit application
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </>
            )}
          </button>
          <p className="inline-flex items-center gap-1.5 text-xs text-gray-500">
            <ShieldCheck className="h-4 w-4" style={{ color: ACCENT }} />
            HEVACRAZ verifies all submissions before publication.
          </p>
        </div>
      </form>
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
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: '#1C1917' }}>
        {label}
        {required ? <span className="ml-1" style={{ color: '#DC2626' }}>*</span> : null}
      </label>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      placeholder={placeholder}
      className="w-full px-4 py-3 border text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent"
      style={{ borderColor: BORDER }}
    />
  );
}

function Select({
  value,
  onChange,
  required,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full px-4 py-3 border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent"
      style={{ borderColor: BORDER }}
    >
      {children}
    </select>
  );
}

function Textarea({
  value,
  onChange,
  required,
  rows = 3,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      rows={rows}
      placeholder={placeholder}
      className="w-full px-4 py-3 border text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent"
      style={{ borderColor: BORDER }}
    />
  );
}
