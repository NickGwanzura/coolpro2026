'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, AlertTriangle, Clock, MapPin, Phone, Mail, Briefcase, Award, Calendar, FileText, Building2 } from 'lucide-react';
import { Technician } from '@/types/index';
import { MOCK_TECHNICIANS } from '@/constants/registry';

export default function TechnicianDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real application, this would be an API call
    const tech = MOCK_TECHNICIANS.find(t => t.id === params.id);
    setTechnician(tech || null);
    setLoading(false);
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!technician) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Technician Not Found</h3>
        <p className="text-gray-500 mb-4">The requested technician could not be found in the registry.</p>
        <button
          onClick={() => router.push('/technician-registry')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          Return to Registry
        </button>
      </div>
    );
  }

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
      <span className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        <Icon className="h-4 w-4" />
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-ZW', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/technician-registry')}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{technician.name}</h1>
          <p className="text-gray-500 mt-1">National Technician Registry</p>
        </div>
        {getStatusBadge(technician.status)}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Details */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Full Name</p>
                <p className="text-gray-900">{technician.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">National ID</p>
                <p className="text-gray-900">{technician.nationalId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Registration Number</p>
                <p className="text-gray-900">{technician.registrationNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Specialization</p>
                <p className="text-gray-900">{technician.specialization}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Contact Number</p>
                <p className="text-gray-900">{technician.contactNumber}</p>
              </div>
              {technician.email && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-gray-900">{technician.email}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Employment Status</p>
                <p className="text-gray-900 capitalize">{technician.employmentStatus.replace('-', ' ')}</p>
              </div>
              {technician.employer && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Employer</p>
                  <p className="text-gray-900">{technician.employer}</p>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Province</p>
                <p className="text-gray-900">{technician.province}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">District</p>
                <p className="text-gray-900">{technician.district}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Region</p>
                <p className="text-gray-900">{technician.region}</p>
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Certifications</h2>
            <div className="space-y-4">
              {technician.certifications.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No certifications on record</p>
              ) : (
                technician.certifications.map((cert) => (
                  <div key={cert.id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{cert.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{cert.issuingBody}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>Cert No: {cert.certificateNumber}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Issued: {formatDate(cert.dateIssued)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Expiry: {formatDate(cert.expiryDate)}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        cert.status === 'valid' ? 'bg-green-100 text-green-800' :
                        cert.status === 'expired' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {cert.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Training History */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Training History</h2>
            <div className="space-y-4">
              {technician.trainingHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No training records on file</p>
              ) : (
                technician.trainingHistory.map((training) => (
                  <div key={training.id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{training.courseName}</h3>
                        <p className="text-sm text-gray-500 mt-1">{training.provider}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Completed: {formatDate(training.dateCompleted)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>Duration: {training.duration}</span>
                          </div>
                          {training.certificateNumber && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              <span>Cert No: {training.certificateNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Registration Details */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Registration Status</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Registration Date</p>
                <p className="text-gray-900">{formatDate(technician.registrationDate)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Expiry Date</p>
                <p className="text-gray-900">{formatDate(technician.expiryDate)}</p>
              </div>
              {technician.lastRenewalDate && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Renewal</p>
                  <p className="text-gray-900">{formatDate(technician.lastRenewalDate)}</p>
                </div>
              )}
              {technician.nextRenewalDate && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Next Renewal</p>
                  <p className="text-gray-900">{formatDate(technician.nextRenewalDate)}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 bg-white text-blue-600 rounded-xl border border-blue-300 hover:bg-blue-50 transition-colors">
                Download Certificate
              </button>
              <button className="w-full px-4 py-2 bg-white text-blue-600 rounded-xl border border-blue-300 hover:bg-blue-50 transition-colors">
                View Full Profile
              </button>
              <button className="w-full px-4 py-2 bg-white text-blue-600 rounded-xl border border-blue-300 hover:bg-blue-50 transition-colors">
                Send Notification
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}