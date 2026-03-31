'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  FileText,
  Search,
  Send,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { getSession, type UserSession } from '@/lib/auth';
import { MOCK_TECHNICIANS, ZIMBABWE_PROVINCES } from '@/constants/registry';
import { MOCK_TRAINER_CERTIFICATE_REQUESTS } from '@/constants/training';
import { STORAGE_KEYS, writeCollection } from '@/lib/platformStore';
import type { TrainerCertificateRequest } from '@/types/index';

const AVAILABLE_EXAMS = [
  {
    id: 'gwp-basic',
    title: 'Low GWP Refrigerants Safety',
    description: 'Essential safety protocols for handling flammable and high-pressure low GWP refrigerants.',
    duration: '45 mins',
    questions: 20,
    level: 'Basic',
  },
  {
    id: 'co2-advanced',
    title: 'R-744 (CO2) System Specialist',
    description: 'Advanced transcritical and subcritical CO2 system design, installation, and maintenance.',
    duration: '90 mins',
    questions: 45,
    level: 'Advanced',
  },
  {
    id: 'hc-safety',
    title: 'Hydrocarbon Refrigerant Handling',
    description: 'Safe handling and service practices for R-290 and R-600a systems.',
    duration: '60 mins',
    questions: 30,
    level: 'Specialist',
  },
] as const;

type TrainerFormState = {
  technicianId: string;
  courseTitle: string;
  examDate: string;
  theoryScore: string;
  practicalScore: string;
  notes: string;
};

function generateCertificateNumber() {
  return `HEV-${Date.now().toString().slice(-6)}`;
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium' }).format(new Date(value));
}

export default function CertificationsPage() {
  const session = useSyncExternalStore<UserSession | null>(
    () => () => undefined,
    () => getSession(),
    () => null
  );
  const storedRequests = useSyncExternalStore(
    () => () => undefined,
    () => {
      if (typeof window === 'undefined') return MOCK_TRAINER_CERTIFICATE_REQUESTS;
      const raw = window.localStorage.getItem(STORAGE_KEYS.trainerCertificateRequests);
      if (!raw) return MOCK_TRAINER_CERTIFICATE_REQUESTS;

      try {
        return JSON.parse(raw) as TrainerCertificateRequest[];
      } catch {
        return MOCK_TRAINER_CERTIFICATE_REQUESTS;
      }
    },
    () => MOCK_TRAINER_CERTIFICATE_REQUESTS
  );

  const [localRequests, setLocalRequests] = useState<TrainerCertificateRequest[] | null>(null);
  const [examTaking, setExamTaking] = useState<string | null>(null);
  const [completedExams, setCompletedExams] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [notice, setNotice] = useState('');
  const [trainerForm, setTrainerForm] = useState<TrainerFormState>({
    technicianId: MOCK_TECHNICIANS[0]?.id ?? '',
    courseTitle: AVAILABLE_EXAMS[0].title,
    examDate: '2026-04-05',
    theoryScore: '78',
    practicalScore: '84',
    notes: '',
  });

  const requests = localRequests ?? storedRequests;
  const isAdmin = session?.role === 'org_admin' || session?.role === 'program_admin';
  const isTrainer = session?.role === 'trainer';

  const trainerRequests = useMemo(() => {
    if (!session) return [];
    const mine = requests.filter(request => request.trainerEmail === session.email);
    return mine.length > 0 ? mine : requests.filter(request => request.trainerEmail === 'trainer@coolpro.demo');
  }, [requests, session]);

  const filteredAdminRequests = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return requests.filter(request => {
      const matchesSearch =
        !search ||
        request.technicianName.toLowerCase().includes(search) ||
        request.courseTitle.toLowerCase().includes(search) ||
        request.trainerName.toLowerCase().includes(search);

      const technician = MOCK_TECHNICIANS.find(tech => tech.id === request.technicianId);
      const matchesRegion = !selectedRegion || technician?.province === selectedRegion;
      const matchesDate = !dateFilter || request.submittedAt.startsWith(dateFilter) || request.examDate.startsWith(dateFilter);

      return matchesSearch && matchesRegion && matchesDate;
    });
  }, [dateFilter, requests, searchTerm, selectedRegion]);

  const adminSummary = useMemo(() => ({
    submitted: filteredAdminRequests.filter(item => item.status === 'submitted-for-admin-approval').length,
    approved: filteredAdminRequests.filter(item => item.status === 'admin-approved').length,
    issued: filteredAdminRequests.filter(item => item.status === 'issued').length,
    rejected: filteredAdminRequests.filter(item => item.status === 'rejected').length,
  }), [filteredAdminRequests]);

  const trainerSummary = useMemo(() => ({
    submitted: trainerRequests.filter(item => item.status === 'submitted-for-admin-approval').length,
    approved: trainerRequests.filter(item => item.status === 'admin-approved').length,
    issued: trainerRequests.filter(item => item.status === 'issued').length,
  }), [trainerRequests]);

  const saveRequests = (items: TrainerCertificateRequest[]) => {
    setLocalRequests(items);
    writeCollection(STORAGE_KEYS.trainerCertificateRequests, items);
  };

  const updateRequest = (id: string, updater: (request: TrainerCertificateRequest) => TrainerCertificateRequest) => {
    const next = requests.map((request) => (request.id === id ? updater(request) : request));
    saveRequests(next);
  };

  const handleTrainerSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const technician = MOCK_TECHNICIANS.find(item => item.id === trainerForm.technicianId);
    const theoryScore = Number(trainerForm.theoryScore);
    const practicalScore = Number(trainerForm.practicalScore);

    if (!session || !technician || !trainerForm.courseTitle || !trainerForm.examDate) {
      setNotice('Choose a registered technician and complete the marking details first.');
      return;
    }

    if (!Number.isFinite(theoryScore) || !Number.isFinite(practicalScore)) {
      setNotice('Theory and practical scores must be valid numbers.');
      return;
    }

    const overallScore = Math.round((theoryScore + practicalScore) / 2);
    const entry: TrainerCertificateRequest = {
      id: `trainer-cert-${Date.now()}`,
      technicianId: technician.id,
      technicianName: technician.name,
      technicianRegistrationNumber: technician.registrationNumber,
      technicianCompany: technician.employer ?? 'Independent technician',
      trainerName: session.name,
      trainerEmail: session.email,
      courseTitle: trainerForm.courseTitle,
      examDate: trainerForm.examDate,
      theoryScore,
      practicalScore,
      overallScore,
      notes: trainerForm.notes.trim(),
      status: 'submitted-for-admin-approval',
      submittedAt: new Date().toISOString(),
    };

    saveRequests([entry, ...requests]);
    setNotice(`Assessment recorded for ${technician.name} and submitted for admin approval.`);
    setTrainerForm((current) => ({
      ...current,
      theoryScore: '78',
      practicalScore: '84',
      notes: '',
    }));
  };

  const handleStartExam = (id: string) => {
    setExamTaking(id);
    setTimeout(() => {
      setCompletedExams((current) => [...current, id]);
      setExamTaking(null);
      setNotice('Exam completed. A trainer will mark the assessment before it can move to admin approval.');
    }, 1000);
  };

  if (isAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Certification Approvals</h1>
            <p className="mt-1 text-gray-500">
              Review trainer-marked assessments, approve certificate issuance, and manage the national certification queue.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">Admin Approval Gate</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryStat label="Submitted" value={adminSummary.submitted} />
          <SummaryStat label="Approved" value={adminSummary.approved} />
          <SummaryStat label="Issued" value={adminSummary.issued} />
          <SummaryStat label="Rejected" value={adminSummary.rejected} />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search technician, course, or trainer"
                  className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Region</label>
              <select
                value={selectedRegion}
                onChange={(event) => setSelectedRegion(event.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Regions</option>
                {ZIMBABWE_PROVINCES.map((province) => (
                  <option key={province.id} value={province.name}>{province.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Month</label>
              <input
                type="month"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredAdminRequests.map((request) => (
            <div key={request.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{request.technicianName}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {request.technicianRegistrationNumber} · {request.technicianCompany}
                  </p>
                  <p className="mt-2 text-sm text-gray-700">{request.courseTitle}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Trainer: {request.trainerName} · Submitted {formatDate(request.submittedAt)}
                  </p>
                </div>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                  {request.status.replace(/-/g, ' ')}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <ScoreCard label="Theory" value={`${request.theoryScore}%`} />
                <ScoreCard label="Practical" value={`${request.practicalScore}%`} />
                <ScoreCard label="Overall" value={`${request.overallScore}%`} />
                <ScoreCard label="Exam Date" value={request.examDate} />
              </div>

              {request.notes && (
                <p className="mt-4 text-sm text-gray-600">{request.notes}</p>
              )}

              {request.status === 'submitted-for-admin-approval' && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() =>
                      updateRequest(request.id, (item) => ({
                        ...item,
                        status: 'admin-approved',
                        reviewedAt: new Date().toISOString(),
                        adminReviewer: session?.name ?? 'Admin',
                      }))
                    }
                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Approve for Issuance
                  </button>
                  <button
                    onClick={() =>
                      updateRequest(request.id, (item) => ({
                        ...item,
                        status: 'rejected',
                        reviewedAt: new Date().toISOString(),
                        adminReviewer: session?.name ?? 'Admin',
                      }))
                    }
                    className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isTrainer && session) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trainer Certification Desk</h1>
            <p className="mt-1 text-gray-500">
              Mark registered technicians, submit certificate requests for admin approval, and issue certificates once approved.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2">
            <UserCheck className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">Trainer Marking View</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryStat label="Awaiting Admin" value={trainerSummary.submitted} />
          <SummaryStat label="Approved to Issue" value={trainerSummary.approved} />
          <SummaryStat label="Issued" value={trainerSummary.issued} />
        </div>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <form onSubmit={handleTrainerSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Mark Exam and Submit Certificate Request</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Choose a registered technician, record their theory and practical marks, then send the certificate request to admin for approval.
            </p>

            <div className="mt-5 grid gap-4">
              <select
                value={trainerForm.technicianId}
                onChange={(event) => setTrainerForm((current) => ({ ...current, technicianId: event.target.value }))}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MOCK_TECHNICIANS.map((technician) => (
                  <option key={technician.id} value={technician.id}>
                    {technician.name} · {technician.registrationNumber} · {technician.employer ?? 'Independent'}
                  </option>
                ))}
              </select>

              <select
                value={trainerForm.courseTitle}
                onChange={(event) => setTrainerForm((current) => ({ ...current, courseTitle: event.target.value }))}
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              >
                {AVAILABLE_EXAMS.map((exam) => (
                  <option key={exam.id} value={exam.title}>{exam.title}</option>
                ))}
              </select>

              <div className="grid gap-4 sm:grid-cols-3">
                <input
                  type="date"
                  value={trainerForm.examDate}
                  onChange={(event) => setTrainerForm((current) => ({ ...current, examDate: event.target.value }))}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={trainerForm.theoryScore}
                  onChange={(event) => setTrainerForm((current) => ({ ...current, theoryScore: event.target.value }))}
                  placeholder="Theory %"
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={trainerForm.practicalScore}
                  onChange={(event) => setTrainerForm((current) => ({ ...current, practicalScore: event.target.value }))}
                  placeholder="Practical %"
                  className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <textarea
                rows={4}
                value={trainerForm.notes}
                onChange={(event) => setTrainerForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Trainer notes and practical observations"
                className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#FF6B35] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Send className="h-4 w-4" />
              Submit for Admin Approval
            </button>

            {notice && (
              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                {notice}
              </div>
            )}
          </form>

          <div className="space-y-4">
            {trainerRequests.map((request) => (
              <div key={request.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{request.technicianName}</p>
                    <p className="mt-1 text-sm text-gray-500">{request.courseTitle}</p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                    {request.status.replace(/-/g, ' ')}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <ScoreCard label="Theory" value={`${request.theoryScore}%`} />
                  <ScoreCard label="Practical" value={`${request.practicalScore}%`} />
                  <ScoreCard label="Overall" value={`${request.overallScore}%`} />
                </div>
                {request.certificateNumber && (
                  <p className="mt-4 text-sm font-semibold text-emerald-700">
                    Certificate issued: {request.certificateNumber}
                  </p>
                )}
                {request.status === 'admin-approved' && (
                  <button
                    onClick={() =>
                      updateRequest(request.id, (item) => ({
                        ...item,
                        status: 'issued',
                        certificateNumber: item.certificateNumber ?? generateCertificateNumber(),
                      }))
                    }
                    className="mt-4 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Issue Certificate
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">National Certification Center</h1>
          <p className="text-gray-500 mt-1">Take professional assessments and move into trainer review</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-semibold text-blue-700">Accredited by SA-RACA</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            Available Assessments
          </h2>
          <div className="grid gap-4">
            {AVAILABLE_EXAMS.map((exam) => (
              <div key={exam.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:border-blue-300 transition-all group">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        exam.level === 'Advanced'
                          ? 'bg-purple-100 text-purple-700'
                          : exam.level === 'Specialist'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}>
                        {exam.level}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{exam.title}</h3>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">{exam.description}</p>
                    <div className="flex items-center gap-4 pt-2 text-xs text-gray-400 font-medium">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {exam.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        {exam.questions} Questions
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {completedExams.includes(exam.id) ? (
                      <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl font-bold text-sm">
                        <CheckCircle className="h-4 w-4" />
                        Awaiting Trainer Marking
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartExam(exam.id)}
                        disabled={examTaking !== null}
                        className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-600 transition-all disabled:opacity-50"
                      >
                        Start Exam
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            My Achievements
          </h2>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Digital Badges</p>
                <p className="text-xl font-black text-gray-900">12</p>
              </div>
              <Award className="h-8 w-8 text-amber-400 opacity-50" />
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Recently Issued</p>
              <div className="p-3 border border-gray-100 rounded-xl flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">F-Gas Core Card</p>
                  <p className="text-[10px] text-gray-400 font-medium">Verified: 12 Jan 2026</p>
                </div>
              </div>
            </div>

            <button className="w-full py-3 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
              View All Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}
