/**
 * HEVACRAZ Brand Color Palette — single source of truth.
 * Use Tailwind classes (hevac-*) in components.
 * Import this only when inline styles are unavoidable.
 */
export const BRAND = {
  primary:    '#2C2420', // Rich charcoal — text, headings
  secondary:  '#D4A574', // Warm terracotta — accents, highlights
  accent:     '#5A7D5A', // Sage green — active states, icons
  highlight:  '#FF6B35', // Electric orange — CTAs, primary buttons
  background: '#FDF8F3', // Warm off-white — page backgrounds
  surface:    '#FFFFFF', // Card/panel backgrounds
} as const;

export type BrandColor = keyof typeof BRAND;
