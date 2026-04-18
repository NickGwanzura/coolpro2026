'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, Edit2, Trash2, CheckCircle, XCircle, Clock, ChevronRight, UserPlus, Download, Eye, X } from 'lucide-react';
import { Technician } from '@/types/index';
import { ZIMBABWE_PROVINCES, TECHNICIAN_SPECIALIZATIONS } from '@/constants/registry';
import { getSession, UserSession } from '@/lib/auth';
import { useTechnicians, updateTechnician, deleteTechnician } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';

const PENDING_CERT_MOCK = [
  { id: 'appr-1', tech: 'Tapiwa Moyo', cert: 'Low GWP Refrigerants Safety', date: '2026-02-22', score: '95%', details: 'Written exam covering low GWP refrigerant handling, storage, and safety procedures. 38/40 questions answered correctly.' },
  { id: 'appr-2', tech: 'John Sithole', cert: 'R-744 Transcritical Systems', date: '2026-02-21', score: '88%', details: 'Practical and theory assessment on CO₂ transcritical system operation. Passed all safety checks. Minor deductions on pressure calculations.' },
  { id: 'appr-3', tech: 'Sarah Dhlamini', cert: 'Hydrocarbon Safety Specialist', date: '2026-02-21', score: '92%', details: 'Comprehensive hydrocarbon refrigerant safety exam including leak detection, flammability zones, and PPE requirements. 37/40 correct.' },
];

export default function ManageTechniciansPage() {
  const router = useRouter();
  const { success, info } = useToast();
  const [session, setSession] = useState<UserSession | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [activeTab, setActiveTab] = useState<'technicians' | 'certifications'>('technicians');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [pendingCerts, setPendingCerts] = useState(PENDING_CERT_MOCK);
  const [examModal, setExamModal] = useState<typeof PENDING_CERT_MOCK[number] | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { data: techniciansData, error: techniciansError, isLoading: techniciansLoading } = useTechnicians();

  useEffect(() => {
    setSession(getSession());
  }, []);

  const filteredTechnicians = useMemo(() => {
    const data = techniciansData ?? [];
    let filtered = [...data];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tech =>
        tech.name.toLowerCase().includes(term) ||
        tech.registrationNumber.toLowerCase().includes(term) ||
        tech.nationalId.toLowerCase().includes(term) ||
        tech.specialization.toLowerCase().includes(term)
      );
    }

    if (selectedProvince) {
      filtered = filtered.filter(tech => tech.province === selectedProvince);
    }

    if (selectedSpecialization) {
      filtered = filtered.filter(tech => tech.specialization === selectedSpecialization);
    }

    if (selectedStatus) {
      filtered = filtered.filter(tech => tech.status === selectedStatus);
    }

    return filtered;
  }, [searchTerm, selectedProvince, selectedSpecialization, selectedStatus, techniciansData]);

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };

    const labels = {
      active: 'Active',
      inactive: 'Inactive',
      suspended: 'Suspended',
      pending: 'Pending'
    };

    const icons = {
      active: CheckCircle,
      inactive: XCircle,
      suspended: XCircle,
      pending: Clock
    };

    const Icon = icons[status as keyof typeof icons];

    return (
      <span className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        <Icon className="h-3 w-3" />
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setMutationError(null);
    try {
      await updateTechnician(id, { status: newStatus as Technician['status'] });
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Status update failed');
    }
  };

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    setMutationError(null);
    try {
      await deleteTechnician(id);
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Registration Number', 'National ID', 'Specialization', 'Province', 'District', 'Status', 'Employment Status', 'Employer', 'Contact', 'Email', 'Expiry Date'];
    const rows = filteredTechnicians.map(t => [
      t.name, t.registrationNumber, t.nationalId, t.specialization,
      t.province, t.district, t.status, t.employmentStatus,
      t.employer ?? '', t.contactNumber, t.email ?? '', t.expiryDate,
    ]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `technician-registry-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    success(`Exported ${filteredTechnicians.length} technician records`);
  };

  const approveCert = (id: string, techName: string, certName: string) => {
    setPendingCerts(prev => prev.filter(c => c.id !== id));
    setExamModal(null);
    success(`Certification approved and issued to ${techName} ${certName}`);
  };

  if (techniciansLoading) {
    return <div className="p-8 text-sm text-slate-500">Loading…</div>;
  }

  if (techniciansError) {
    return <div className="p-8 text-sm text-red-600">Failed to load. {techniciansError.message}</div>;
  }

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={deleteTargetId !== null}
        title="Delete technician record"
        description="This will permanently remove the technician from the registry. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />

      {mutationError && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200">{mutationError}</div>
      )}

      {/* Exam Detail Modal */}
      {examModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">Exam Submission</h3>
                <p className="text-sm text-gray-500 mt-0.5">{examModal.tech}</p>
              </div>
              <button onClick={() => setExamModal(null)} className="p-1 hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Certification</p>
                <p className="font-semibold text-gray-900">{examModal.cert}</p>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Submitted</p>
                  <p className="font-semibold text-gray-900">{examModal.date}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Score</p>
                  <p className="font-bold text-green-600 text-lg">{examModal.score}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Examiner Notes</p>
                <p className="text-sm text-gray-700 leading-relaxed">{examModal.details}</p>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => setExamModal(null)}
                className="flex-1 px-4 py-2 text-sm font-bold border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => approveCert(examModal.id, examModal.tech, examModal.cert)}
                className="flex-1 px-4 py-2 text-sm font-bold bg-gray-900 text-white hover:bg-blue-600 transition-colors"
              >
                Approve & Issue
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Program Administration</h1>
          <p className="text-gray-500 mt-1">Verify credentials, approve certifications, and manage the national registry</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/technician-registry/add')}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2 font-semibold"
          >
            <UserPlus className="h-4 w-4" />
            Direct Entry
          </button>
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-[#FF6B35] text-white hover:bg-[#e55a25] transition-colors flex items-center gap-2 font-semibold shadow-lg shadow-orange-500/20"
          >
            <Download className="h-4 w-4" />
            Export Registry
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white -2xl overflow-hidden">
        <button
          onClick={() => setActiveTab('technicians')}
          className={`px-8 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'technicians'
              ? 'border-[#5A7D5A] text-[#5A7D5A] bg-[#5A7D5A]/5'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
        >
          National RAC Technician Verification and Competency Registry
        </button>
        <button
          onClick={() => setActiveTab('certifications')}
          className={`px-8 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'certifications'
              ? 'border-[#5A7D5A] text-[#5A7D5A] bg-[#5A7D5A]/5'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
        >
          Certification Approvals
          <span className="ml-2 px-2 py-0.5 rounded-full bg-[#5A7D5A]/10 text-[#5A7D5A] text-[10px]">3 New</span>
        </button>
      </div>

      {activeTab === 'technicians' ? (
        <>
          {/* Search and Filters */}
          <div className="bg-white border border-gray-200 shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search registry..."
                    aria-label="Search technicians by name, registration number or ID"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 focus:ring-2 focus:ring-[#5A7D5A] focus:border-transparent outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <select
                aria-label="Filter by province"
                className="w-full px-3 py-2.5 border border-gray-200 focus:ring-2 focus:ring-[#5A7D5A] focus:border-transparent outline-none transition-all"
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
              >
                <option value="">All Provinces</option>
                {ZIMBABWE_PROVINCES.map(province => (
                  <option key={province.id} value={province.name}>{province.name}</option>
                ))}
              </select>

              <select
                aria-label="Filter by status"
                className="w-full px-3 py-2.5 border border-gray-200 focus:ring-2 focus:ring-[#5A7D5A] focus:border-transparent outline-none transition-all"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Technician List */}
          <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredTechnicians.map((technician) => (
                <div key={technician.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{technician.name}</h3>
                        {getStatusBadge(technician.status)}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-semibold text-gray-500 uppercase tracking-tight">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">REG:</span>
                          <span className="text-gray-900">{technician.registrationNumber}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">FIELD:</span>
                          <span className="text-gray-900">{technician.specialization}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400">EXP:</span>
                          <span className="text-gray-900">{technician.expiryDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/technician-registry/${technician.id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit Profile"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>

                      {technician.status === 'pending' ? (
                        <button
                          onClick={() => handleStatusChange(technician.id, 'active')}
                          className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition-all font-bold text-sm shadow-sm"
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(technician.id, technician.status === 'active' ? 'suspended' : 'active')}
                          className={`p-2 transition-colors ${technician.status === 'active'
                              ? 'text-red-500 hover:bg-red-50'
                              : 'text-green-500 hover:bg-green-50'
                            }`}
                        >
                          {technician.status === 'active' ? <XCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(technician.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredTechnicians.length === 0 && (
              <div className="p-12 text-center">
                <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No technicians found</h3>
                <p className="text-gray-500">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 uppercase text-xs tracking-widest">Pending Certification Reviews</h2>
              <div className="text-xs font-bold text-blue-600">3 assessments awaiting verifier</div>
            </div>
            <div className="divide-y divide-gray-100">
              {pendingCerts.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCircle className="mx-auto h-10 w-10 text-green-400 mb-3" />
                  <p className="font-semibold text-gray-700">All certifications reviewed</p>
                  <p className="text-sm text-gray-400 mt-1">No pending exam submissions</p>
                </div>
              ) : pendingCerts.map((item) => (
                <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{item.tech}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">EXAM SUBMISSION</span>
                    </div>
                    <p className="text-sm font-medium text-gray-500">{item.cert}</p>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                      <span>Submitted: {item.date}</span>
                      <span className="text-green-600">Score: {item.score}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setExamModal(item)}
                      className="px-4 py-2 text-sm font-bold border border-gray-200 hover:bg-white transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="h-4 w-4" />
                      View Exam
                    </button>
                    <button
                      onClick={() => approveCert(item.id, item.tech, item.cert)}
                      className="px-4 py-2 text-sm font-bold bg-gray-900 text-white hover:bg-blue-600 transition-colors"
                    >
                      Approve & Issue
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-6 flex items-start gap-4">
            <div className="bg-amber-100 p-2 ">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900">Compliance Deadline Approaching</h4>
              <p className="text-sm text-amber-700 mt-1">There are 12 technicians whose GWP certifications expire in the next 30 days. Auto-notifications have been queued for dispatch.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
