/**
 * Single source of truth for whether public self-service registration is open.
 * Flip these to close or re-open a signup path; every gated page and API route reads from here,
 * so there is nowhere else to update. Administrators can never self-register: there is no flag
 * for them and no public route that creates one.
 *
 * Every open path still needs an admin to approve the application before an account exists.
 */
export const SELF_SIGNUP_OPEN = {
  technician: true,
  student: true,
  supplier: true,
  trainer: true,
  lecturer: true,
  contractor: true,
} as const;

export type SelfSignupKind = keyof typeof SELF_SIGNUP_OPEN;
