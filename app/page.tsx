'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Users, BookOpen, Search, MapPin, Clock, CheckCircle, ArrowRight, Menu, X } from 'lucide-react';

export default function HEVACRAZ_LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '#about' },
    { name: 'Technician Portal', href: '#technician' },
    { name: 'Membership', href: '#membership' },
    { name: 'Training & Certification', href: '#training' },
    { name: 'Technician Registry', href: '#registry' },
    { name: 'Contact', href: '#contact' },
  ];

  const services = [
    {
      icon: <ShieldCheck className="h-8 w-8 text-blue-600" />,
      title: 'Certification',
      description: 'Industry-recognized certifications for HVAC-R professionals ensuring compliance with Zimbabwean standards.',
    },
    {
      icon: <BookOpen className="h-8 w-8 text-blue-600" />,
      title: 'Training Programs',
      description: 'Comprehensive training courses designed to enhance technical skills and professional development.',
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-blue-600" />,
      title: 'Industry Standards',
      description: 'Establishing and promoting best practices and safety standards for the HVAC-R industry.',
    },
    {
      icon: <Search className="h-8 w-8 text-blue-600" />,
      title: 'Technician Registry',
      description: 'Verified database of certified HVAC-R technicians for consumer and business verification.',
    },
  ];

  const membershipBenefits = [
    'Industry recognition and credibility',
    'Access to exclusive training programs',
    'Networking opportunities with peers',
    'Technical support and resources',
    'Listing in the national technician registry',
    'Advocacy and representation',
  ];

  const technicianFeatures = [
    {
      icon: <ShieldCheck className="h-8 w-8 text-blue-600" />,
      title: 'COC Certifications',
      description: 'Request and manage Certificates of Conformity for installed systems.',
    },
    {
      icon: <BookOpen className="h-8 w-8 text-blue-600" />,
      title: 'Sizing Tool',
      description: 'Calculate cooling capacity requirements for cold rooms and freezers.',
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-blue-600" />,
      title: 'Job Logging',
      description: 'Log installations, maintenance, and repairs with full documentation.',
    },
    {
      icon: <Users className="h-8 w-8 text-blue-600" />,
      title: 'Technician Registry',
      description: 'Manage your profile and verify your certification status.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav 
        className={`fixed w-full z-50 transition-all duration-300 ${
          scrolled ? 'bg-white shadow-md py-3' : 'bg-white shadow-sm py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center cursor-pointer" onClick={() => router.push('/')}>
              <div className="bg-blue-600 p-3 rounded-lg">
                <ShieldCheck className="h-7 w-7 text-white" />
              </div>
              <span className="ml-4 text-2xl font-bold text-blue-900">HEVACRAZ</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6 ml-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-gray-700 hover:text-blue-600 transition-colors font-medium text-sm"
                >
                  {link.name}
                </a>
              ))}
              <a
                href="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md text-sm inline-block"
              >
                Login
              </a>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                {mobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6 space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="block text-gray-700 hover:text-blue-600 transition-colors font-medium py-3 text-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push('/login');
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-28 sm:pt-32 md:pt-40 pb-16 sm:pb-20 md:pb-28 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-12">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-blue-900 mb-6 sm:mb-8 leading-tight">
              Promoting Excellence in Zimbabwe's HVAC-R Industry
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-10 md:mb-12 leading-relaxed px-2 sm:px-0">
              The Heating Energy Ventilation Air Conditioning and Refrigeration Association of Zimbabwe (HEVACRAZ) 
              is dedicated to promoting professional standards, certification, and regulation in the HVAC-R sector.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center px-2 sm:px-0">
              <button 
                onClick={() => router.push('/#membership')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-10 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
              >
                Become a Member
              </button>
              <button 
                onClick={() => router.push('/verify-technician')}
                className="bg-white hover:bg-gray-50 text-blue-600 font-semibold py-4 px-10 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-blue-200 text-lg"
              >
                Verify a Technician
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-blue-900 mb-6">About HEVACRAZ</h2>
              <div className="w-24 h-1.5 bg-blue-600 mx-auto rounded-full"></div>
            </div>
            <p className="text-gray-700 text-xl leading-relaxed mb-6">
              The Heating Energy Ventilation Air Conditioning and Refrigeration Association of Zimbabwe (HEVACRAZ) 
              is the national industry association representing professionals in the HVAC-R sector. Established to 
              promote excellence and standardization, HEVACRAZ plays a crucial role in regulating the industry, 
              providing certification, and ensuring compliance with national and international standards.
            </p>
            <p className="text-gray-700 text-xl leading-relaxed">
              Our mission is to advance the HVAC-R profession in Zimbabwe through education, certification, 
              and advocacy, ensuring that consumers receive high-quality, safe, and reliable services from 
              trained and certified professionals.
            </p>
          </div>
        </div>
      </section>

      {/* Technician Portal Section */}
      <section id="technician" className="py-28 bg-gradient-to-br from-blue-900 to-blue-800">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">Technician Portal</h2>
            <p className="text-blue-100 text-xl max-w-3xl mx-auto">
              Access all the tools you need as a certified HVAC-R professional in Zimbabwe.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {technicianFeatures.map((feature, index) => (
              <div 
                key={index}
                className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl hover:bg-white/20 transition-all duration-300 border border-white/20 cursor-pointer group"
                onClick={() => router.push('/login')}
              >
                <div className="bg-white/20 p-4 rounded-xl inline-block mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-200 transition-colors">{feature.title}</h3>
                <p className="text-blue-100 leading-relaxed text-lg">{feature.description}</p>
                <div className="mt-6 flex items-center text-blue-200 group-hover:text-white transition-colors">
                  <span className="font-semibold">Click to access</span>
                  <ArrowRight className="h-5 w-5 ml-2" />
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <button 
              onClick={() => router.push('/login')}
              className="bg-white hover:bg-blue-50 text-blue-900 font-semibold py-4 px-10 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
            >
              Login to Technician Portal
            </button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-blue-900 mb-6">Our Services</h2>
            <div className="w-24 h-1.5 bg-blue-600 mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {services.map((service, index) => (
              <div 
                key={index}
                className="bg-white p-10 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-blue-100"
              >
                <div className="bg-blue-50 p-5 rounded-xl inline-block mb-8">
                  {service.icon}
                </div>
                <h3 className="text-2xl font-bold text-blue-900 mb-4">{service.title}</h3>
                <p className="text-gray-600 leading-relaxed text-lg">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Membership Benefits Section */}
      <section id="membership" className="py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl font-bold text-blue-900 mb-8">Membership Benefits</h2>
              <div className="w-24 h-1.5 bg-blue-600 mb-10 rounded-full"></div>
              <ul className="space-y-6">
                {membershipBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start space-x-4">
                    <CheckCircle className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
                    <span className="text-gray-700 text-xl">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-12 rounded-3xl">
              <div className="text-center">
                <Users className="h-20 w-20 text-blue-600 mx-auto mb-8" />
                <h3 className="text-3xl font-bold text-blue-900 mb-6">Join Our Community</h3>
                <p className="text-gray-600 mb-10 text-lg">
                  Become part of the premier HVAC-R professional community in Zimbabwe and take your career to new heights.
                </p>
                <button 
                  onClick={() => router.push('/#contact')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-10 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Get Involved?</h2>
          <p className="text-blue-100 text-xl mb-10">
            Join HEVACRAZ today and be part of the solution to elevate Zimbabwe's HVAC-R industry.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
              onClick={() => router.push('/#membership')}
              className="bg-white hover:bg-gray-50 text-blue-600 font-semibold py-4 px-10 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-lg"
            >
              Become a Member
            </button>
            <button 
              onClick={() => router.push('/#contact')}
              className="bg-transparent hover:bg-blue-800 text-white font-semibold py-4 px-10 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg border border-white text-lg"
            >
              Contact Us
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center mb-6">
                <div className="bg-blue-600 p-3 rounded-lg">
                  <ShieldCheck className="h-7 w-7 text-white" />
                </div>
                <span className="ml-4 text-2xl font-bold">HEVACRAZ</span>
              </div>
              <p className="text-blue-200 mb-6 text-lg">
                Promoting excellence in Zimbabwe's HVAC-R industry through certification, training, and regulation.
              </p>
            </div>
            
            <div>
              <h4 className="text-xl font-semibold mb-6">Quick Links</h4>
              <ul className="space-y-3">
                {navLinks.slice(1).map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-blue-200 hover:text-white transition-colors text-lg">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-xl font-semibold mb-6">Contact Us</h4>
              <address className="text-blue-200 not-italic text-lg">
                <p className="flex items-center space-x-2 mb-3">
                  <MapPin className="h-5 w-5" />
                  <span>Harare, Zimbabwe</span>
                </p>
                <p className="mb-3">Email: info@hevacraz.org.zw</p>
                <p className="mb-3">Phone: +263 24 7000 000</p>
              </address>
            </div>
            
            <div>
              <h4 className="text-xl font-semibold mb-6">Follow Us</h4>
              <div className="flex space-x-5">
                <a href="#" className="text-blue-200 hover:text-white transition-colors">
                  <span className="sr-only">Facebook</span>
                  <div className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center">
                    <span className="text-base">F</span>
                  </div>
                </a>
                <a href="#" className="text-blue-200 hover:text-white transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <div className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center">
                    <span className="text-base">L</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-blue-800 mt-12 pt-12 text-center text-blue-200">
            <p className="text-lg">&copy; {new Date().getFullYear()} Heating Energy Ventilation Air Conditioning and Refrigeration Association of Zimbabwe (HEVACRAZ). All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
