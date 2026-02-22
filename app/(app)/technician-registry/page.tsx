'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, ChevronRight, CheckCircle, AlertTriangle, Clock, MapPin, Phone, Mail, Briefcase } from 'lucide-react';
import { Technician } from '@/types/index';
import { MOCK_TECHNICIANS, ZIMBABWE_PROVINCES, TECHNICIAN_SPECIALIZATIONS } from '@/constants/registry';
import { getSession, UserSession } from '@/lib/auth';

function TechnicianRegistryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

    // Get search parameters from URL
    const search = searchParams.get('search');
    const specialization = searchParams.get('specialization');
    const province = searchParams.get('province');

    if (search) {
      setSearchTerm(search);
    }

    if (specialization) {
      setSelectedSpecialization(specialization);
    }

    if (province) {
      setSelectedProvince(province);
    }
  }, [searchParams]);

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
      inactive: AlertTriangle,
      suspended: AlertTriangle,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">National Technician Registry</h1>
          <p className="text-gray-500 mt-1">Search and verify registered technicians across Zimbabwe</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
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

          {/* Province Filter */}
          <div>
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
          </div>

          {/* Specialization Filter */}
          <div>
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
          </div>

          {/* Status Filter */}
          <div>
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
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Total Technicians</p>
          <p className="text-2xl font-bold text-gray-900">{filteredTechnicians.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Active Technicians</p>
          <p className="text-2xl font-bold text-gray-900">
            {filteredTechnicians.filter(tech => tech.status === 'active').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Provinces Covered</p>
          <p className="text-2xl font-bold text-gray-900">
            {new Set(filteredTechnicians.map(tech => tech.province)).size}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Specializations</p>
          <p className="text-2xl font-bold text-gray-900">
            {new Set(filteredTechnicians.map(tech => tech.specialization)).size}
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
                      <span className="font-medium text-gray-400">REG:</span>
                      <span className="font-bold">{technician.registrationNumber}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-gray-400">SPECIALTY:</span>
                      <span className="font-bold">{technician.specialization}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-gray-400">CERTS:</span>
                      <span className="font-bold text-blue-600 px-2 py-0.5 bg-blue-50 rounded-lg">{technician.certifications.length} Verified</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-gray-400">PROVINCE:</span>
                      <span className="font-bold">{technician.province}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.push(`/technician-registry/${technician.id}`)}
                    className="px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-blue-600 transition-all flex items-center gap-2 font-bold text-sm shadow-lg shadow-gray-200"
                  >
                    Verify Profile <ChevronRight className="h-4 w-4" />
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

export default function TechnicianRegistryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <TechnicianRegistryContent />
    </Suspense>
  );
}
