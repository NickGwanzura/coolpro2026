import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

/** Small-screen friendly, keyboard-accessible disclosure for secondary detail. */
export function Drilldown({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <details className={`group min-w-0 ${className}`}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 break-words">{label}</span>
        <ChevronRight className="h-4 w-4 shrink-0 text-gray-500 transition-transform group-open:rotate-90" aria-hidden="true" />
      </summary>
      <div className="break-words px-3 pb-3 pt-2 text-sm leading-6 text-gray-600 [overflow-wrap:anywhere]">
        {children}
      </div>
    </details>
  );
}
