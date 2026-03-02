'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ShieldCheck, CheckCircle, AlertCircle, MapPin, Phone, Mail, Award, Calendar, ArrowLeft, User, Clock, Shield, Info, ExternalLink } from 'lucide-react';
import { MOCK_TECHNICIANS } from '@/constants/registry';

// Recent verification activity feed
const recentActivity = [
  { id: '1', name: 'Tendai M.', coc: 'COC #2847', time: '2 hours ago', verified: true },
  { id: '2', name: 'Sarah K.', coc: 'COC #1923', time: 'Yesterday', verified: true },
  { id: '3', name: 'Peter D.', coc: 'COC #3156', time: '2 days ago', verified: true },
  { id: '4', name: 'Chenai S.', coc: 'COC #2841', time: '3 days ago', verified: true },
  { id: '5', name: 'Farai K.', coc: 'COC #1928', time: '1 week ago', verified: true },
];

export default function VerifyTechnicianPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'id' | 'name'>('id');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setNotFound(false);

    // Simulate search delay
    setTimeout(() => {
      const query = searchQuery.toUpperCase().trim();
      let found = null;

      if (searchType === 'id') {
        found = MOCK_TECHNICIANS.find(
          tech => tech.registrationNumber.toUpperCase() === query
        );
      } else {
        found = MOCK_TECHNICIANS.find(
          tech => tech.name.toUpperCase().includes(query)
        );
      }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center cursor-pointer" 
              onClick={() => router.push('/')}
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-2.5 rounded-lg">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3">
                <span className="text-xl font-bold text-slate-900">HEVACRAZ</span>
                <p className="text-xs text-slate-500">Technician Verification Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowActivity(!showActivity)}
                className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
              >
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Recent Activity</span>
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex items-center text-slate-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Back</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Activity Sidebar */}
      {showActivity && (
        <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900">Real-time Activity</h3>
              <button onClick={() => setShowActivity(false)} className="text-slate-400 hover:text-slate-600">
                <AlertCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="bg-green-100 p-2 rounded-full">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{activity.name}</p>
                    <p className="text-xs text-slate-500">{activity.coc}</p>
                    <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-8 sm:py-12 md:py-16">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <ShieldCheck className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Verify Your Technician</h1>
          <p className="text-lg text-slate-600 mb-6 max-w-2xl mx-auto">
            Ensure you're working with a certified HEVACRAZ professional. 
            Search by registration ID or technician name.
          </p>
        </div>

        {/* Search Box - Enhanced */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-slate-900">VERIFY YOUR TECHNICIAN</span>
          </div>
          
          <form onSubmit={handleSearch}>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Type Toggle */}
              <div className="flex rounded-xl overflow-hidden border-2 border-slate-200">
                <button
                  type="button"
                  onClick={() => setSearchType('id')}
                  className={`px-4 py-3 text-sm font-medium transition-colors ${
                    searchType === 'id' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  By ID
                </button>
                <button
                  type="button"
                  onClick={() => setSearchType('name')}
                  className={`px-4 py-3 text-sm font-medium transition-colors ${
                    searchType === 'name' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  By Name
                </button>
              </div>
              
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchType === 'id' ? "Enter ID (e.g., ZIM/TECH/2023/001)" : "Enter Name (e.g., John Moyo)"}
                  className="w-full px-6 py-4 text-lg border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-4 px-8 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-orange-200"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {/* Demo Codes */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-500 mb-3">Demo Registration IDs:</p>
            <div className="flex flex-wrap gap-2">
              {demoCodes.slice(0, 6).map((code) => (
                <button
                  key={code}
                  onClick={() => {
                    setSearchQuery(code);
                    setSearchType('id');
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-lg transition-colors font-mono"
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
            <p className="text-slate-600">
              No technician found with {searchType === 'id' ? 'registration number' : 'name'} "<strong>{searchQuery}</strong>". 
              <br />Please check and try again.
            </p>
          </div>
        )}

        {/* Found Technician */}
        {searchResult && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-white/20 p-3 rounded-full">
                    <ShieldCheck className="h-8 w-8 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold text-white">{searchResult.name}</h3>
                    <p className="text-blue-100 font-mono">{searchResult.registrationNumber}</p>
                  </div>
                </div>
                <div className="flex items-center bg-green-500 px-4 py-2 rounded-full shadow-lg">
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
                  <h4 className="text-lg font-semibold text-slate-900 border-b pb-2">Personal Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-slate-400" />
                      <span className="text-slate-600">{searchResult.region}, Zimbabwe</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-slate-400" />
                      <span className="text-slate-600">{searchResult.certificationType || 'Advanced HVAC-R Technician'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-slate-400" />
                      <span className="text-slate-600">Certified since {searchResult.certificationDate || '2023'}</span>
                    </div>
                  </div>
                </div>

                {/* Verification Info */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-900 border-b pb-2">Verification Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-green-600" />
                      <span className="text-slate-600">SAZ Recognized Certification</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-slate-600">HEVACRAZ Verified Member</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-green-600" />
                      <span className="text-slate-600">COC Authorized</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Why Verification Matters - Consumer Trust Center */}
        <div className="mt-12 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white">
          <div className="flex items-center gap-3 mb-6">
            <Info className="h-6 w-6 text-orange-400" />
            <h2 className="text-2xl font-bold">Why Verification Matters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="bg-white/10 p-3 rounded-lg w-fit">
                <ShieldCheck className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="font-semibold">Consumer Protection</h3>
              <p className="text-slate-300 text-sm">
                Verify that your technician holds valid certifications and is authorized to work on HVAC-R systems in Zimbabwe.
              </p>
            </div>
            <div className="space-y-2">
              <div className="bg-white/10 p-3 rounded-lg w-fit">
                <Award className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="font-semibold">Quality Assurance</h3>
              <p className="text-slate-300 text-sm">
                HEVACRAZ certified technicians meet industry standards and follow safety protocols for all installations.
              </p>
            </div>
            <div className="space-y-2">
              <div className="bg-white/10 p-3 rounded-lg w-fit">
                <CheckCircle className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="font-semibold">Compliance Guaranteed</h3>
              <p className="text-slate-300 text-sm">
                Certified technicians ensure all work meets SAZ standards and government regulations.
              </p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white/20">
            <a href="#" className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 font-medium">
              Learn more about HEVACRAZ Certification <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Recent Verifications Section */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent verifications:</h3>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {recentActivity.map((activity, index) => (
              <div 
                key={activity.id} 
                className={`flex items-center justify-between p-4 ${index !== recentActivity.length - 1 ? 'border-b border-slate-100' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{activity.name}</p>
                    <p className="text-sm text-slate-500">{activity.coc}</p>
                  </div>
                </div>
                <span className="text-sm text-slate-400">Verified {activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm">
            © 2024 HEVACRAZ. All rights reserved. | 
            <a href="#" className="hover:text-white ml-2">Privacy Policy</a> | 
            <a href="#" className="hover:text-white ml-2">Terms of Service</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
