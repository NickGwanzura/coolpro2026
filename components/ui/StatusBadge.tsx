import { cn } from '@/lib/utils';

type StatusVariant =
  | 'active' | 'inactive' | 'suspended'
  | 'approved' | 'rejected' | 'pending'
  | 'completed' | 'in-progress' | 'scheduled' | 'cancelled'
  | 'compliant' | 'non-compliant' | 'under-review'
  | string;

const VARIANT_STYLES: Record<string, string> = {
  active:        'bg-emerald-50 text-emerald-700 border border-emerald-200',
  inactive:      'bg-gray-100 text-gray-600 border border-gray-200',
  suspended:     'bg-red-50 text-red-700 border border-red-200',
  approved:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
  rejected:      'bg-red-50 text-red-700 border border-red-200',
  pending:       'bg-amber-50 text-amber-700 border border-amber-200',
  completed:     'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'in-progress': 'bg-blue-50 text-blue-700 border border-blue-200',
  scheduled:     'bg-purple-50 text-purple-700 border border-purple-200',
  cancelled:     'bg-gray-100 text-gray-500 border border-gray-200',
  compliant:     'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'non-compliant': 'bg-red-50 text-red-700 border border-red-200',
  'under-review':  'bg-amber-50 text-amber-700 border border-amber-200',
};

const DEFAULT_STYLE = 'bg-gray-100 text-gray-700 border border-gray-200';

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const style = VARIANT_STYLES[status.toLowerCase()] ?? DEFAULT_STYLE;
  const displayLabel = label ?? status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, ' ');

  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', style, className)}>
      {displayLabel}
    </span>
  );
}
