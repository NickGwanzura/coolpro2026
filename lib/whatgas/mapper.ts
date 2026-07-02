import type { refrigerants } from '@/db/schema/index';
import type { WhatGasListItem, WhatGasDetail } from './validators';

type RefrigerantInsert = typeof refrigerants.$inferInsert;

function arr(value: string[] | null | undefined): string[] {
  return value ?? [];
}

function buildSearchText(item: WhatGasListItem): string {
  const parts = [
    item.ODSName,
    item.AshraeCode,
    item.CASCode,
    item.ChemicalType,
    ...arr(item.FormulaList),
    ...arr(item.AlternativeFormulaList),
    ...arr(item.ChemicalNameList),
    ...arr(item.AlternativeChemicalNameList),
    ...arr(item.CommonTradeNameList),
  ];
  return parts
    .filter((p): p is string => typeof p === 'string' && p.length > 0)
    .join(' ')
    .toLowerCase();
}

function parseLastUpdateDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  // WhatGas serializes dates as ASP.NET-style "/Date(1653155375077+0200)/"
  const match = /\/Date\((-?\d+)/.exec(value);
  if (match) return new Date(Number(match[1]));
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Maps a validated list-endpoint item to a Drizzle insert row (no detail-only fields yet). */
export function mapListItemToRow(item: WhatGasListItem): RefrigerantInsert {
  return {
    id: item.Id,
    odsName: item.ODSName ?? null,
    ashraeCode: item.AshraeCode ?? null,
    ashraeTypeId: item.AshraeTypeId ?? null,
    chemicalType: item.ChemicalType ?? null,
    casCode: item.CASCode ?? null,
    formulaList: arr(item.FormulaList),
    alternativeFormulaList: arr(item.AlternativeFormulaList),
    chemicalNameList: arr(item.ChemicalNameList),
    alternativeChemicalNameList: arr(item.AlternativeChemicalNameList),
    commonTradeNameList: arr(item.CommonTradeNameList),
    realApplications: arr(item.RealApplications),
    dangerSymbol: item.DangerSymbol ?? [],
    gwp: item.GWP ?? null,
    gwpSource: item.GWPSource ?? null,
    gwpNote: item.GWPNote ?? null,
    odp: item.ODP ?? null,
    odpSource: item.ODPSource ?? null,
    odpNote: item.ODPNote ?? null,
    mpValue: item.MPValue ?? null,
    mpSource: item.MPSource ?? null,
    mpNote: item.MPNote ?? null,
    kigaliGwpValue: item.KigaliGWPValue ?? null,
    kigaliGwpSource: item.KigaliGWPSource ?? null,
    hsCode: item.HSCode ?? null,
    hsCode2017: item.HSCode2017 ?? null,
    hsCode2022: item.HSCode2022 ?? null,
    unCode: item.UNCode ?? null,
    isHFC: item.IsHFC ?? false,
    isHCFC: item.IsHCFC ?? false,
    isCFC: item.IsCFC ?? false,
    isODP: item.IsODP ?? false,
    isGWP: item.IsGWP ?? false,
    isSingle: item.IsSingle ?? false,
    hasIcon: item.HasIcon ?? false,
    searchText: buildSearchText(item),
    raw: item as unknown as Record<string, unknown>,
  };
}

/** Merges detail-endpoint-only fields onto a base row (used when hydrating a single record). */
export function mapDetailToRow(detail: WhatGasDetail): RefrigerantInsert {
  const base = mapListItemToRow(detail);
  const ashraeSafetyGroup =
    typeof detail.AshraeSafetyGroup === 'string'
      ? detail.AshraeSafetyGroup
      : detail.AshraeSafetyGroup?.Name ?? null;

  return {
    ...base,
    images: detail.Image ?? [],
    ashraeTypeName: detail.AshraeType?.Name ?? null,
    ashraeSafetyGroup,
    flammability: detail.Flammability ?? null,
    toxicity: detail.Toxicity ?? null,
    annexGroupId: detail.AnnexGroupId ?? null,
    annexGroupName: detail.AnnexGroup?.Name ?? null,
    isCtrlMontrealProtocol: detail.IsCtrlMontrealProtocol ?? null,
    lastUpdated: parseLastUpdateDate(detail.LastUpdateDate),
    detailFetchedAt: new Date(),
    raw: detail as unknown as Record<string, unknown>,
  };
}
