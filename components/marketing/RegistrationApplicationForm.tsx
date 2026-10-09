'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ZIMBABWE_PROVINCES } from '@/constants/registry';
import { createRegistrationApplication } from '@/lib/api';
import { APPLICANT_ROLES, type RegistrationApplicationRole } from '@/lib/application-roles';
import { ApplicationSubmittedNotice } from '@/components/marketing/ApplicationSubmittedNotice';
import {
  CONTRACTOR_SERVICES,
  CONTRACTOR_TRADES,
  MIN_EXPERIENCE_LENGTH,
  SAFETY_CERTIFICATION_ANSWERS,
  TEAM_SIZES,
  YEARS_IN_OPERATION,
} from '@/lib/registration-options';

const BORDER = '#E5E0DB';
const INPUT_CLASS = 'w-full rounded-lg border bg-[#FAFAF9] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1C1917]/20';

const COPY: Record<RegistrationApplicationRole, { organisationLabel: string; organisationHint: string; summaryLabel: string; summaryHint: string }> = {
  trainer: {
    organisationLabel: 'Training provider or employer',
    organisationHint: 'The organisation you train or assess for',
    summaryLabel: 'Qualifications and assessment experience',
    summaryHint: 'Your trade or assessor qualifications, accreditations, and how long you have trained or assessed.',
  },
  lecturer: {
    organisationLabel: 'College or polytechnic',
    organisationHint: 'Where you teach',
    summaryLabel: 'Teaching background',
    summaryHint: 'The subjects you teach, your qualifications, and how long you have lectured.',
  },
  contractor: {
    organisationLabel: 'Company name',
    organisationHint: 'Your registered business name',
    summaryLabel: 'About your business',
    summaryHint: 'What you do, the kind of sites you work on, and how long you have been in business.',
  },
};

/** Applicants are asked for their details, shown a confirm-your-email screen, and wait for approval. */
export function RegistrationApplicationForm({
  role,
  accent,
  accentTint,
}: {
  role: RegistrationApplicationRole;
  accent: string;
  accentTint: string;
}) {
  const copy = COPY[role];
  const [done, setDone] = useState<{ id: string; name: string; email: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    region: '',
    organisation: '',
    experienceSummary: '',
    password: '',
    confirmPassword: '',
    website: '', // honeypot: real people never see or fill this
    agree: false,
  });
  const [contractor, setContractor] = useState({
    tradeSpecialization: '',
    yearsInOperation: '',
    teamSize: '',
    hasSafetyCertification: '',
    servicesOffered: [] as string[],
  });

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const toggleService = (service: string) =>
    setContractor((c) => ({
      ...c,
      servicesOffered: c.servicesOffered.includes(service) ? c.servicesOffered.filter((s) => s !== service) : [...c.servicesOffered, service],
    }));

  if (done) {
    return (
      <div className="bg-white border p-6 sm:p-8 rounded-xl" style={{ borderColor: BORDER }}>
        <ApplicationSubmittedNotice
          name={done.name}
          email={done.email}
          reference={done.id}
          role={role}
          accent={accent}
          accentTint={accentTint}
        />
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (form.experienceSummary.trim().length < MIN_EXPERIENCE_LENGTH) {
      return setError(`Please write a little more in "${copy.summaryLabel}" (at least ${MIN_EXPERIENCE_LENGTH} characters).`);
    }
    setSubmitting(true);
    setError(null);
    try {
      const record = await createRegistrationApplication({
        role,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim(),
        region: form.region,
        organisation: form.organisation.trim(),
        experienceSummary: form.experienceSummary.trim(),
        details: role === 'contractor' ? contractor : undefined,
        website: form.website,
      });
      setDone({ id: record.id, name: form.firstName.trim(), email: form.email.trim().toLowerCase() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const label = 'block text-sm font-medium mb-2';
  const labelStyle = { color: '#1C1917' };
  const inputStyle = { borderColor: BORDER };

  return (
    <form onSubmit={handleSubmit} className="bg-white border p-6 sm:p-8 rounded-xl space-y-6" style={{ borderColor: BORDER }}>
      <fieldset className="space-y-5">
        <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 mb-3">Your details</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="firstName" className={label} style={labelStyle}>First name</label>
            <input id="firstName" required autoComplete="given-name" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} className={INPUT_CLASS} style={inputStyle} />
          </div>
          <div>
            <label htmlFor="lastName" className={label} style={labelStyle}>Last name</label>
            <input id="lastName" required autoComplete="family-name" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} className={INPUT_CLASS} style={inputStyle} />
          </div>
          <div>
            <label htmlFor="email" className={label} style={labelStyle}>Email address</label>
            <input id="email" type="email" required autoComplete="email" value={form.email} onChange={(e) => update('email', e.target.value)} className={INPUT_CLASS} style={inputStyle} />
            <p className="mt-1 text-xs text-gray-500">We will send a confirmation link here.</p>
          </div>
          <div>
            <label htmlFor="phone" className={label} style={labelStyle}>Phone number</label>
            <input id="phone" type="tel" required autoComplete="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} className={INPUT_CLASS} style={inputStyle} />
          </div>
          <div>
            <label htmlFor="region" className={label} style={labelStyle}>Province</label>
            <select id="region" required value={form.region} onChange={(e) => update('region', e.target.value)} className={INPUT_CLASS} style={inputStyle}>
              <option value="">Choose a province</option>
              {ZIMBABWE_PROVINCES.map((province) => (
                <option key={province.name} value={province.name}>{province.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="organisation" className={label} style={labelStyle}>{copy.organisationLabel}</label>
            <input id="organisation" required value={form.organisation} onChange={(e) => update('organisation', e.target.value)} className={INPUT_CLASS} style={inputStyle} />
            <p className="mt-1 text-xs text-gray-500">{copy.organisationHint}</p>
          </div>
        </div>
      </fieldset>

      {role === 'contractor' && (
        <fieldset className="space-y-5">
          <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 mb-3">Your business</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="trade" className={label} style={labelStyle}>Main trade</label>
              <select id="trade" required value={contractor.tradeSpecialization} onChange={(e) => setContractor((c) => ({ ...c, tradeSpecialization: e.target.value }))} className={INPUT_CLASS} style={inputStyle}>
                <option value="">Choose a trade</option>
                {CONTRACTOR_TRADES.map((trade) => <option key={trade} value={trade}>{trade}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="years" className={label} style={labelStyle}>Years in operation</label>
              <select id="years" required value={contractor.yearsInOperation} onChange={(e) => setContractor((c) => ({ ...c, yearsInOperation: e.target.value }))} className={INPUT_CLASS} style={inputStyle}>
                <option value="">Choose</option>
                {YEARS_IN_OPERATION.map((years) => <option key={years} value={years}>{years}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="team" className={label} style={labelStyle}>Team size</label>
              <select id="team" required value={contractor.teamSize} onChange={(e) => setContractor((c) => ({ ...c, teamSize: e.target.value }))} className={INPUT_CLASS} style={inputStyle}>
                <option value="">Choose</option>
                {TEAM_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="safety" className={label} style={labelStyle}>Do you hold a safety certification?</label>
              <select id="safety" required value={contractor.hasSafetyCertification} onChange={(e) => setContractor((c) => ({ ...c, hasSafetyCertification: e.target.value }))} className={INPUT_CLASS} style={inputStyle}>
                <option value="">Choose</option>
                {SAFETY_CERTIFICATION_ANSWERS.map((answer) => <option key={answer} value={answer}>{answer}</option>)}
              </select>
            </div>
          </div>
          <div>
            <p className={label} style={labelStyle}>Services you offer</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CONTRACTOR_SERVICES.map((service) => (
                <label key={service} className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={contractor.servicesOffered.includes(service)} onChange={() => toggleService(service)} className="h-4 w-4" />
                  {service}
                </label>
              ))}
            </div>
          </div>
        </fieldset>
      )}

      <div>
        <label htmlFor="summary" className={label} style={labelStyle}>{copy.summaryLabel}</label>
        <textarea
          id="summary"
          required
          rows={5}
          value={form.experienceSummary}
          onChange={(e) => update('experienceSummary', e.target.value)}
          className={INPUT_CLASS}
          style={inputStyle}
        />
        <p className="mt-1 text-xs text-gray-500">{copy.summaryHint}</p>
      </div>

      <fieldset className="space-y-5">
        <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 mb-3">Choose a password</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="password" className={label} style={labelStyle}>Password</label>
            <input id="password" type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={(e) => update('password', e.target.value)} className={INPUT_CLASS} style={inputStyle} />
            <p className="mt-1 text-xs text-gray-500">At least 8 characters. You will use it to log in once approved.</p>
          </div>
          <div>
            <label htmlFor="confirmPassword" className={label} style={labelStyle}>Confirm password</label>
            <input id="confirmPassword" type="password" required autoComplete="new-password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} className={INPUT_CLASS} style={inputStyle} />
          </div>
        </div>
      </fieldset>

      {/* Honeypot: hidden from people and screen readers, bots tend to fill it in. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', height: 0, overflow: 'hidden' }}>
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => update('website', e.target.value)} />
      </div>

      <label className="flex items-start gap-3 text-sm text-gray-700">
        <input type="checkbox" required checked={form.agree} onChange={(e) => update('agree', e.target.checked)} className="mt-0.5 h-4 w-4" />
        <span>I confirm the details above are accurate, and I understand an administrator will review my application before my account is created.</span>
      </label>

      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <button
        type="submit"
        disabled={!form.agree || submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60"
        style={{ backgroundColor: accent }}
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? 'Submitting…' : `Submit ${APPLICANT_ROLES[role].label.toLowerCase()} application`}
      </button>
    </form>
  );
}
