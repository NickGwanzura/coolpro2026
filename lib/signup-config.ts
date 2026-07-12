/**
 * Single source of truth for whether public self-service registration is open.
 * Flip these to re-open a signup path — every gated page and API route reads from here,
 * so there is nowhere else to update.
 */
export const SELF_SIGNUP_OPEN = {
  technician: false,
  student: false,
  supplier: false,
} as const;

export type SelfSignupKind = keyof typeof SELF_SIGNUP_OPEN;
