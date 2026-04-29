'use client';

import { useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ClockAlert,
  GraduationCap,
  Mail,
  Phone,
  ShieldCheck,
  Wrench,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import {
  approveStudentApplication,
  approveSupplierApplication,
  approveTechnicianApplication,
  rejectStudentApplication,
  rejectSupplierApplication,
  rejectTechnicianApplication,
  useStudentApplications,
  useSupplierApplications,
  useTechnicianApplications,
} from '@/lib/api';
import type {
  ApplicationStatus,
  StudentApplication,
  TechnicianApplication,
} from '@/types/index';
import type { SupplierApplicationRecord } from '@/lib/api';

type Lane = 'students' | 'technicians' | 'suppliers';

const LANE_META: Record<Lane, { label: string; icon: React.ComponentType<{ className?: string }>; accent: string }> = {
  students: { label: 'Students', icon: GraduationCap, accent: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  technicians: { label: 'Technicians', icon: Wrench, accent: 'text-blue-700 bg-blue-50 border-blue-200' },
  suppliers: { label: 'Suppliers', icon: Building2, accent: 'text-amber-700 bg-amber-50 border-amber-200' },
};

const STATUS_BADGE: Record<ApplicationStatus, string> = {
  submitted: 'bg-amber-50 text-amber-800 border-amber-200',
  'under-review': 'bg-blue-50 text-blue-800 border-blue-200',
  approved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  rejected: 'bg-rose-50 text-rose-800 border-rose-200',
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${STATUS_BADGE[status]}`}
    >
      {status.replace('-', ' ')}
    </span>
  );
}

function RejectModal({
  title,
  onConfirm,
  onCancel,
}: {
  title: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md border border-gray-200 bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-gray-900">Reject: {title}</h3>
        <p className="mt-2 text-sm text-gray-500">Provide a reason. The applicant will see this note.</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="Rejection reason..."
          className="mt-4 w-full border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className="bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
          >
            Confirm rejection
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationsAdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [active, setActive] = useState<Lane>('students');
  const [acting, setActing] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{
    lane: Lane;
    id: string;
    title: string;
  } | null>(null);

  const studentsResp = useStudentApplications();
  const techsResp = useTechnicianApplications();
  const suppliersResp = useSupplierApplications();

  const counts = useMemo(
    () => ({
      students: (studentsResp.data ?? []).filter((a) => a.status === 'submitted').length,
      technicians: (techsResp.data ?? []).filter((a) => a.status === 'submitted').length,
      suppliers: (suppliersResp.data ?? []).filter((a) => a.status === 'submitted').length,
    }),
    [studentsResp.data, techsResp.data, suppliersResp.data],
  );

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || (user.role !== 'org_admin' && user.role !== 'regulator')) {
    return (
      <div className="border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        Access restricted. This page is for HEVACRAZ admins (org_admin) and NOU regulators only.
      </div>
    );
  }

  const handleApprove = async (lane: Lane, id: string) => {
    setActing(true);
    try {
      if (lane === 'students') await approveStudentApplication(id);
      else if (lane === 'technicians') await approveTechnicianApplication(id);
      else await approveSupplierApplication(id);
    } finally {
      setActing(false);
    }
  };

  const handleRejectConfirm = async (notes: string) => {
    if (!rejectTarget) return;
    setActing(true);
    try {
      if (rejectTarget.lane === 'students') await rejectStudentApplication(rejectTarget.id, notes);
      else if (rejectTarget.lane === 'technicians')
        await rejectTechnicianApplication(rejectTarget.id, notes);
      else await rejectSupplierApplication(rejectTarget.id, notes);
    } finally {
      setRejectTarget(null);
      setActing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
          {user.role === 'org_admin' ? 'HEVACRAZ admin' : 'NOU regulator'}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Registration Applications</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
          Review and approve incoming registration applications across students, technicians, and
          suppliers. Approved technicians are inserted directly into the public registry.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(Object.keys(LANE_META) as Lane[]).map((lane) => {
          const meta = LANE_META[lane];
          const Icon = meta.icon;
          const isActive = active === lane;
          return (
            <button
              key={lane}
              type="button"
              onClick={() => setActive(lane)}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                isActive
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {meta.label}
              <span
                className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                  counts[lane] > 0 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {counts[lane]}
              </span>
            </button>
          );
        })}
      </div>

      {active === 'students' && (
        <LaneSection
          loading={studentsResp.data === undefined}
          error={studentsResp.error}
          empty="No student applications yet."
        >
          {(studentsResp.data ?? []).map((app) => (
            <StudentRow
              key={app.id}
              app={app}
              acting={acting}
              onApprove={() => handleApprove('students', app.id)}
              onReject={() =>
                setRejectTarget({
                  lane: 'students',
                  id: app.id,
                  title: `${app.firstName} ${app.lastName}`,
                })
              }
            />
          ))}
        </LaneSection>
      )}

      {active === 'technicians' && (
        <LaneSection
          loading={techsResp.data === undefined}
          error={techsResp.error}
          empty="No technician applications yet."
        >
          {(techsResp.data ?? []).map((app) => (
            <TechnicianRow
              key={app.id}
              app={app}
              acting={acting}
              onApprove={() => handleApprove('technicians', app.id)}
              onReject={() =>
                setRejectTarget({ lane: 'technicians', id: app.id, title: app.name })
              }
            />
          ))}
        </LaneSection>
      )}

      {active === 'suppliers' && (
        <LaneSection
          loading={suppliersResp.data === undefined}
          error={suppliersResp.error}
          empty="No supplier applications yet."
        >
          {(suppliersResp.data ?? []).map((app) => (
            <SupplierRow
              key={app.id}
              app={app}
              acting={acting}
              onApprove={() => handleApprove('suppliers', app.id)}
              onReject={() =>
                setRejectTarget({ lane: 'suppliers', id: app.id, title: app.companyName })
              }
            />
          ))}
        </LaneSection>
      )}

      {rejectTarget && (
        <RejectModal
          title={rejectTarget.title}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
}

function LaneSection({
  loading,
  error,
  empty,
  children,
}: {
  loading: boolean;
  error: unknown;
  empty: string;
  children: React.ReactNode;
}) {
  if (loading) {
    return <div className="p-8 text-sm text-gray-500">Loading...</div>;
  }
  if (error) {
    const message = error instanceof Error ? error.message : 'Failed to load.';
    return (
      <div className="border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        {message}
      </div>
    );
  }
  const arr = (children as React.ReactNode[]) ?? [];
  if (Array.isArray(arr) && arr.length === 0) {
    return (
      <div className="border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
        {empty}
      </div>
    );
  }
  return <div className="space-y-4">{children}</div>;
}

function ActionRow({
  status,
  acting,
  onApprove,
  onReject,
}: {
  status: ApplicationStatus;
  acting: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  if (status !== 'submitted' && status !== 'under-review') return null;
  return (
    <div className="flex flex-wrap gap-2 shrink-0">
      <button
        type="button"
        onClick={onApprove}
        disabled={acting}
        className="inline-flex items-center gap-1.5 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
      >
        <CheckCircle2 className="h-4 w-4" />
        Approve
      </button>
      <button
        type="button"
        onClick={onReject}
        disabled={acting}
        className="inline-flex items-center gap-1.5 border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
      >
        <XCircle className="h-4 w-4" />
        Reject
      </button>
    </div>
  );
}

function MetaLine({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

function StudentRow({
  app,
  acting,
  onApprove,
  onReject,
}: {
  app: StudentApplication;
  acting: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-gray-900">
              {app.firstName} {app.lastName}
            </span>
            <StatusBadge status={app.status} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <MetaLine icon={Mail}>{app.email}</MetaLine>
            <MetaLine icon={Phone}>{app.phone}</MetaLine>
            <MetaLine icon={GraduationCap}>
              {app.polytech} • {app.fieldOfStudy}
            </MetaLine>
          </div>
          <p className="text-xs text-gray-500">
            Student ID {app.studentIdNumber} • Enrolment year {app.enrolmentYear}
            {app.idDocumentName ? ` • ${app.idDocumentName}` : ''}
          </p>
          <p className="text-[11px] text-gray-400">Submitted {formatDate(app.submittedAt)}</p>
          {app.reviewNote && app.status === 'rejected' && (
            <div className="mt-1 border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              <span className="font-semibold">Reason:</span> {app.reviewNote}
            </div>
          )}
        </div>
        <ActionRow status={app.status} acting={acting} onApprove={onApprove} onReject={onReject} />
      </div>
    </div>
  );
}

function TechnicianRow({
  app,
  acting,
  onApprove,
  onReject,
}: {
  app: TechnicianApplication;
  acting: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-gray-900">{app.name}</span>
            <span className="text-xs font-semibold text-blue-700">{app.specialization}</span>
            <StatusBadge status={app.status} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <MetaLine icon={Mail}>{app.email}</MetaLine>
            <MetaLine icon={Phone}>{app.contactNumber}</MetaLine>
            <MetaLine icon={ShieldCheck}>{app.registrationNumber}</MetaLine>
          </div>
          <p className="text-xs text-gray-500">
            {app.province} • {app.district} • {app.employmentStatus}
            {app.employer ? ` @ ${app.employer}` : ''} • {app.yearsExperience} yrs
          </p>
          {app.refrigerantsHandled.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {app.refrigerantsHandled.map((r) => (
                <span
                  key={r}
                  className="inline-flex rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-700"
                >
                  {r}
                </span>
              ))}
            </div>
          )}
          {app.certifications.length > 0 && (
            <p className="text-[11px] text-gray-500">
              {app.certifications.length} certification{app.certifications.length !== 1 ? 's' : ''}{' '}
              attached
            </p>
          )}
          <p className="text-[11px] text-gray-400">Submitted {formatDate(app.submittedAt)}</p>
          {app.reviewNote && app.status === 'rejected' && (
            <div className="mt-1 border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              <span className="font-semibold">Reason:</span> {app.reviewNote}
            </div>
          )}
        </div>
        <ActionRow status={app.status} acting={acting} onApprove={onApprove} onReject={onReject} />
      </div>
    </div>
  );
}

function SupplierRow({
  app,
  acting,
  onApprove,
  onReject,
}: {
  app: SupplierApplicationRecord;
  acting: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-gray-900">{app.companyName}</span>
            <span className="text-xs font-semibold text-amber-700">{app.supplierType}</span>
            <StatusBadge status={app.status} />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <MetaLine icon={Mail}>{app.email}</MetaLine>
            <MetaLine icon={Phone}>{app.phone}</MetaLine>
            <MetaLine icon={ClockAlert}>{app.registrationNumber}</MetaLine>
          </div>
          <p className="text-xs text-gray-500">
            {app.province} • {app.city} • Contact: {app.contactName}
          </p>
          {app.refrigerantsSupplied.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {app.refrigerantsSupplied.map((r) => (
                <span
                  key={r}
                  className="inline-flex rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-700"
                >
                  {r}
                </span>
              ))}
            </div>
          )}
          <p className="text-[11px] text-gray-400">Submitted {formatDate(app.submittedAt)}</p>
          {app.reviewNote && app.status === 'rejected' && (
            <div className="mt-1 border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              <span className="font-semibold">Reason:</span> {app.reviewNote}
            </div>
          )}
        </div>
        <ActionRow status={app.status} acting={acting} onApprove={onApprove} onReject={onReject} />
      </div>
    </div>
  );
}
