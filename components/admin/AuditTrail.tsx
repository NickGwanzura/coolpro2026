'use client';

import { History } from 'lucide-react';
import { useAuditLog } from '@/lib/api';

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

function actionLabel(action: string) {
  return action.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

export function AuditTrail({ entityType, entityId }: { entityType: 'technician_application' | 'membership'; entityId: string }) {
  const { data, isLoading } = useAuditLog({ entityType, entityId });
  const events = data ?? [];

  if (isLoading) {
    return <div className="p-6 text-sm text-gray-500">Loading audit trail…</div>;
  }

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
        <History className="mx-auto mb-2 h-6 w-6 text-gray-300" />
        No audit events recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event.id} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-gray-900">{actionLabel(event.action)}</span>
            <span className="text-xs text-gray-400">{formatDate(event.createdAt)}</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            By {event.performedBy}
            {event.performedByRole ? ` (${event.performedByRole.replace('_', ' ')})` : ''}
            {event.previousStatus && event.newStatus ? ` · ${event.previousStatus} → ${event.newStatus}` : ''}
          </p>
          {event.notes && <p className="mt-2 text-xs text-gray-600">{event.notes}</p>}
        </div>
      ))}
    </div>
  );
}
