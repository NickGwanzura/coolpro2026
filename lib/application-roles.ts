// Role wording shared by the join pages, the admin review screen and the application emails.
// No server imports, so client components can use it.

export type ApplicantRole = 'student' | 'technician' | 'trainer' | 'lecturer' | 'contractor' | 'supplier';

export interface ApplicantRoleInfo {
  label: string;
  /** "a student", "an assessor" ... for sentences. */
  withArticle: string;
  /** What the reviewer is checking, in plain words. */
  reviewFocus: string;
  /** Rough review time shown to the applicant. */
  reviewTime: string;
  /** What the person can do once approved, shown in the approval email. */
  afterApproval: string[];
}

export const APPLICANT_ROLES: Record<ApplicantRole, ApplicantRoleInfo> = {
  student: {
    label: 'Student',
    withArticle: 'a student',
    reviewFocus: 'your enrolment details',
    reviewTime: 'about 2 working days',
    afterApproval: [
      'Browse approved courses in the Learning Hub and enrol',
      'Download course materials and sit course exams',
      'Look up refrigerants and safety guidance',
    ],
  },
  technician: {
    label: 'Technician',
    withArticle: 'a technician',
    reviewFocus: 'your credentials and experience',
    reviewTime: 'about 5 working days',
    afterApproval: [
      'Appear in the national technician registry with a verifiable credential',
      'Plan jobs, log refrigerant use and request Certificates of Compliance',
      'Take courses and track your certifications and renewals',
    ],
  },
  trainer: {
    label: 'Trainer / Assessor',
    withArticle: 'a trainer or assessor',
    reviewFocus: 'your training and assessment qualifications',
    reviewTime: 'about 5 working days',
    afterApproval: [
      'Create courses and submit them for approval',
      'Grade learner exams and put technicians forward for certificates',
      'Schedule training sessions',
    ],
  },
  lecturer: {
    label: 'Lecturer',
    withArticle: 'a lecturer',
    reviewFocus: 'your institution and teaching background',
    reviewTime: 'about 5 working days',
    afterApproval: [
      'Create courses and submit them for approval',
      'Grade learner exams and put technicians forward for certificates',
      'Schedule training sessions',
    ],
  },
  contractor: {
    label: 'Contractor',
    withArticle: 'a contractor',
    reviewFocus: 'your business and trade details',
    reviewTime: 'about 5 working days',
    afterApproval: [
      'Plan jobs, log installations and refrigerant use',
      'Request Certificates of Compliance for completed work',
      'Verify technician certificates before you hire',
    ],
  },
  supplier: {
    label: 'Supplier',
    withArticle: 'a supplier',
    reviewFocus: 'your company, licence and refrigerant details',
    reviewTime: 'up to 10 working days (HEVACRAZ and NOU both review)',
    afterApproval: [
      'Verify buyers before a sale',
      'Submit refrigerant reorders for two-step approval',
      'Submit compliance certificates and supply reports',
    ],
  },
};

export function isApplicantRole(value: unknown): value is ApplicantRole {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(APPLICANT_ROLES, value);
}

/** Roles whose applications live in the generic `registration_applications` table. */
export const REGISTRATION_APPLICATION_ROLES = ['trainer', 'lecturer', 'contractor'] as const;
export type RegistrationApplicationRole = (typeof REGISTRATION_APPLICATION_ROLES)[number];

export function isRegistrationApplicationRole(value: unknown): value is RegistrationApplicationRole {
  return typeof value === 'string' && (REGISTRATION_APPLICATION_ROLES as readonly string[]).includes(value);
}

/** Maps what a role is called on an application to the role stored on the user account. */
export function accountRoleFor(role: ApplicantRole): 'student' | 'technician' | 'trainer' | 'lecturer' | 'contractor' | 'vendor' {
  return role === 'supplier' ? 'vendor' : role;
}
