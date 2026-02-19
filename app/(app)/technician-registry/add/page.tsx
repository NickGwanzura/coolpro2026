'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, Save, Plus, X } from 'lucide-react';
import { ZIMBABWE_PROVINCES, TECHNICIAN_SPECIALIZATIONS } from '@/constants/registry';

export default function AddTechnicianPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    nationalId: '',
    registrationNumber: '',
    province: '',
    district: '',
    region: '',
    contactNumber: '',
    email: '',
    specialization: '',
    employmentStatus: 'employed',
    employer: '',
    certifications: [] as Array<{
      name: string;
      issuingBody: string;
      dateIssued: string;
      expiryDate: string;
      certificateNumber: string;
    }>,
    trainingHistory: [] as Array<{
      courseName: string;
      provider: string;
      dateCompleted: string;
      duration: string;
      certificateNumber: string;
    }>
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const province = e.target.value;
    const selectedProvince = ZIMBABWE_PROVINCES.find(p => p.name === province);
    setFormData(prev => ({
      ...prev,
      province,
      district: '',
      region: province
    }));
  };

  const handleAddCertification = () => {
    setFormData(prev => ({
      ...prev,
      certifications: [...prev.certifications, {
        name: '',
        issuingBody: '',
        dateIssued: '',
        expiryDate: '',
        certificateNumber: ''
      }]
    }));
  };

  const handleRemoveCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const handleCertificationChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) =>
        i === index ? { ...cert, [field]: value } : cert
      )
    }));
  };

  const handleAddTraining = () => {
    setFormData(prev => ({
      ...prev,
      trainingHistory: [...prev.trainingHistory, {
        courseName: '',
        provider: '',
        dateCompleted: '',
        duration: '',
        certificateNumber: ''
      }]
    }));
  };

  const handleRemoveTraining = (index: number) => {
    setFormData(prev => ({
      ...prev,
      trainingHistory: prev.trainingHistory.filter((_, i) => i !== index)
    }));
  };

  const handleTrainingChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      trainingHistory: prev.trainingHistory.map((training, i) =>
        i === index ? { ...training, [field]: value } : training
      )
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real application, this would send data to the server
    console.log('Form submitted:', formData);
    
    // Redirect back to manage page
    router.push('/technician-registry/manage');
  };

  const selectedProvince = ZIMBABWE_PROVINCES.find(p => p.name === formData.province);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/technician-registry/manage')}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Technician</h1>
          <p className="text-gray-500 mt-1">Register a new technician in the national registry</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">National ID *</label>
              <input
                type="text"
                name="nationalId"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.nationalId}
                onChange={handleInputChange}
                placeholder="e.g. 12-3456789A12"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number *</label>
              <input
                type="text"
                name="registrationNumber"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.registrationNumber}
                onChange={handleInputChange}
                placeholder="e.g. ZIM/TECH/2024/001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization *</label>
              <select
                name="specialization"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.specialization}
                onChange={handleInputChange}
              >
                <option value="">Select specialization</option>
                {TECHNICIAN_SPECIALIZATIONS.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
              <input
                type="tel"
                name="contactNumber"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.contactNumber}
                onChange={handleInputChange}
                placeholder="+263 77 123 4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="email@example.com"
              />
            </div>
          </div>
        </div>

        {/* Employment Information */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Employment Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status *</label>
              <select
                name="employmentStatus"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.employmentStatus}
                onChange={handleInputChange}
              >
                <option value="employed">Employed</option>
                <option value="self-employed">Self-Employed</option>
                <option value="unemployed">Unemployed</option>
              </select>
            </div>
            {formData.employmentStatus !== 'unemployed' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employer</label>
                <input
                  type="text"
                  name="employer"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.employer}
                  onChange={handleInputChange}
                />
              </div>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Province *</label>
              <select
                name="province"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.province}
                onChange={handleProvinceChange}
              >
                <option value="">Select province</option>
                {ZIMBABWE_PROVINCES.map(province => (
                  <option key={province.id} value={province.name}>{province.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District *</label>
              <select
                name="district"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.district}
                onChange={handleInputChange}
                disabled={!selectedProvince}
              >
                <option value="">Select district</option>
                {selectedProvince?.districts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Region *</label>
              <input
                type="text"
                name="region"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.region}
                onChange={handleInputChange}
                disabled
              />
            </div>
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Certifications</h2>
            <button
              type="button"
              onClick={handleAddCertification}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Certification
            </button>
          </div>
          <div className="space-y-4">
            {formData.certifications.map((cert, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-4">
                <div className="flex justify-end mb-3">
                  <button
                    type="button"
                    onClick={() => handleRemoveCertification(index)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={cert.name}
                      onChange={(e) => handleCertificationChange(index, 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issuing Body *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={cert.issuingBody}
                      onChange={(e) => handleCertificationChange(index, 'issuingBody', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Number *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={cert.certificateNumber}
                      onChange={(e) => handleCertificationChange(index, 'certificateNumber', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Issued *</label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={cert.dateIssued}
                      onChange={(e) => handleCertificationChange(index, 'dateIssued', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={cert.expiryDate}
                      onChange={(e) => handleCertificationChange(index, 'expiryDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Training History */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Training History</h2>
            <button
              type="button"
              onClick={handleAddTraining}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Training
            </button>
          </div>
          <div className="space-y-4">
            {formData.trainingHistory.map((training, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-4">
                <div className="flex justify-end mb-3">
                  <button
                    type="button"
                    onClick={() => handleRemoveTraining(index)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={training.courseName}
                      onChange={(e) => handleTrainingChange(index, 'courseName', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Training Provider *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={training.provider}
                      onChange={(e) => handleTrainingChange(index, 'provider', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Completed *</label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={training.dateCompleted}
                      onChange={(e) => handleTrainingChange(index, 'dateCompleted', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={training.duration}
                      onChange={(e) => handleTrainingChange(index, 'duration', e.target.value)}
                      placeholder="e.g. 40 hours"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Number</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={training.certificateNumber}
                      onChange={(e) => handleTrainingChange(index, 'certificateNumber', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push('/technician-registry/manage')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Technician
          </button>
        </div>
      </form>
    </div>
  );
}