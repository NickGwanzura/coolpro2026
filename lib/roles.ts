// Fixed: Changed import path to types/index to use the union type for UserRole compatible with these definitions.
import { UserRole } from '../types/index';
import { userRoleEnum } from '@/db/schema/index';

/** Single source of truth for valid user roles — derived from the DB enum so it can never drift. */
export const VALID_ROLES = userRoleEnum.enumValues;
export type ValidRole = (typeof VALID_ROLES)[number];

export const ROLES: Record<string, UserRole> = {
  TECHNICIAN: 'technician',
  TRAINER: 'trainer',
  VENDOR: 'vendor',
  ORG_ADMIN: 'org_admin',
  LECTURER: 'lecturer',
  STUDENT: 'student',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  technician: 'Technician',
  trainer: 'Trainer/Assessor',
  vendor: 'Vendor/Supplier',
  org_admin: 'Organization Admin',
  lecturer: 'Lecturer',
  student: 'Student',
};
