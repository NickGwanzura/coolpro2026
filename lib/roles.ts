
// Fixed: Changed import path to types/index to use the union type for UserRole compatible with these definitions.
import { UserRole } from '../types/index';

export const ROLES: Record<string, UserRole> = {
  TECHNICIAN: 'technician',
  TRAINER: 'trainer',
  VENDOR: 'vendor',
  ORG_ADMIN: 'org_admin',
  PROGRAM_ADMIN: 'program_admin',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  technician: 'Technician',
  trainer: 'Trainer/Assessor',
  vendor: 'Vendor/Supplier',
  org_admin: 'Organization Admin',
  program_admin: 'National Admin',
  regulator: 'Regulator/Verifier',
};