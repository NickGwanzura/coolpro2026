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
          <h1 className="text-2xl font-bold text-gray-900">Manage Technicians</h1>
          <p className="text-gray-500 mt-1">Verify, approve, and manage registered technicians</p>
        </div>
        <button 
          onClick={() => router.push('/technician-registry/add')}
          className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Add New Technician
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, registration number, national ID, or specialization..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
          >
            <option value="">All Provinces</option>
            {ZIMBABWE_PROVINCES.map(province => (
              <option key={province.id} value={province.name}>{province.name}</option>
            ))}
          </select>

          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedSpecialization}
            onChange={(e) => setSelectedSpecialization(e.target.value)}
          >
            <option value="">All Specializations</option>
            {TECHNICIAN_SPECIALIZATIONS.map(specialization => (
              <option key={specialization} value={specialization}>{specialization}</option>
            ))}
          </select>

          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Total Technicians</p>
          <p className="text-2xl font-bold text-gray-900">{filteredTechnicians.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-600">
            {filteredTechnicians.filter(tech => tech.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Active Technicians</p>
          <p className="text-2xl font-bold text-green-600">
            {filteredTechnicians.filter(tech => tech.status === 'active').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Suspended</p>
          <p className="text-2xl font-bold text-red-600">
            {filteredTechnicians.filter(tech => tech.status === 'suspended').length}
          </p>
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
                    <h3 className="text-lg font-semibold text-gray-900">{technician.name}</h3>
                    {getStatusBadge(technician.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Reg. No:</span>
                      <span>{technician.registrationNumber}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Specialization:</span>
                      <span>{technician.specialization}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Province:</span>
                      <span>{technician.province}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Status:</span>
                      <span className="capitalize">{technician.employmentStatus.replace('-', ' ')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => router.push(`/technician-registry/${technician.id}`)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                  
                  {technician.status === 'pending' ? (
                    <button 
                      onClick={() => handleStatusChange(technician.id, 'active')}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleStatusChange(technician.id, technician.status === 'active' ? 'suspended' : 'active')}
                      className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1 ${
                        technician.status === 'active' 
                          ? 'bg-red-600 text-white hover:bg-red-700' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {technician.status === 'active' ? (
                        <>
                          <XCircle className="h-4 w-4" />
                          Suspend
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Activate
                        </>
                      )}
                    </button>
                  )}

                  <button 
                    onClick={() => handleDelete(technician.id)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
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
    </div>
  );
}