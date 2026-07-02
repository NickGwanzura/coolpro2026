import { z } from 'zod';

// The upstream API is inconsistent about which fields are `null` vs omitted vs `[]`, so
// every field beyond `Id` is optional/nullable. We only reject a record if it's missing
// the one field we truly can't operate without (the WhatGas identity).
const nullableString = z.string().nullable().optional();
const nullableStringArray = z.array(z.string()).nullable().optional();
const nullableBoolean = z.boolean().nullable().optional();
const nullableNumber = z.number().nullable().optional();

export const whatgasListItemSchema = z.object({
  Id: z.number(),
  ODSName: nullableString,
  AshraeCode: nullableString,
  AshraeTypeId: nullableNumber,
  ChemicalType: nullableString,
  CASCode: nullableString,
  FormulaList: nullableStringArray,
  AlternativeFormulaList: nullableStringArray,
  ChemicalNameList: nullableStringArray,
  AlternativeChemicalNameList: nullableStringArray,
  CommonTradeNameList: nullableStringArray,
  RealApplications: nullableStringArray,
  DangerSymbol: z.array(z.unknown()).nullable().optional(),
  GWP: nullableString,
  GWPSource: nullableString,
  GWPNote: nullableString,
  ODP: nullableString,
  ODPSource: nullableString,
  ODPNote: nullableString,
  MPValue: nullableString,
  MPSource: nullableString,
  MPNote: nullableString,
  KigaliGWPValue: nullableString,
  KigaliGWPSource: nullableString,
  HSCode: nullableString,
  HSCode2017: nullableString,
  HSCode2022: nullableString,
  UNCode: nullableString,
  IsHFC: nullableBoolean,
  IsHCFC: nullableBoolean,
  IsCFC: nullableBoolean,
  IsODP: nullableBoolean,
  IsGWP: nullableBoolean,
  IsSingle: nullableBoolean,
  HasIcon: nullableBoolean,
}).passthrough();

export const whatgasListResponseSchema = z.array(whatgasListItemSchema);

export const whatgasDetailSchema = whatgasListItemSchema.extend({
  AnnexGroup: z.object({ Name: nullableString }).nullable().optional(),
  AnnexGroupId: nullableNumber,
  AshraeSafetyGroup: z.union([z.string(), z.object({ Name: nullableString })]).nullable().optional(),
  AshraeType: z.object({ Name: nullableString }).nullable().optional(),
  Flammability: nullableString,
  Toxicity: nullableString,
  Image: z.array(z.unknown()).nullable().optional(),
  IsCtrlMontrealProtocol: nullableBoolean,
  LastUpdateDate: nullableString,
}).passthrough();

export type WhatGasListItem = z.infer<typeof whatgasListItemSchema>;
export type WhatGasDetail = z.infer<typeof whatgasDetailSchema>;

export type ValidationFailure = { id: unknown; error: string };

/**
 * Validates every element of the list payload independently — one malformed record
 * never aborts the whole sync. Failures are collected for the sync log, not thrown.
 */
export function validateListPayload(payload: unknown): {
  valid: WhatGasListItem[];
  failures: ValidationFailure[];
} {
  if (!Array.isArray(payload)) {
    return { valid: [], failures: [{ id: null, error: 'Top-level payload is not an array' }] };
  }

  const valid: WhatGasListItem[] = [];
  const failures: ValidationFailure[] = [];

  for (const entry of payload) {
    const result = whatgasListItemSchema.safeParse(entry);
    if (result.success) {
      valid.push(result.data);
    } else {
      const id = typeof entry === 'object' && entry !== null && 'Id' in entry ? (entry as { Id: unknown }).Id : null;
      failures.push({ id, error: result.error.issues.map((i) => i.message).join('; ') });
    }
  }

  return { valid, failures };
}

export function validateDetailPayload(payload: unknown): WhatGasDetail | null {
  const result = whatgasDetailSchema.safeParse(payload);
  return result.success ? result.data : null;
}
