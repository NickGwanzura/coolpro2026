'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { adminCreateSupplier } from '@/lib/api';
import { ZIMBABWE_PROVINCES } from '@/constants/registry';
import { SupplierSurveyFields, isSupplierSurveyComplete } from '@/components/supplier/SupplierSurveyFields';
import type { SupplierRegistration, SupplierSurveyData } from '@/types/index';

const SUPPLIER_TYPES: Array<SupplierRegistration['supplierType']> = [
  'importer',
  'wholesaler',
  'distributor',
  'manufacturer',
  'service-partner',
];

export default function AddSupplierPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    tradingName: '',
    supplierType: 'distributor' as SupplierRegistration['supplierType'],
    contactName: '',
    email: '',
    phone: '',
    province: '',
    city: '',
    address: '',
    taxNumber: '',
    website: '',
    notes: '',
  });
  const [surveyData, setSurveyData] = useState<SupplierSurveyData>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.companyName || !formData.contactName || !formData.email || !formData.phone) {
      error('Please fill in all required fields.');
      return;
    }
    if (!formData.province || !formData.city || !formData.address) {
      error('Please complete province, city, and address.');
      return;
    }
    if (!isSupplierSurveyComplete(surveyData)) {
      error('Please complete every Sector Survey question — it is required for every supplier added.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await adminCreateSupplier({
        ...formData,
        refrigerantsSupplied: [],
        surveyData,
      });
      success(`${formData.companyName} has been added (${created.registrationNumber}) and sent an activation link.`);
      router.push('/suppliers');
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to add supplier.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProvince = ZIMBABWE_PROVINCES.find((p) => p.name === formData.province);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/suppliers')}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Supplier</h1>
          <p className="text-gray-500 mt-1">Register an approved supplier directly. A secure activation link will be emailed to them.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input type="text" name="companyName" required className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent" value={formData.companyName} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trading Name</label>
              <input type="text" name="tradingName" className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent" value={formData.tradingName} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Type *</label>
              <select name="supplierType" required className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent" value={formData.supplierType} onChange={handleChange}>
                {SUPPLIER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Number</label>
              <input type="text" name="taxNumber" className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent" value={formData.taxNumber} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input type="text" name="website" className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent" value={formData.website} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact & Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
              <input type="text" name="contactName" required className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent" value={formData.contactName} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" name="email" required className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent" value={formData.email} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input type="tel" name="phone" required className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent" value={formData.phone} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Province *</label>
              <select
                name="province"
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                value={formData.province}
                onChange={(e) => setFormData((prev) => ({ ...prev, province: e.target.value, city: '' }))}
              >
                <option value="">Select province</option>
                {ZIMBABWE_PROVINCES.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <select name="city" required className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent" value={formData.city} onChange={handleChange} disabled={!selectedProvince}>
                <option value="">Select city</option>
                {selectedProvince?.districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
              <input type="text" name="address" required className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent" value={formData.address} onChange={handleChange} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea name="notes" rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent" value={formData.notes} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <SupplierSurveyFields value={surveyData} onChange={setSurveyData} required />
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => router.push('/suppliers')} className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="px-6 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
            <Save className="h-4 w-4" />
            {submitting ? 'Saving...' : 'Add Supplier'}
          </button>
        </div>
      </form>
    </div>
  );
}
