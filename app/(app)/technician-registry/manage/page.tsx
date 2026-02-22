'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit2, Trash2, CheckCircle, XCircle, Clock, ChevronRight, UserPlus } from 'lucide-react';
import { Technician } from '@/types/index';
import { MOCK_TECHNICIANS, ZIMBABWE_PROVINCES, TECHNICIAN_SPECIALIZATIONS } from '@/constants/registry';
import { getSession, UserSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function ManageTechniciansPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [filteredTechnicians, setFilteredTechnicians] = useState<Technician[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [activeTab, setActiveTab] = useState<'technicians' | 'certifications'>('technicians');

  useEffect(() => {
    setSession(getSession());
    setTechnicians(MOCK_TECHNICIANS);
    setFilteredTechnicians(MOCK_TECHNICIANS);
  }, []);

  useEffect(() => {
    let filtered = [...technicians];

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

    setFilteredTechnicians(filtered);
  }, [searchTerm, selectedProvince, selectedSpecialization, selectedStatus, technicians]);

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

  const handleStatusChange = (id: string, newStatus: string) => {
    const updated = technicians.map(tech =>
      tech.id === id ? { ...tech, status: newStatus as any } : tech
    );
    setTechnicians(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this technician record?')) {
      setTechnicians(technicians.filter(tech => tech.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Program Administration</h1>
          <p className="text-gray-500 mt-1">Verify credentials, approve certifications, and manage the national registry</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/technician-registry/add')}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 font-semibold"
          >
            <UserPlus className="h-4 w-4" />
            Direct Entry
          </button>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2 font-semibold shadow-lg shadow-green-500/20"
          >
            <Plus className="h-4 w-4" />
            Export Registry
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-2xl overflow-hidden">
        <button
          onClick={() => setActiveTab('technicians')}
          className={`px-8 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'technicians'
              ? 'border-blue-600 text-blue-600 bg-blue-50/30'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
        >
          Technician Registry
        </button>
        <button
          onClick={() => setActiveTab('certifications')}
          className={`px-8 py-4 text-sm font-bold transition-all border-b-2 ${activeTab === 'certifications'
              ? 'border-blue-600 text-blue-600 bg-blue-50/30'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
        >
          Certification Approvals
          <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px]">3 New</span>
        </button>
      </div>

      {activeTab === 'technicians' ? (
        <>
          {/* Search and Filters */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search registry..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <select
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
              >
                <option value="">All Provinces</option>
                {ZIMBABWE_PROVINCES.map(province => (
                  <option key={province.id} value={province.name}>{province.name}</option>
                ))}
              </select>

              <select
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
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
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
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
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Profile"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>

                      {technician.status === 'pending' ? (
                        <button
                          onClick={() => handleStatusChange(technician.id, 'active')}
                          className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-bold text-sm shadow-sm"
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(technician.id, technician.status === 'active' ? 'suspended' : 'active')}
                          className={`p-2 rounded-lg transition-colors ${technician.status === 'active'
                              ? 'text-red-500 hover:bg-red-50'
                              : 'text-green-500 hover:bg-green-50'
                            }`}
                        >
                          {technician.status === 'active' ? <XCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(technician.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 uppercase text-xs tracking-widest">Pending Certification Reviews</h2>
              <div className="text-xs font-bold text-blue-600">3 assessments awaiting verifier</div>
            </div>
            <div className="divide-y divide-gray-100">
              {[
                { id: 'appr-1', tech: 'Tapiwa Moyo', cert: 'Low GWP Refrigerants Safety', date: '2026-02-22', score: '95%' },
                { id: 'appr-2', tech: 'John Sithole', cert: 'R-744 Transcritical Systems', date: '2026-02-21', score: '88%' },
                { id: 'appr-3', tech: 'Sarah Dhlamini', cert: 'Hydrocarbon Safety Specialist', date: '2026-02-21', score: '92%' },
              ].map((item) => (
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
                    <button className="px-4 py-2 text-sm font-bold border border-gray-200 rounded-xl hover:bg-white transition-colors">View Exam</button>
                    <button className="px-4 py-2 text-sm font-bold bg-gray-900 text-white rounded-xl hover:bg-blue-600 transition-colors">Approve & Issue</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex items-start gap-4">
            <div className="bg-amber-100 p-2 rounded-xl">
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