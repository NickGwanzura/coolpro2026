import type { Validated } from '@/lib/server/lms-validation';

export const REORDER_TYPES = ['purchase', 'recovery'] as const;
export type ReorderType = (typeof REORDER_TYPES)[number];

export const MAX_REORDER_KG = 100_000;

export interface ReorderInput {
  gasType: string;
  quantityKg: number;
  purpose: string;
  reorderType: ReorderType;
  supplierNotes: string;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Checks a supplier's reorder request before it is saved. */
export function validateReorder(body: unknown): Validated<ReorderInput> {
  const raw = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;

  const gasType = text(raw.gasType);
  if (!gasType) return { ok: false, error: 'Choose a refrigerant.' };
  if (gasType.length > 100) return { ok: false, error: 'The refrigerant name is too long.' };

  const quantity = typeof raw.quantityKg === 'number' ? raw.quantityKg : typeof raw.quantityKg === 'string' && raw.quantityKg.trim() ? Number(raw.quantityKg) : Number.NaN;
  if (!Number.isFinite(quantity) || quantity <= 0) return { ok: false, error: 'Enter a quantity greater than zero.' };
  if (quantity > MAX_REORDER_KG) return { ok: false, error: `A single reorder cannot exceed ${MAX_REORDER_KG.toLocaleString()} kg.` };

  const purpose = text(raw.purpose);
  if (!purpose) return { ok: false, error: 'Provide a purpose for this reorder.' };
  if (purpose.length > 500) return { ok: false, error: 'The purpose must be 500 characters or fewer.' };

  const supplierNotes = text(raw.supplierNotes);
  if (supplierNotes.length > 2000) return { ok: false, error: 'Notes must be 2000 characters or fewer.' };

  const reorderType = raw.reorderType === undefined || raw.reorderType === '' ? 'purchase' : raw.reorderType;
  if (!(REORDER_TYPES as readonly unknown[]).includes(reorderType)) {
    return { ok: false, error: 'Choose whether this is a purchase or a recovery return.' };
  }

  return { ok: true, value: { gasType, quantityKg: Math.round(quantity * 1000) / 1000, purpose, reorderType: reorderType as ReorderType, supplierNotes } };
}
