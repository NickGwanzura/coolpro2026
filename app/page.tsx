'use client';

import { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Users, BookOpen, Search, MapPin, Clock, CheckCircle, ArrowRight, Menu, X, Award, Wrench, FileCheck, User, Facebook, Linkedin, Mail, ChevronDown, Calculator, ClipboardList, GraduationCap, Building2, Scale, Gift, Sparkles } from 'lucide-react';
import { MOCK_TRAINING_SESSIONS } from '@/constants/training';
import { STORAGE_KEYS } from '@/lib/platformStore';
import type { TrainingSession } from '@/types/index';

export default function HEVACRAZ_LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [upcomingReferenceTime] = useState(() => Date.now());
  const storedTrainingSessions = useSyncExternalStore(
    () => () => undefined,
    () => {
      if (typeof window === 'undefined') return MOCK_TRAINING_SESSIONS;
      const raw = window.localStorage.getItem(STORAGE_KEYS.trainingSessions);
      if (!raw) return MOCK_TRAINING_SESSIONS;

      try {
        return JSON.parse(raw) as TrainingSession[];
      } catch {
        return MOCK_TRAINING_SESSIONS;
      }
    },
    () => MOCK_TRAINING_SESSIONS
  );

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const scrollToSection = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setMobileMenuOpen(false);
  };
  const upcomingTrainingSessions = useMemo(
    () =>
      [...storedTrainingSessions]
        .filter(session => new Date(session.startDate).getTime() >= upcomingReferenceTime)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, 3),
    [storedTrainingSessions, upcomingReferenceTime]
  );

  const navLinks = [
    { 
      name: 'For Technicians', 
      href: '#',
      hasDropdown: true,
      dropdown: [
        { name: 'COC Requests', href: '/jobs/request-coc', icon: <FileCheck className="w-4 h-4" /> },
        { name: 'Sizing Calculator', href: '/sizing-tool', icon: <Calculator className="w-4 h-4" /> },
        { name: 'Job Logging', href: '/jobs', icon: <ClipboardList className="w-4 h-4" /> },
        { name: 'Training & LMS', href: '/learn', icon: <GraduationCap className="w-4 h-4" /> },
        { name: 'Technician Registry', href: '/technician-registry', icon: <Users className="w-4 h-4" /> },
      ]
    },
    { 
      name: 'For Businesses', 
      href: '#',
      hasDropdown: true,
        dropdown: [
          { name: 'Enterprise Solutions', href: '#', icon: <Building2 className="w-4 h-4" /> },
          { name: 'Register as Supplier', href: '/supplier-register', icon: <Building2 className="w-4 h-4" /> },
          { name: 'NOU Compliance', href: '/nou-dashboard', icon: <Scale className="w-4 h-4" /> },
        ]
      },
    { name: 'About', href: '#about' },
    { name: 'Contact', href: '#contact' },
  ];

  const benefits = [
    {
      icon: <Award className="h-8 w-8" />,
      title: 'Industry Certification',
      description: 'Get recognized credentials that meet Zimbabwean and international standards',
    },
    {
      icon: <Wrench className="h-8 w-8" />,
      title: 'Exclusive Tools',
      description: 'Access COC request system, sizing calculators, and job logging tools',
    },
    {
      icon: <User className="h-8 w-8" />,
      title: 'Public Registry',
      description: 'Get listed in our verified technician database for client discovery',
    },
  ];

  const portalFeatures = [
    {
      icon: <FileCheck className="h-8 w-8" />,
      title: 'COC Certifications',
      description: 'Request and manage Certificates of Conformity for installations',
      href: '/jobs/request-coc',
    },
    {
      icon: <Search className="h-8 w-8" />,
      title: 'Sizing Calculator',
      description: 'Calculate cooling capacity for cold rooms and freezers instantly',
      href: '/sizing-tool',
    },
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: 'Job Logging',
      description: 'Document installations, maintenance, and repairs with full compliance tracking',
      href: '/field-toolkit',
    },
    {
      icon: <ClipboardList className="h-8 w-8" />,
      title: 'Field Checklists',
      description: 'Installation and regassing verification checklists with sources',
      href: '/field-toolkit',
    },
    {
      icon: <User className="h-8 w-8" />,
      title: 'Profile Management',
      description: 'Update your registry listing and verify your certification status',
      href: '/dashboard',
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: 'Certifications',
      description: 'View and manage your HVAC-R certifications and renewals',
      href: '/certifications',
    },
    {
      icon: <Gift className="h-8 w-8" />,
      title: 'Rewards Program',
      description: 'Earn points for compliant work and redeem for tools and training',
      href: '/rewards',
    },
    {
      icon: <ShieldCheck className="h-8 w-8" />,
      title: 'Verify Technicians',
      description: 'Check if a technician is certified and verified by HEVACRAZ',
      href: '/verify-technician',
    },
    {
      icon: <GraduationCap className="h-8 w-8" />,
      title: 'Training & LMS',
      description: 'Access training modules and continuing education resources',
      href: '/learn',
    },
  ];

  const testimonials = [
    {
      quote: 'I went from informal repairs to certified COC issuer in 6 months. Now I train three apprentices.',
      name: 'Tendai M.',
      company: 'Cold Solutions Harare',
      location: 'Harare',
      memberSince: '2021',
      cocIssued: 47,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    },
    {
      quote: 'The registry gave me credibility I never had. My business grew 300% in year one.',
      name: 'Chenai S.',
      company: 'CoolTech Zimbabwe',
      location: 'Bulawayo',
      memberSince: '2020',
      cocIssued: 156,
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face',
    },
    {
      quote: 'HEVACRAZ training helped me win government contracts. The certification is worth every penny.',
      name: 'Farai K.',
      company: 'Industrial Cooling Systems',
      location: 'Mutare',
      memberSince: '2019',
      cocIssued: 203,
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
    },
  ];

  const pricingTiers = [
    {
      name: 'Free',
      price: '$0',
      description: 'Basic registry listing',
      features: [
        'Registry listing',
        'Basic profile',
        'Directory access',
      ],
      cta: 'Join Free',
      highlighted: false,
    },
    {
      name: 'Professional',
      price: '$50/year',
      description: 'All tools and certifications',
      features: [
        'Full registry listing',
        'All portal tools',
        'COC access',
        'Job logging',
        'Priority support',
        'Training discounts',
      ],
      cta: 'Get Started',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For businesses and teams',
      features: [
        'Bulk certifications',
        'Team management',
        'Training discounts',
        'Priority support',
        'Custom reporting',
        'API access',
      ],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ];

  const faqs = [
    {
      question: 'How do I become a certified HEVACRAZ member?',
      answer: 'To become a certified member, simply register on our platform, submit your qualifications, and complete our verification process. Once approved, you\'ll receive your certification and access to all member tools.',
    },
    {
      question: 'What is a COC and when do I need one?',
      answer: 'A Certificate of Conformity (COC) is a mandatory document that verifies your HVAC-R installation meets Zimbabwean safety and quality standards. It\'s required for all new installations, modifications, and certain maintenance work.',
    },
    {
      question: 'How can businesses verify technician credentials?',
      answer: 'Businesses can use our public Technician Registry to search and verify any HEVACRAZ certified professional. Each listing shows verification status, certification level, and customer reviews.',
    },
    {
      question: 'What training programs do you offer?',
      answer: 'We offer a range of training programs including installation certification, safety compliance, equipment sizing, and advanced refrigeration. Members receive discounts on all training courses.',
    },
    {
      question: 'How does the technician registry help me find clients?',
      answer: 'Our public registry is searchable by potential clients seeking verified HVAC-R professionals. Having a complete profile with certifications and reviews significantly increases your visibility and credibility.',
    },
  ];

  // Custom color classes
  const colors = {
    primary: '#2C2420', // Rich charcoal
    secondary: '#D4A574', // Warm terracotta
    accent: '#5A7D5A', // Sage green
    highlight: '#FF6B35', // Electric orange (CTAs only)
    background: '#FDF8F3', // Warm off-white
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Navigation - Sticky */}
      <nav 
        className={`fixed w-full z-50 transition-all duration-300 ${
          scrolled ? 'bg-white shadow-md py-3' : 'bg-white shadow-sm py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center cursor-pointer" onClick={() => router.push('/')}>
              <ShieldCheck className="h-8 w-8" style={{ color: colors.primary }} />
              <div className="ml-3">
                <span className="text-xl font-bold" style={{ color: colors.primary }}>HEVACRAZ</span>
                <p className="text-xs text-gray-500">HVAC-R Professionals Zimbabwe</p>
              </div>
            </div>

            {/* Desktop Navigation - Center with Dropdowns */}
            <div className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => (
                <div key={link.name} className="relative">
                  {link.hasDropdown ? (
                    <>
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === link.name ? null : link.name)}
                        onMouseEnter={() => link.hasDropdown && setActiveDropdown(link.name)}
                        className="flex items-center gap-1 font-medium text-sm px-3 py-2 rounded-lg transition-colors hover:bg-gray-100"
                        style={{ color: colors.primary }}
                      >
                        {link.name}
                        <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === link.name ? 'rotate-180' : ''}`} />
                      </button>
                      {/* Dropdown Menu */}
                      {activeDropdown === link.name && link.dropdown && (
                        <div 
                          className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                          onMouseLeave={() => setActiveDropdown(null)}
                        >
                          {link.dropdown.map((item) => (
                            <button
                              key={item.name}
                              onClick={() => {
                                if (item.href.startsWith('/')) {
                                  router.push(item.href);
                                } else {
                                  scrollToSection(item.href);
                                }
                                setActiveDropdown(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <span className="p-2 rounded-lg bg-gray-100" style={{ color: colors.highlight }}>
                                {item.icon}
                              </span>
                              {item.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <button
                      key={link.name}
                      onClick={() => scrollToSection(link.href)}
                      className="font-medium text-sm px-3 py-2 rounded-lg transition-colors hover:bg-gray-100"
                      style={{ color: colors.primary }}
                    >
                      {link.name}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Right CTAs */}
            <div className="hidden lg:flex items-center space-x-4">
              <button
                onClick={() => router.push('/login')}
                className="font-medium text-sm transition-colors hover:opacity-80 px-3 py-2"
                style={{ color: colors.primary }}
              >
                Member Login →
              </button>
              
              {/* Search Button */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: colors.primary }}
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push('/login')}
                className="font-semibold py-2 px-5 rounded-lg transition-all duration-300 text-sm text-white"
                style={{ backgroundColor: colors.highlight }}
              >
                Join Now →
              </button>
              <button
                onClick={() => router.push('/supplier-register')}
                className="font-semibold py-2 px-5 rounded-lg transition-all duration-300 text-sm border"
                style={{ borderColor: colors.secondary, color: colors.primary, backgroundColor: 'white' }}
              >
                Register as Supplier
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 transition-colors"
                style={{ color: colors.primary }}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Search Overlay */}
        {searchOpen && (
          <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-100 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search technicians, services, COCs..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => scrollToSection(link.href)}
                  className="block font-medium py-2 text-lg w-full text-left transition-colors"
                  style={{ color: colors.primary }}
                >
                  {link.name}
                </button>
              ))}
              <hr className="my-2 border-gray-200" />
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  router.push('/login');
                }}
                className="block font-medium py-2 text-lg w-full text-left"
                style={{ color: colors.primary }}
              >
                Member Login
              </button>
              <button
                onClick={() => router.push('/login')}
                className="w-full font-semibold py-3 px-5 rounded-lg transition-all duration-300 text-white"
                style={{ backgroundColor: colors.highlight }}
              >
                Join HEVACRAZ
              </button>
              <button
                onClick={() => router.push('/supplier-register')}
                className="w-full font-semibold py-3 px-5 rounded-lg transition-all duration-300 border mt-2"
                style={{ borderColor: colors.secondary, color: colors.primary, backgroundColor: 'white' }}
              >
                Register as Supplier
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section - Cinematic Documentary Style */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Full-bleed Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1920&h=1080&fit=crop" 
            alt="Zimbabwean HVAC technician at work"
            className="w-full h-full object-cover"
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40"></div>
          {/* Subtle pattern overlay for premium feel */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="max-w-4xl">
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <p className="text-orange-400 font-medium text-sm" style={{ fontFamily: 'Google Sans, sans-serif' }}>
                Since 2018 • 500+ Certified Technicians
              </p>
            </div>
            
            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-10 leading-tight" style={{ fontFamily: 'Google Sans, sans-serif' }}>
              The Future of HVAC-R in Zimbabwe
            </h1>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-5">
              <button 
                onClick={() => router.push('/login')}
                className="font-semibold py-5 px-10 rounded-lg transition-all duration-300 text-xl shadow-lg hover:shadow-xl text-white"
                style={{ backgroundColor: colors.highlight }}
              >
                Explore the Community →
              </button>
              <button 
                onClick={() => router.push('/supplier-register')}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border-2 border-white text-white font-semibold py-5 px-10 rounded-lg transition-all duration-300 text-xl"
              >
                Register as Supplier
              </button>
              <button 
                onClick={() => router.push('/verify-technician')}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border-2 border-white text-white font-semibold py-5 px-10 rounded-lg transition-all duration-300 text-xl"
              >
                Verify a Technician
              </button>
            </div>
          </div>
        </div>

        {/* Trust indicators at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-white/80">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-orange-400" /> SAZ Recognized
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-orange-400" /> Government Compliant
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-orange-400" /> Industry Leading
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section - 3 Column Grid */}
      <section id="about" className="py-20" style={{ backgroundColor: colors.background }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: colors.primary }}>Everything You Need to Advance</h2>
            <div className="w-24 h-1 mx-auto rounded-full" style={{ backgroundColor: colors.highlight }}></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border"
                style={{ backgroundColor: 'white', borderColor: '#E5E0DB' }}
              >
                <div className="p-4 rounded-xl inline-block mb-6" style={{ backgroundColor: '#F5EDE5' }}>
                  <span style={{ color: colors.accent }}>{benefit.icon}</span>
                </div>
                <h3 className="text-xl font-bold mb-4" style={{ color: colors.primary }}>{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audience Section - Two Cards */}
      <section className="py-20" style={{ backgroundColor: '#F5EDE5' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* For Technicians */}
            <div className="p-8 rounded-2xl border" style={{ backgroundColor: 'white', borderColor: colors.secondary }}>
              <Users className="h-12 w-12 mb-6" style={{ color: colors.primary }} />
              <h3 className="text-2xl font-bold mb-4" style={{ color: colors.primary }}>For Technicians</h3>
              <p className="text-gray-600 mb-6 text-lg">Advance your career with certification, tools, and client connections</p>
              <button 
                onClick={() => router.push('/login')}
                className="font-semibold py-3 px-6 rounded-lg transition-all duration-300 text-white"
                style={{ backgroundColor: colors.primary }}
              >
                Get Certified
              </button>
            </div>
            {/* For Businesses */}
            <div className="p-8 rounded-2xl border" style={{ backgroundColor: 'white', borderColor: colors.accent }}>
              <Search className="h-12 w-12 mb-6" style={{ color: colors.accent }} />
              <h3 className="text-2xl font-bold mb-4" style={{ color: colors.primary }}>For Businesses</h3>
              <p className="text-gray-600 mb-6 text-lg">Find verified, certified HVAC-R professionals for your projects</p>
              <button 
                onClick={() => router.push('/verify-technician')}
                className="font-semibold py-3 px-6 rounded-lg transition-all duration-300 text-white"
                style={{ backgroundColor: colors.accent }}
              >
                Search Registry
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Technician Portal Features - 2x2 Grid */}
      <section id="portal" className="py-20 text-white" style={{ backgroundColor: colors.primary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Powerful Tools for Certified Members</h2>
            <div className="w-24 h-1 mx-auto rounded-full" style={{ backgroundColor: colors.highlight }}></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {portalFeatures.map((feature, index) => (
              <div 
                key={index}
                className="p-6 rounded-xl transition-all duration-300 border border-white/10 cursor-pointer hover:bg-white/10"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                onClick={() => router.push(feature.href || '/login')}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg flex-shrink-0 text-white" style={{ backgroundColor: colors.highlight }}>
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Member Spotlights */}
      <section className="py-20" style={{ backgroundColor: '#F5EDE5' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em]" style={{ color: colors.accent }}>
                Upcoming Trainings
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold mt-2" style={{ color: colors.primary }}>
                Public Training Calendar
              </h2>
              <p className="mt-3 max-w-3xl text-gray-600">
                Trainers can schedule sessions with venue and fees, and this public calendar updates automatically.
                Online payment will be wired in later, so reservations stay mocked for now.
              </p>
            </div>
            <button
              onClick={() => router.push('/learn')}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: colors.primary }}
            >
              View Training Center
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {upcomingTrainingSessions.map((session) => (
              <div
                key={session.id}
                className="rounded-2xl border bg-white p-6 shadow-sm"
                style={{ borderColor: '#E5E0DB' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                      {new Intl.DateTimeFormat('en-ZW', { month: 'short', day: 'numeric' }).format(new Date(session.startDate))}
                    </p>
                    <h3 className="mt-2 text-xl font-bold" style={{ color: colors.primary }}>{session.title}</h3>
                  </div>
                  <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: colors.highlight }}>
                    ${session.feeUsd}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-gray-600">{session.summary}</p>
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {session.venue}, {session.province}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(session.startDate))}
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {session.seatsRemaining} seats left
                  </p>
                </div>
                <button
                  onClick={() => router.push('/login')}
                  className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-white"
                  style={{ backgroundColor: colors.highlight }}
                >
                  Reserve Seat (Mock)
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Member Spotlights */}
      <section className="py-20" style={{ backgroundColor: colors.background }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: colors.primary }}>Member Success Stories</h2>
            <div className="w-24 h-1 mx-auto rounded-full" style={{ backgroundColor: colors.highlight }}></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {testimonials.map((member, index) => (
              <div 
                key={index}
                className="bg-white rounded-2xl shadow-lg border overflow-hidden"
                style={{ borderColor: '#E5E0DB' }}
              >
                {/* Portrait */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="font-bold text-lg">{member.name}</p>
                    <p className="text-sm text-white/80">{member.company}</p>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-6">
                  <p className="text-gray-600 mb-6 leading-relaxed italic">&ldquo;{member.quote}&rdquo;</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400">Member since</p>
                      <p className="font-semibold" style={{ color: colors.primary }}>{member.memberSince}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">COCs issued</p>
                      <p className="font-bold text-lg" style={{ color: colors.highlight }}>{member.cocIssued}</p>
                    </div>
                  </div>
                  
                  <button className="mt-4 w-full text-center text-sm font-medium" style={{ color: colors.accent }}>
                    View {member.name.split(' ')[0]}&rsquo;s Registry Profile →
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* Stats Bar */}
          <div className="rounded-2xl py-8 px-6" style={{ backgroundColor: colors.primary }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-white">500+</p>
                <p className="text-gray-300">Certified Technicians</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-white">1,200+</p>
                <p className="text-gray-300">COCs Issued</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-white">3,000+</p>
                <p className="text-gray-300">Jobs Logged</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Membership Pricing - 3 Tier */}
      <section id="membership" className="py-20" style={{ backgroundColor: '#F5EDE5' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: colors.primary }}>Choose Your Path</h2>
            <div className="w-24 h-1 mx-auto rounded-full" style={{ backgroundColor: colors.highlight }}></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <div 
                key={index}
                className={`p-8 rounded-2xl border-2 transition-all duration-300 ${
                  tier.highlighted ? 'shadow-xl scale-105' : 'hover:shadow-lg'
                }`}
                style={{ 
                  backgroundColor: tier.highlighted ? colors.primary : 'white',
                  borderColor: tier.highlighted ? colors.highlight : '#E5E0DB'
                }}
              >
                {tier.highlighted && (
                  <span className="text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide" style={{ backgroundColor: colors.highlight }}>
                    Best Value
                  </span>
                )}
                <h3 className={`text-2xl font-bold mt-4 ${tier.highlighted ? 'text-white' : ''}`} style={{ color: tier.highlighted ? 'white' : colors.primary }}>
                  {tier.name}
                </h3>
                <p className={`text-3xl font-bold mt-2 ${tier.highlighted ? 'text-white' : ''}`} style={{ color: tier.highlighted ? 'white' : colors.primary }}>
                  {tier.price}
                </p>
                <p className={tier.highlighted ? 'mt-2 text-gray-300' : 'mt-2 text-gray-500'}>
                  {tier.description}
                </p>
                <ul className="mt-6 space-y-3">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" style={{ color: tier.highlighted ? colors.highlight : colors.accent }} />
                      <span className={tier.highlighted ? 'text-gray-200' : 'text-gray-600'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => scrollToSection('#contact')}
                  className="w-full mt-8 py-3 px-6 rounded-lg font-semibold transition-all duration-300 text-white"
                  style={{ backgroundColor: tier.highlighted ? colors.highlight : colors.primary }}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section - Accordion */}
      <section className="py-20" style={{ backgroundColor: colors.background }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: colors.primary }}>Frequently Asked Questions</h2>
            <div className="w-24 h-1 mx-auto rounded-full" style={{ backgroundColor: colors.highlight }}></div>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="rounded-xl border overflow-hidden"
                style={{ backgroundColor: 'white', borderColor: '#E5E0DB' }}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-lg" style={{ color: colors.primary }}>{faq.question}</span>
                  <ArrowRight className={`h-5 w-5 transition-transform ${openFaq === index ? 'rotate-90' : ''}`} style={{ color: colors.secondary }} />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 text-white" style={{ backgroundColor: colors.primary }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Advance Your HVAC-R Career?</h2>
          <p className="text-xl text-gray-300 mb-10">Join Zimbabwe&apos;s leading professional association today</p>
          <button 
            onClick={() => router.push('/login')}
            className="font-semibold py-4 px-10 rounded-lg transition-all duration-300 text-lg shadow-lg hover:shadow-xl text-white"
            style={{ backgroundColor: colors.highlight }}
          >
            Become a Member Now
          </button>
        </div>
      </section>

      {/* Footer - 4 Columns */}
      <footer id="contact" className="py-16 text-white" style={{ backgroundColor: colors.primary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Brand */}
            <div>
              <div className="flex items-center mb-4">
                <ShieldCheck className="h-8 w-8 text-white" />
                <span className="ml-3 text-xl font-bold">HEVACRAZ</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Advance the HVAC-R profession in Zimbabwe through education, certification, and advocacy.
              </p>
            </div>
            
            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><button onClick={() => scrollToSection('#about')} className="text-gray-400 hover:text-white transition-colors">About</button></li>
                <li><button onClick={() => scrollToSection('#services')} className="text-gray-400 hover:text-white transition-colors">Services</button></li>
                <li><button onClick={() => scrollToSection('#membership')} className="text-gray-400 hover:text-white transition-colors">Membership</button></li>
                <li><button onClick={() => router.push('/login')} className="text-gray-400 hover:text-white transition-colors">Portal</button></li>
              </ul>
            </div>
            
            {/* Resources */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><button className="text-gray-400 hover:text-white transition-colors">FAQ</button></li>
                <li><button onClick={() => scrollToSection('#contact')} className="text-gray-400 hover:text-white transition-colors">Contact</button></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            
            {/* Connect */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Connect</h4>
              <div className="flex space-x-3 mb-4">
                <a href="#" className="p-2 rounded-lg transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="p-2 rounded-lg transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <span className="text-sm font-bold">WA</span>
                </a>
                <a href="#" className="p-2 rounded-lg transition-colors" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="px-4 py-2 rounded-l-lg text-gray-900 w-full focus:outline-none"
                />
                <button className="px-4 py-2 rounded-r-lg transition-colors text-white" style={{ backgroundColor: colors.highlight }}>
                  <Mail className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-10 pt-8 text-center text-gray-400 text-sm">
            <p>© 2024 HEVACRAZ. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
