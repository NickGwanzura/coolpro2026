'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { FinalCTA } from '@/components/marketing/FinalCTA';

const PRICING_TIERS = [
  {
    name: 'Student',
    price: '$7/year',
    description: 'For Polytechnic students',
    features: [
      'Polytechnic ID verification required',
      'Learning Hub access',
      'Sizing tool & field toolkit',
      'Basic registry listing (student)',
      'Entry-level certifications',
      'Discounted training sessions',
    ],
    cta: 'Verify Student Status',
    highlighted: false,
    badge: 'Student Special' as string | null,
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
    badge: 'Best Value',
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
    badge: null,
  },
];

const PRICING_FAQS = [
  {
    question: 'Who qualifies for the $7/year Student plan?',
    answer: 'Any student currently enrolled at a recognised Polytechnic in Zimbabwe studying HVAC-R, refrigeration, or a related discipline. You will be asked to upload a valid student ID and proof of enrolment during sign-up. Student accounts are verified annually and must be renewed each academic year.',
  },
  {
    question: 'Do I need formal qualifications to join?',
    answer: 'Not for the Free and Student tiers. The Professional tier requires either a recognised trade qualification OR demonstrated experience verified through our assessment process. Apprentices and self-taught technicians can start with the Student or Free tier and progress to Professional as they build CPD credits.',
  },
  {
    question: 'What happens if my certification expires?',
    answer: 'You will receive reminder emails 60, 30 and 7 days before expiry. Once expired, your public registry listing is marked "inactive" and you lose access to COC issuance and compliance-gated tools until you renew. Renewal requires continuing professional development (CPD) credits earned through the Learning Hub.',
  },
  {
    question: 'How long does certification approval take?',
    answer: 'Straightforward applications with complete documentation are typically reviewed within 5-7 working days. Applications requiring additional evidence or on-site assessment can take up to 21 working days. You can track the live status of your application from your dashboard.',
  },
  {
    question: 'Is my payment and personal data secure?',
    answer: 'Yes. All payments are processed via PCI-DSS-compliant gateways and we never store card details. Personal data is encrypted at rest and in transit, and only authorised HEVACRAZ and NOU reviewers can access your registry record. You can request a full data export or deletion at any time.',
  },
];

export default function MembershipPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ backgroundColor: '#FAFAF9' }}>
      {/* Page header */}
      <div className="pt-28 pb-16" style={{ backgroundColor: '#FAFAF9' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[#D97706] text-xs font-semibold tracking-widest uppercase mb-3">Membership</p>
          <h1 className="text-4xl sm:text-5xl font-bold" style={{ color: '#1C1917' }}>Choose Your Path</h1>
          <p className="mt-4 text-gray-600 text-lg max-w-xl mx-auto">
            From student to enterprise find the plan that matches where you are and where you're headed.
          </p>
        </div>
      </div>

      {/* Pricing tiers */}
      <section className="py-16" style={{ backgroundColor: '#FAFAF9' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PRICING_TIERS.map((tier, index) => (
              <div
                key={index}
                className={`p-8 border-2 transition-all duration-300 ${
                  tier.highlighted ? 'shadow-sm' : 'hover:shadow-sm'
                }`}
                style={{
                  backgroundColor: tier.highlighted ? '#1C1917' : 'white',
                  borderColor: tier.highlighted ? '#D97706' : tier.name === 'Student' ? '#5A7D5A' : '#E5E0DB',
                }}
              >
                {tier.badge && (
                  <span
                    className="text-xs font-bold px-2 py-0.5 uppercase tracking-wide"
                    style={{
                      backgroundColor: tier.highlighted
                        ? 'rgba(217,119,6,0.2)'
                        : tier.name === 'Student'
                        ? 'rgba(90,125,90,0.15)'
                        : '#FAFAF9',
                      color: tier.highlighted ? '#D97706' : tier.name === 'Student' ? '#5A7D5A' : '#1C1917',
                    }}
                  >
                    {tier.badge}
                  </span>
                )}
                <h3
                  className="text-2xl font-bold mt-4"
                  style={{ color: tier.highlighted ? 'white' : '#1C1917' }}
                >
                  {tier.name}
                </h3>
                <p
                  className="text-3xl font-bold mt-2"
                  style={{ color: tier.highlighted ? 'white' : '#1C1917' }}
                >
                  {tier.price}
                </p>
                <p className={tier.highlighted ? 'mt-2 text-gray-300' : 'mt-2 text-gray-500'}>
                  {tier.description}
                </p>
                <ul className="mt-6 space-y-3">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" style={{ color: tier.highlighted ? '#D97706' : '#5A7D5A' }} />
                      <span className={tier.highlighted ? 'text-gray-200' : 'text-gray-600'}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contact"
                  className="block w-full mt-8 py-3 px-6 font-semibold transition-all duration-300 text-white text-center"
                  style={{ backgroundColor: tier.highlighted ? '#D97706' : '#1C1917' }}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing FAQs */}
      <section className="py-20" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#1C1917' }}>
              Membership Questions
            </h2>
            <div className="w-24 h-1 mx-auto" style={{ backgroundColor: '#D97706' }}></div>
          </div>
          <div className="space-y-4">
            {PRICING_FAQS.map((faq, index) => (
              <div
                key={index}
                className="border overflow-hidden"
                style={{ backgroundColor: 'white', borderColor: '#E7E5E4' }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-lg" style={{ color: '#1C1917' }}>{faq.question}</span>
                  <ArrowRight
                    className={`h-5 w-5 transition-transform ${openFaq === index ? 'rotate-90' : ''}`}
                    style={{ color: '#D4A574' }}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-5 text-gray-600 leading-relaxed">{faq.answer}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <FinalCTA />
    </div>
  );
}
