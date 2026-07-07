'use client';

import { useMemo, useState } from 'react';
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
  X,
} from 'lucide-react';
import { CertificateQRCode } from '@/components/CertificateQRCode';
import { useAuth } from '@/lib/auth';
import { ZIMBABWE_PROVINCES } from '@/constants/registry';
import { useTechnicians, useCertificateRequests, createCertificateRequest, reviewCertificateRequest } from '@/lib/api';
import type { TrainerCertificateRequest } from '@/types/index';

// ---------------------------------------------------------------------------
// Exam question banks
// ---------------------------------------------------------------------------

type ExamQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
};

type ExamBank = {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: string;
  questions: ExamQuestion[];
};

const EXAM_BANKS: ExamBank[] = [
  {
    id: 'gwp-basic',
    title: 'Low GWP Refrigerants Safety',
    description: 'Essential safety protocols for handling flammable and high-pressure low GWP refrigerants.',
    duration: '45 mins',
    level: 'Basic',
    questions: [
      { id: 'gwp-1', question: 'What does GWP stand for?', options: ['Global Warming Potential', 'Gas Working Pressure', 'General Waste Protocol', 'Greenhouse Water Pollution'], correctIndex: 0 },
      { id: 'gwp-2', question: 'Which of the following is a low GWP refrigerant?', options: ['R-404A', 'R-290 (Propane)', 'R-134a', 'R-410A'], correctIndex: 1 },
      { id: 'gwp-3', question: 'What safety class does R-290 belong to?', options: ['A1', 'A2L', 'A3', 'B1'], correctIndex: 2 },
      { id: 'gwp-4', question: 'When handling flammable refrigerants, what must be present?', options: ['Open flame', 'Leak detection equipment', 'Oxygen tank', 'Wooden tools'], correctIndex: 1 },
      { id: 'gwp-5', question: 'What is the maximum charge for R-290 in an occupied space?', options: ['No limit', '150g', '500g', 'Depends on room size'], correctIndex: 3 },
    ],
  },
  {
    id: 'co2-advanced',
    title: 'R-744 (CO2) System Specialist',
    description: 'Advanced transcritical and subcritical CO2 system design, installation, and maintenance.',
    duration: '90 mins',
    level: 'Advanced',
    questions: [
      { id: 'co2-1', question: 'What is the critical point of CO2 (R-744)?', options: ['31.1°C / 73.8 bar', '100°C / 10 bar', '0°C / 50 bar', '50°C / 100 bar'], correctIndex: 0 },
      { id: 'co2-2', question: 'In transcritical CO2 systems, the gas cooler replaces which component?', options: ['Evaporator', 'Condenser', 'Compressor', 'Expansion valve'], correctIndex: 1 },
      { id: 'co2-3', question: 'What is a key safety concern with CO2 systems?', options: ['Flammability', 'Toxicity at high concentrations', 'Ozone depletion', 'Corrosion'], correctIndex: 1 },
      { id: 'co2-4', question: 'What GWP value does R-744 have?', options: ['1430', '1', '675', '0'], correctIndex: 1 },
      { id: 'co2-5', question: 'What material is commonly used for CO2 system piping?', options: ['Copper', 'Stainless steel', 'PVC', 'Aluminum'], correctIndex: 1 },
    ],
  },
  {
    id: 'hc-safety',
    title: 'Hydrocarbon Refrigerant Handling',
    description: 'Safe handling and service practices for R-290 and R-600a systems.',
    duration: '60 mins',
    level: 'Specialist',
    questions: [
      { id: 'hc-1', question: 'Hydrocarbon refrigerants are classified as which safety group?', options: ['A1', 'A2', 'A3', 'B2'], correctIndex: 2 },
      { id: 'hc-2', question: 'What is the LFL of R-290 in air?', options: ['1.5%', '2.1%', '5.0%', '15%'], correctIndex: 1 },
      { id: 'hc-3', question: 'What type of ventilation is required when servicing hydrocarbon systems?', options: ['Natural ventilation', 'Forced/mechanical ventilation', 'No ventilation needed', 'Recirculating fan'], correctIndex: 1 },
      { id: 'hc-4', question: 'Can hydrocarbon refrigerants be used in existing R-134a systems?', options: ['Yes, without modification', 'Only with certified retrofit kit', 'Never', 'Only if the compressor is changed'], correctIndex: 2 },
      { id: 'hc-5', question: 'What is the maximum allowable charge for R-290 in commercial refrigeration?', options: ['150g', '500g', 'No limit with proper ventilation', '1000g'], correctIndex: 2 },
    ],
  },
];

// Compat alias — AVAILABLE_EXAMS is referenced in the JSX below
const AVAILABLE_EXAMS = EXAM_BANKS;

type TrainerFormState = {
  technicianId: string;
  courseTitle: string;
  examDate: string;
  theoryScore: string;
  practicalScore: string;
  notes: string;
};

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium' }).format(new Date(value));
}

export default function CertificationsPage() {
  const { user: session } = useAuth();
  const isAdmin = session?.role === 'org_admin';
  const isTrainer = session?.role === 'trainer' || session?.role === 'lecturer';
  const isAdminOrTrainer = isAdmin || isTrainer;
  const { data: techniciansData } = useTechnicians(undefined, isAdminOrTrainer);
  const { data: requestsData, isLoading: requestsLoading } = useCertificateRequests();
  const [nowRef] = useState(() => Date.now());
  const [examModal, setExamModal] = useState<ExamBank | null>(null);
  const [examTaking, setExamTaking] = useState<string | null>(null);
  const [examAnswers, setExamAnswers] = useState<Record<string, number>>({});
  const [submittingExam, setSubmittingExam] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [notice, setNotice] = useState('');
  const [trainerForm, setTrainerForm] = useState<TrainerFormState>({
    technicianId: '',
    courseTitle: AVAILABLE_EXAMS[0].title,
    examDate: '2026-04-05',
    theoryScore: '78',
    practicalScore: '84',
    notes: '',
  });

  const requests = useMemo(() => requestsData ?? [], [requestsData]);

  const trainerRequests = useMemo(() => {
    if (!session) return [];
    return requests.filter(request => request.trainerEmail === session.email);
  }, [requests, session]);

  const filteredAdminRequests = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const techList = techniciansData ?? [];

    return requests.filter(request => {
      const matchesSearch =
        !search ||
        request.technicianName.toLowerCase().includes(search) ||
        request.courseTitle.toLowerCase().includes(search) ||
        request.trainerName.toLowerCase().includes(search);

      const technician = techList.find(tech => tech.id === request.technicianId);
      const matchesRegion = !selectedRegion || technician?.province === selectedRegion;
      const matchesDate = !dateFilter || request.submittedAt.startsWith(dateFilter) || request.examDate.startsWith(dateFilter);

      return matchesSearch && matchesRegion && matchesDate;
    });
  }, [dateFilter, requests, searchTerm, selectedRegion, techniciansData]);

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

  // Derive issued certs for this technician from stored requests
  const issuedCerts = useMemo(() => {
    return requests.filter(r => r.status === 'issued');
  }, [requests]);

  // Only admin and trainer views need the technicians list — don't block technicians on this
  if (((isAdmin || isTrainer) && techniciansData === undefined) || requestsLoading) {
    return <div className="p-8 text-sm text-slate-500">Loading…</div>;
  }

  const handleReviewRequest = async (requestId: string, action: 'approve' | 'reject' | 'issue') => {
    try {
      const updated = await reviewCertificateRequest(requestId, action);
      if (action === 'issue' && updated.certificateNumber) {
        setNotice(`Certificate ${updated.certificateNumber} is now live on the Public Certificate Verification Portal.`);
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to update this request.');
    }
  };

  const handleTrainerSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const technician = (techniciansData ?? []).find(item => item.id === trainerForm.technicianId);
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

    try {
      await createCertificateRequest({
        technicianId: technician.id,
        technicianName: technician.name,
        technicianRegistrationNumber: technician.registrationNumber,
        technicianCompany: technician.employer ?? 'Independent technician',
        courseTitle: trainerForm.courseTitle,
        examDate: trainerForm.examDate,
        theoryScore,
        practicalScore,
        notes: trainerForm.notes.trim(),
      });
      setNotice(`Assessment recorded for ${technician.name} and submitted for admin approval.`);
      setTrainerForm((current) => ({
        ...current,
        theoryScore: '78',
        practicalScore: '84',
        notes: '',
      }));
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to submit the assessment.');
    }
  };

  const handleStartExam = (id: string) => {
    const bank = EXAM_BANKS.find(e => e.id === id);
    if (bank) {
      setExamModal(bank);
      setExamTaking(id);
      setExamAnswers({});
    }
  };

  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    setExamAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitExam = async () => {
    if (!examModal || !session) return;
    const allAnswered = examModal.questions.every(q => examAnswers[q.id] !== undefined);
    if (!allAnswered) {
      setNotice('Please answer all questions before submitting.');
      return;
    }
    setSubmittingExam(true);
    try {
      const total = examModal.questions.length;
      const correct = examModal.questions.filter(q => examAnswers[q.id] === q.correctIndex).length;
      const score = Math.round((correct / total) * 100);

      // Submit to exam-submissions API
      const res = await fetch('/api/exam-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseId: examModal.id,
          courseTitle: examModal.title,
          studentId: session.id,
          studentName: session.name,
          answers: examModal.questions.map(q => ({
            question: q.question,
            answer: q.options[examAnswers[q.id] ?? 0],
          })),
        }),
      });

      if (!res.ok) throw new Error((await res.json()).error ?? 'Submission failed');

      setNotice(`Exam submitted! Score: ${score}% (${correct}/${total} correct). Awaiting trainer marking.`);
      setExamModal(null);
      setExamTaking(null);
      setExamAnswers({});
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Failed to submit exam.');
    } finally {
      setSubmittingExam(false);
    }
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
          <div className="flex items-center gap-2 border border-blue-100 bg-blue-50 px-4 py-2">
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

        <div className="border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search technician, course, or trainer"
                  className="w-full border border-gray-300 py-2.5 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Region</label>
              <select
                value={selectedRegion}
                onChange={(event) => setSelectedRegion(event.target.value)}
                className="w-full border border-gray-300 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500"
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
                className="w-full border border-gray-300 px-3 py-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredAdminRequests.map((request) => (
            <div key={request.id} className="border border-gray-200 bg-white p-6 shadow-sm">
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
                    onClick={() => handleReviewRequest(request.id, 'approve')}
                    className="bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Approve for Issuance
                  </button>
                  <button
                    onClick={() => handleReviewRequest(request.id, 'reject')}
                    className="border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
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
          <div className="flex items-center gap-2 border border-emerald-100 bg-emerald-50 px-4 py-2">
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
          <form onSubmit={handleTrainerSubmit} className="border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Mark Exam and Submit Certificate Request</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Choose a registered technician, record their theory and practical marks, then send the certificate request to admin for approval.
            </p>

            <div className="mt-5 grid gap-4">
              <select
                value={trainerForm.technicianId}
                onChange={(event) => setTrainerForm((current) => ({ ...current, technicianId: event.target.value }))}
                className="border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              >
                {(techniciansData ?? []).map((technician) => (
                  <option key={technician.id} value={technician.id}>
                    {technician.name} · {technician.registrationNumber} · {technician.employer ?? 'Independent'}
                  </option>
                ))}
              </select>

              <select
                value={trainerForm.courseTitle}
                onChange={(event) => setTrainerForm((current) => ({ ...current, courseTitle: event.target.value }))}
                className="border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={trainerForm.theoryScore}
                  onChange={(event) => setTrainerForm((current) => ({ ...current, theoryScore: event.target.value }))}
                  placeholder="Theory %"
                  className="border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={trainerForm.practicalScore}
                  onChange={(event) => setTrainerForm((current) => ({ ...current, practicalScore: event.target.value }))}
                  placeholder="Practical %"
                  className="border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <textarea
                rows={4}
                value={trainerForm.notes}
                onChange={(event) => setTrainerForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Trainer notes and practical observations"
                className="border border-gray-200 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="mt-5 inline-flex items-center gap-2 bg-[#FF6B35] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Send className="h-4 w-4" />
              Submit for Admin Approval
            </button>

            {notice && (
              <div className="mt-4 border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                {notice}
              </div>
            )}
          </form>

          <div className="space-y-4">
            {trainerRequests.map((request) => (
              <div key={request.id} className="border border-gray-200 bg-white p-6 shadow-sm">
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
                    onClick={() => handleReviewRequest(request.id, 'issue')}
                    className="mt-4 bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Issue Certificate
                  </button>
                )}
                {request.status === 'issued' && request.verificationUrl && (
                  <div className="mt-4 space-y-3">
                    <CertificateQRCode
                      value={request.verificationUrl}
                      title="Public Certificate Verification Portal"
                    />
                    <a
                      href={request.verificationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                    >
                      Open verification link
                    </a>
                  </div>
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
          <h1 className="text-2xl font-bold text-gray-900">Certification</h1>
          <p className="text-gray-500 mt-1">Your issued certificates, training history &amp; available assessments</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 border border-blue-100">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-semibold text-blue-700">Accredited by SA-RACA</span>
        </div>
      </div>

      {/* Issued Certificates */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
          <Award className="h-5 w-5 text-amber-500" />
          My Issued Certificates
        </h2>
        {issuedCerts.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 p-8 text-center">
            <Award className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-500">No certificates issued yet</p>
            <p className="text-xs text-gray-400 mt-1">Complete an assessment below to begin the certification process.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {issuedCerts.map(cert => {
              const issueDate = cert.issuedAt ?? cert.submittedAt;
              const expiry = new Date(issueDate);
              expiry.setFullYear(expiry.getFullYear() + 2);
              const daysLeft = Math.ceil((expiry.getTime() - nowRef) / (1000 * 60 * 60 * 24));
              const isExpired = daysLeft <= 0;
              const isExpiringSoon = daysLeft > 0 && daysLeft <= 30;
              return (
                <div key={cert.id} className="bg-white border border-gray-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className={`p-3 rounded-full flex-shrink-0 ${isExpired ? 'bg-red-100' : isExpiringSoon ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                    <ShieldCheck className={`h-6 w-6 ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-emerald-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-bold text-gray-900">{cert.courseTitle}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isExpired ? 'bg-red-50 text-red-700' : isExpiringSoon ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {isExpired ? 'Expired' : isExpiringSoon ? `${daysLeft} days left` : 'Valid'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">HEVACRAZ · No. {cert.certificateNumber}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> Issued: {formatDate(issueDate)}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Expires: {formatDate(expiry.toISOString())}</span>
                    </div>
                  </div>
                  {cert.verificationUrl && (
                    <a href={cert.verificationUrl} target="_blank" rel="noreferrer"
                      className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                      Verify <ArrowRight className="h-3 w-3" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Training History */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-blue-500" />
          Training History
        </h2>
        {issuedCerts.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 p-6 text-center">
            <p className="text-sm text-gray-400">No completed training records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Course / Assessment</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Trainer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Exam Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Score</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Certificate</th>
                </tr>
              </thead>
              <tbody>
                {issuedCerts.map(r => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{r.courseTitle}</td>
                    <td className="px-5 py-3 text-gray-500">{r.trainerName}</td>
                    <td className="px-5 py-3 text-gray-500">{r.examDate}</td>
                    <td className="px-5 py-3">
                      <span className={`font-bold ${r.overallScore >= 70 ? 'text-emerald-600' : 'text-red-600'}`}>{r.overallScore}%</span>
                    </td>
                    <td className="px-5 py-3">
                      {r.certificateNumber ? (
                        <span className="font-mono text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 font-semibold">{r.certificateNumber}</span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Available Assessments */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-gray-500" />
          Available Assessments
        </h2>
        <div className="grid gap-4">
          {AVAILABLE_EXAMS.map((exam) => (
            <div key={exam.id} className="bg-white border border-gray-200 p-6 shadow-sm hover:border-blue-300 transition-all group">
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
                      {exam.questions.length} Questions
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <button
                    onClick={() => handleStartExam(exam.id)}
                    disabled={examTaking !== null}
                    className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 font-bold text-sm hover:bg-blue-600 transition-all disabled:opacity-50"
                  >
                    Start Exam
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Exam Modal */}
        {examModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-gray-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{examModal.title}</h2>
                  <p className="text-sm text-gray-500">{examModal.questions.length} questions</p>
                </div>
                <button onClick={() => { setExamModal(null); setExamTaking(null); }} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-6">
                {examModal.questions.map((q, i) => (
                  <div key={q.id} className="border border-gray-100 bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-gray-900 mb-3">
                      {i + 1}. {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => (
                        <label key={oi} className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${
                          examAnswers[q.id] === oi
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}>
                          <input
                            type="radio"
                            name={q.id}
                            checked={examAnswers[q.id] === oi}
                            onChange={() => handleAnswerSelect(q.id, oi)}
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
                <p className="text-sm text-gray-500">
                  {Object.keys(examAnswers).length} of {examModal.questions.length} answered
                </p>
                <button
                  onClick={handleSubmitExam}
                  disabled={submittingExam || Object.keys(examAnswers).length !== examModal.questions.length}
                  className="inline-flex items-center gap-2 bg-[#D97706] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#b45309] disabled:opacity-50 transition-colors"
                >
                  {submittingExam ? 'Submitting…' : 'Submit Exam'}
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {notice && (
          <div className="mt-4 border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            {notice}
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}
