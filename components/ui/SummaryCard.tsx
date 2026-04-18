import { ComponentType, SVGProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  label: string;
  value: string | number;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  iconBg?: string;
  iconColor?: string;
  trend?: ReactNode;
  className?: string;
}

export function SummaryCard({
  label,
  value,
  icon: Icon,
  iconBg = 'bg-gray-100',
  iconColor = 'text-gray-500',
  trend,
  className,
}: SummaryCardProps) {
  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4', className)}>
      {Icon && (
        <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
          <Icon className={cn('h-5 w-5', iconColor)} aria-hidden="true" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm text-gray-500 font-medium truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {trend && <div className="mt-1 text-xs">{trend}</div>}
      </div>
    </div>
  );
}
