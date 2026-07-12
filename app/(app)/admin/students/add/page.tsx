'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { adminCreateStudent } from '@/lib/api';
import { StudentSurveyFields, isStudentSurveyComplete } from '@/components/student/StudentSurveyFields';
import type { StudentSurveyData } from '@/types/index';

const POLYTECHS = [
  'Harare Polytechnic',
  'Bulawayo Polytechnic',
  'Mutare Polytechnic',
  'Gweru Polytechnic',
  'Kwekwe Polytechnic',
  'Masvingo Polytechnic',
  'Kushinga Phikelela Polytechnic',
  'Other',
];

const FIELDS_OF_STUDY = [
  'HVAC-R / Refrigeration',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Building Services',
  'Other',
];

export default function AddStudentPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    polytech: '',
    fieldOfStudy: '',
    studentIdNumber: '',
    enrolmentYear: new Date().getFullYear(),
  });
  const [surveyData, setSurveyData] = useState<StudentSurveyData>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === 'enrolmentYear' ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      error('Please fill in all required fields.');
      return;
    }
    if (!formData.polytech || !formData.fieldOfStudy || !formData.studentIdNumber) {
      error('Please complete institution, field of study, and student ID.');
      return;
    }
    if (!isStudentSurveyComplete(surveyData)) {
      error('Please complete every Sector Survey question — it is required for every student added.');
      return;
    }

    setSubmitting(true);
    try {
      await adminCreateStudent({ ...formData, surveyData });
      success(`${formData.firstName} ${formData.lastName} has been added and sent an activation link.`);
      router.push('/admin/students');
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to add student.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin/students')}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Student</h1>
          <p className="text-gray-500 mt-1">Enrol a student directly. A secure activation link will be emailed to them.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input type="text" name="firstName" required className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent" value={formData.firstName} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input type="text" name="lastName" required className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent" value={formData.lastName} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" name="email" required className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent" value={formData.email} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input type="tel" name="phone" required className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent" value={formData.phone} onChange={handleChange} placeholder="+263 77 123 4567" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Enrolment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Institution *</label>
              <select name="polytech" required className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent" value={formData.polytech} onChange={handleChange}>
                <option value="">Select institution</option>
                {POLYTECHS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study *</label>
              <select name="fieldOfStudy" required className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent" value={formData.fieldOfStudy} onChange={handleChange}>
                <option value="">Select field</option>
                {FIELDS_OF_STUDY.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student ID Number *</label>
              <input type="text" name="studentIdNumber" required className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent" value={formData.studentIdNumber} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enrolment Year *</label>
              <input type="number" name="enrolmentYear" required min={2015} max={2035} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent" value={formData.enrolmentYear} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <StudentSurveyFields value={surveyData} onChange={setSurveyData} required />
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => router.push('/admin/students')} className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
            <Save className="h-4 w-4" />
            {submitting ? 'Saving...' : 'Add Student'}
          </button>
        </div>
      </form>
    </div>
  );
}
