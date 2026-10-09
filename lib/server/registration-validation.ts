import { isRegistrationApplicationRole, type RegistrationApplicationRole } from '@/lib/application-roles';
import { isPasswordStrongEnough, MIN_PASSWORD_LENGTH } from '@/lib/server/password';
import type { Validated } from '@/lib/server/lms-validation';

import {
  CONTRACTOR_SERVICES,
  CONTRACTOR_TRADES,
  MIN_EXPERIENCE_LENGTH,
  SAFETY_CERTIFICATION_ANSWERS,
  TEAM_SIZES,
  YEARS_IN_OPERATION,
} from '@/lib/registration-options';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EXPERIENCE_LENGTH = 3000;

export interface RegistrationApplicationInput {
  role: RegistrationApplicationRole;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  region: string;
  organisation: string;
  experienceSummary: string;
  details: Record<string, unknown> | null;
  idDocumentName: string | null;
}

function text(value: unknown, max = 200): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function oneOf<T extends string>(value: unknown, options: readonly T[]): T | null {
  return typeof value === 'string' && (options as readonly string[]).includes(value) ? (value as T) : null;
}

/** Validates a public trainer, lecturer or contractor registration. */
export function validateRegistrationApplication(body: unknown): Validated<RegistrationApplicationInput> {
  const raw = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;

  // Hidden field a person never fills in; bots usually do.
  if (text(raw.website) !== '') return { ok: false, error: 'Could not submit this application.' };

  if (!isRegistrationApplicationRole(raw.role)) return { ok: false, error: 'Choose a valid role to apply for.' };
  const role = raw.role;

  const firstName = text(raw.firstName, 100);
  const lastName = text(raw.lastName, 100);
  if (!firstName) return { ok: false, error: 'First name is required.' };
  if (!lastName) return { ok: false, error: 'Last name is required.' };

  const email = text(raw.email, 254).toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Enter a valid email address.' };

  const password = typeof raw.password === 'string' ? raw.password : '';
  if (!isPasswordStrongEnough(password)) {
    return { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }

  const phone = text(raw.phone, 40);
  if (phone.replace(/\D/g, '').length < 7) return { ok: false, error: 'Enter a valid phone number.' };

  const region = text(raw.region, 100);
  if (!region) return { ok: false, error: 'Choose your province or region.' };

  const organisation = text(raw.organisation, 200);
  if (!organisation) {
    return { ok: false, error: role === 'contractor' ? 'Company name is required.' : 'Your institution or training provider is required.' };
  }

  const experienceSummary = text(raw.experienceSummary, MAX_EXPERIENCE_LENGTH + 1);
  if (experienceSummary.length < MIN_EXPERIENCE_LENGTH) {
    return { ok: false, error: `Tell us a little more about your ${role === 'contractor' ? 'business and work' : 'qualifications and experience'} (at least ${MIN_EXPERIENCE_LENGTH} characters).` };
  }
  if (experienceSummary.length > MAX_EXPERIENCE_LENGTH) {
    return { ok: false, error: `Keep your summary under ${MAX_EXPERIENCE_LENGTH} characters.` };
  }

  let details: Record<string, unknown> | null = null;
  if (role === 'contractor') {
    const rawDetails = (raw.details && typeof raw.details === 'object' ? raw.details : {}) as Record<string, unknown>;
    const tradeSpecialization = oneOf(rawDetails.tradeSpecialization, CONTRACTOR_TRADES);
    const yearsInOperation = oneOf(rawDetails.yearsInOperation, YEARS_IN_OPERATION);
    const teamSize = oneOf(rawDetails.teamSize, TEAM_SIZES);
    const hasSafetyCertification = oneOf(rawDetails.hasSafetyCertification, SAFETY_CERTIFICATION_ANSWERS);
    if (!tradeSpecialization) return { ok: false, error: 'Choose your main trade.' };
    if (!yearsInOperation) return { ok: false, error: 'Choose how long you have been operating.' };
    if (!teamSize) return { ok: false, error: 'Choose your team size.' };
    if (!hasSafetyCertification) return { ok: false, error: 'Say whether you hold a safety certification.' };
    const servicesOffered = Array.isArray(rawDetails.servicesOffered)
      ? rawDetails.servicesOffered.filter((service): service is (typeof CONTRACTOR_SERVICES)[number] => oneOf(service, CONTRACTOR_SERVICES) !== null)
      : [];
    details = { tradeSpecialization, yearsInOperation, teamSize, hasSafetyCertification, servicesOffered };
  }

  const idDocumentName = text(raw.idDocumentName, 200) || null;

  return {
    ok: true,
    value: { role, firstName, lastName, email, password, phone, region, organisation, experienceSummary, details, idDocumentName },
  };
}
