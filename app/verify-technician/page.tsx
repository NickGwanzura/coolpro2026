'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ShieldCheck, CheckCircle, AlertCircle, MapPin, Phone, Mail, Award, Calendar, ArrowLeft } from 'lucide-react';
import { MOCK_TECHNICIANS } from '@/constants/registry';

export default function VerifyTechnicianPage() {
  const router = useRouter();
  const [searchCode, setSearchCode] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    setIsSearching(true);
    setNotFound(false);

    // Simulate search delay
    setTimeout(() => {
      const code = searchCode.toUpperCase().trim();
      const found = MOCK_TECHNICIANS.find(
        tech => tech.registrationNumber.toUpperCase() === code
      );

      if (found) {
        setSearchResult(found);
        setNotFound(false);
      } else {
        setSearchResult(null);
        setNotFound(true);
      }
      setIsSearching(false);
    }, 500);
  };

  const demoCodes = MOCK_TECHNICIANS.map(t => t.registrationNumber);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center cursor-pointer" 
              onClick={() => router.push('/')}
            >
              <div className="bg-blue-600 p-2 rounded-lg">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold text-blue-900">HEVACRAZ</span>
            </div>
            <button
              onClick={() => router.push('/')}
              className="flex items-center text-gray-600 hover:text-blue-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-8 sm:py-12 md:py-16">
        {/* Search Section */}
        <div className="text-center mb-12">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-blue-900 mb-4">Verify a Technician</h1>
          <p className="text-xl text-gray-600 mb-8">
            Enter a technician's registration number to verify their certification status
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <form onSubmit={handleSearch}>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  placeholder="Enter Registration Number (e.g., ZIM/TECH/2023/001)"
                  className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-all disabled:opacity-50"
              >
                {isSearching ? 'Searching...' : 'Verify'}
              </button>
            </div>
          </form>

          {/* Demo Codes */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-3">Demo Registration Numbers:</p>
            <div className="flex flex-wrap gap-2">
              {demoCodes.map((code) => (
                <button
                  key={code}
                  onClick={() => setSearchCode(code)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Not Found Message */}
        {notFound && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-red-800 mb-2">Technician Not Found</h3>
            <p className="text-gray-600">
              No technician found with registration number "<strong>{searchCode}</strong>". 
              Please check the number and try again.
            </p>
          </div>
        )}

        {/* Found Technician */}
        {searchResult && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-white/20 p-3 rounded-full">
                    <ShieldCheck className="h-8 w-8 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold text-white">{searchResult.name}</h3>
                    <p className="text-blue-100">{searchResult.registrationNumber}</p>
                  </div>
                </div>
                <div className="flex items-center bg-green-500 px-4 py-2 rounded-full">
                  <CheckCircle className="h-5 w-5 text-white mr-2" />
                  <span className="text-white font-semibold">Verified</span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Info */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h4>
                  
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-5 w-5 mr-3 text-gray-400" />
                    <span>{searchResult.region}, {searchResult.province}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-5 w-5 mr-3 text-gray-400" />
                    <span>{searchResult.contactNumber}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-5 w-5 mr-3 text-gray-400" />
                    <span>{searchResult.email}</span>
                  </div>
                </div>

                {/* Professional Info */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Professional Details</h4>
                  
                  <div className="flex items-center text-gray-600">
                    <Award className="h-5 w-5 mr-3 text-gray-400" />
                    <span>{searchResult.specialization}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <ShieldCheck className="h-5 w-5 mr-3 text-gray-400" />
                    <span>Status: <span className="text-green-600 font-semibold capitalize">{searchResult.status}</span></span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-5 w-5 mr-3 text-gray-400" />
                    <span>Registered: {searchResult.registrationDate}</span>
                  </div>
                </div>
              </div>

              {/* Certifications */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Certifications</h4>
                <div className="space-y-3">
                  {searchResult.certifications?.map((cert: any) => (
                    <div key={cert.id} className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{cert.name}</p>
                        <p className="text-sm text-gray-500">{cert.issuingBody} • {cert.dateIssued}</p>
                      </div>
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span className="text-sm font-medium">Valid</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Note */}
              <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
                <p>This verification is provided by HEVACRAZ - Heating Energy Ventilation Air Conditioning and Refrigeration Association of Zimbabwe</p>
                <p className="mt-1">Verified on {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
