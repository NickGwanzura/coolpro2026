'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Loader2, FlaskConical, ChevronDown } from 'lucide-react';
import { searchRefrigerantsOnce } from '@/lib/api';
import type { Refrigerant } from '@/types/index';

const SAFETY_BADGE_STYLES: Record<string, string> = {
  A1: 'bg-slate-100 text-slate-600',
  A2: 'bg-orange-100 text-orange-700',
  A2L: 'bg-orange-100 text-orange-700',
  A3: 'bg-red-100 text-red-700',
  B1: 'bg-amber-100 text-amber-700',
  B2: 'bg-red-100 text-red-700',
  B2L: 'bg-red-100 text-red-700',
  B3: 'bg-red-200 text-red-800',
};

function safetyBadgeClass(code: string | null): string {
  if (!code) return 'bg-gray-100 text-gray-500';
  return SAFETY_BADGE_STYLES[code] ?? 'bg-gray-100 text-gray-500';
}

export function refrigerantLabel(r: Refrigerant): string {
  return r.ashraeCode || r.odsName || r.formulaList[0] || `#${r.id}`;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export interface RefrigerantAutocompleteProps {
  value?: Refrigerant | null;
  onSelect: (refrigerant: Refrigerant | null) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  accentColor?: string;
  /** Search endpoint — defaults to the authenticated catalogue; pass '/api/public/refrigerants'
   * for unauthenticated pages (e.g. supplier signup) since /api/refrigerants requires a session. */
  apiPath?: string;
}

export function RefrigerantAutocomplete({
  value,
  onSelect,
  placeholder = 'Search refrigerant — name, ASHRAE code, formula, CAS, trade name…',
  required,
  disabled,
  className = '',
  accentColor = '#D97706',
  apiPath = '/api/refrigerants',
}: RefrigerantAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Refrigerant[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebouncedValue(query, 250);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(() => {
      if (cancelled) return;

      if (!open || debouncedQuery.trim().length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);
      searchRefrigerantsOnce({ q: debouncedQuery.trim(), pageSize: 20 }, apiPath)
        .then((res) => {
          if (!cancelled) {
            setResults(res.data);
            setHighlighted(0);
          }
        })
        .catch(() => {
          if (!cancelled) setError('Search failed. Try again.');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [debouncedQuery, open, apiPath]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Refrigerant[]>();
    for (const r of results) {
      const key = r.chemicalType || 'Other';
      const list = groups.get(key) ?? [];
      list.push(r);
      groups.set(key, list);
    }
    return Array.from(groups.entries());
  }, [results]);

  const flatResults = results;

  const handleSelect = (r: Refrigerant) => {
    onSelect(r);
    setQuery('');
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlighted((h) => Math.min(h + 1, flatResults.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const picked = flatResults[highlighted];
      if (picked) handleSelect(picked);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {value ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) setOpen(true);
          }}
          className="flex w-full items-center justify-between gap-2 border border-gray-200 bg-white px-3 py-2.5 text-left text-sm outline-none transition focus:border-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex min-w-0 items-center gap-2">
            <FlaskConical className="h-4 w-4 shrink-0" style={{ color: accentColor }} />
            <span className="truncate font-semibold text-gray-900">{refrigerantLabel(value)}</span>
            {value.ashraeSafetyGroup && (
              <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-bold ${safetyBadgeClass(value.ashraeSafetyGroup)}`}>
                {value.ashraeSafetyGroup}
              </span>
            )}
            <span className="truncate text-xs text-gray-500">{value.odsName}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
        </button>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls="refrigerant-autocomplete-listbox"
            aria-autocomplete="list"
            value={query}
            required={required}
            disabled={disabled}
            placeholder={placeholder}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            className="w-full border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
      )}

      {open && !value && (
        <div
          id="refrigerant-autocomplete-listbox"
          role="listbox"
          className="absolute z-30 mt-1 max-h-80 w-full overflow-y-auto border border-gray-200 bg-white shadow-lg"
        >
          {loading && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </div>
          )}
          {!loading && error && <div className="px-4 py-3 text-sm text-red-600">{error}</div>}
          {!loading && !error && debouncedQuery.trim().length < 2 && (
            <div className="px-4 py-3 text-sm text-gray-400">Type at least 2 characters to search.</div>
          )}
          {!loading && !error && debouncedQuery.trim().length >= 2 && flatResults.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-400">No refrigerants matched &ldquo;{debouncedQuery}&rdquo;.</div>
          )}
          {!loading &&
            grouped.map(([group, items]) => (
              <div key={group}>
                <p className="sticky top-0 bg-gray-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                  {group}
                </p>
                {items.map((r) => {
                  const globalIndex = flatResults.indexOf(r);
                  const isHighlighted = globalIndex === highlighted;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      role="option"
                      aria-selected={isHighlighted}
                      onMouseEnter={() => setHighlighted(globalIndex)}
                      onClick={() => handleSelect(r)}
                      className={`flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                        isHighlighted ? 'bg-amber-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accentColor }} />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-sm text-gray-900">{refrigerantLabel(r)}</span>
                          {r.ashraeSafetyGroup && (
                            <span className={`px-1.5 py-0.5 text-[10px] font-bold ${safetyBadgeClass(r.ashraeSafetyGroup)}`}>
                              {r.ashraeSafetyGroup}
                            </span>
                          )}
                          {r.isHFC && <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700">HFC</span>}
                          {r.isHCFC && <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-purple-50 text-purple-700">HCFC</span>}
                          {r.isCFC && <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-50 text-rose-700">CFC</span>}
                        </span>
                        <span className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-gray-500">
                          {r.odsName && <span>{r.odsName}</span>}
                          {r.formulaList[0] && <span>· {r.formulaList[0]}</span>}
                          {r.commonTradeNameList[0] && <span>· {r.commonTradeNameList[0]}</span>}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
