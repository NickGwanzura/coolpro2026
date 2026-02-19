'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ShieldCheck, Users, MapPin, Clock, CheckCircle, ArrowRight, Menu, X, ChevronRight } from 'lucide-react';
import { getSession } from '@/lib/auth';

export default function LandingPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    setSession(getSession());
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearching(true);
      // Simulate search delay
      setTimeout(() => {
        setSearching(false);
        router.push(`/technician-registry?search=${encodeURIComponent(searchTerm.trim())}`);
      }, 1000);
    }
  };

  const handleQuickSearch = (category: string) => {
    router.push(`/technician-registry?specialization=${encodeURIComponent(category)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center cursor-pointer" onClick={() => router.push('/')}>
              <div className="bg-blue-600 p-2 rounded-lg">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">TechReg Zimbabwe</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors">How It Works</a>
              <a href="#search" className="text-gray-600 hover:text-blue-600 transition-colors">Search</a>
              {session ? (
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Dashboard
                </button>
              ) : (
                <button 
                  onClick={() => router.push('/login')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Login
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600 hover:text-gray-900"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
              <a href="#features" className="block text-gray-600 hover:text-blue-600 transition-colors">Features</a>
              <a href="#how-it-works" className="block text-gray-600 hover:text-blue-600 transition-colors">How It Works</a>
              <a href="#search" className="block text-gray-600 hover:text-blue-600 transition-colors">Search</a>
              {session ? (
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Dashboard
                </button>
              ) : (
                <button 
                  onClick={() => router.push('/login')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      <main>
        {/* Hero Section */}
        <section className="pt-24 pb-16 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                  Verified Technicians<br />at Your Fingertips
                </h1>
                <p className="text-xl mb-8 text-blue-100">
                  Zimbabwe's national technician registry. Search, verify, and connect with certified professionals across all provinces.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => router.push('/technician-registry')}
                    className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                  >
                    Search Technicians <ArrowRight className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => router.push(session ? '/dashboard' : '/login')}
                    className="px-8 py-3 bg-blue-800 text-white font-semibold rounded-xl hover:bg-blue-900 transition-colors"
                  >
                    {session ? 'My Dashboard' : 'Register Now'}
                  </button>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-blue-500 rounded-2xl blur-2xl opacity-50"></div>
                <div className="relative bg-white rounded-2xl p-8 shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <ShieldCheck className="h-8 w-8 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-900">Trusted Verification</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">National ID verification</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">Professional certifications</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">Province and district mapping</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">Up-to-date registration status</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section id="search" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Find a Technician</h2>
              <p className="text-lg text-gray-600">Quick search by name, registration number, or specialization</p>
            </div>

            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name, national ID, registration number, or specialization..."
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={searching}
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="absolute inset-y-0 right-2 flex items-center px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </form>

              {/* Quick Search Categories */}
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'Electrical', specialization: 'Electrical' },
                  { name: 'Solar Installation', specialization: 'Solar Installation' },
                  { name: 'Refrigeration', specialization: 'Refrigeration & Air Conditioning' },
                  { name: 'Plumbing', specialization: 'Plumbing' }
                ].map((category) => (
                  <button
                    key={category.name}
                    onClick={() => handleQuickSearch(category.specialization)}
                    className="px-4 py-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="text-sm font-medium text-gray-700">{category.name}</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose TechReg?</h2>
              <p className="text-lg text-gray-600">A comprehensive registry for all your technician needs</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-blue-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Verified Profiles</h3>
                <p className="text-gray-600">Every technician in our registry is verified with national ID and professional certifications.</p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-blue-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                  <MapPin className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Location Based</h3>
                <p className="text-gray-600">Find technicians in your province and district with detailed location information.</p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-blue-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                  <ShieldCheck className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Regulatory Compliance</h3>
                <p className="text-gray-600">All registered technicians comply with Zimbabwe's industry regulations and standards.</p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-blue-100 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Real-time Updates</h3>
                <p className="text-gray-600">Stay informed with up-to-date registration status and renewal reminders.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
              <p className="text-lg text-gray-600">Simple steps to register and verify technicians</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Register</h3>
                <p className="text-gray-600">Complete the registration form with personal details, national ID, and professional information.</p>
              </div>

              <div className="text-center">
                <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Verification</h3>
                <p className="text-gray-600">Submit your national ID for verification. Our system ensures each technician is uniquely identified.</p>
              </div>

              <div className="text-center">
                <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-2xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Access</h3>
                <p className="text-gray-600">Once approved, your profile becomes searchable by the public and other stakeholders.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-xl mb-8 text-blue-100">
              Join thousands of verified technicians and service providers across Zimbabwe
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => router.push(session ? '/dashboard' : '/login')}
                className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
              >
                {session ? 'Access Dashboard' : 'Create Account'}
              </button>
              <button 
                onClick={() => router.push('/technician-registry')}
                className="px-8 py-3 bg-blue-800 text-white font-semibold rounded-xl hover:bg-blue-900 transition-colors"
              >
                Search Technicians
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold">TechReg Zimbabwe</span>
              </div>
              <p className="text-gray-400 mb-4">The official national technician registry of Zimbabwe, promoting professionalism and trust in technical services.</p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Facebook</span>
                  <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">f</div>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">t</div>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">in</div>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#search" className="text-gray-400 hover:text-white transition-colors">Search Technicians</a></li>
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Registration</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Verification</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Renewal</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Harare, Zimbabwe</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 flex items-center justify-center">📧</span>
                  <span>info@techreg.gov.zw</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 flex items-center justify-center">📞</span>
                  <span>+263 242 700 000</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>&copy; 2024 TechReg Zimbabwe. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
