'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { FinalCTA } from '@/components/marketing/FinalCTA';

const FAQS = [
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
    answer: 'Businesses can use our National RAC Technician Verification and Competency Registry to search and verify any HEVACRAZ certified professional. Each listing shows verification status, certification level, and customer reviews.',
  },
  {
    question: 'What training programs do you offer?',
    answer: 'We offer a range of training programs including installation certification, safety compliance, equipment sizing, and advanced refrigeration. Members receive discounts on all training courses.',
  },
  {
    question: 'How does the technician registry help me find clients?',
    answer: 'Our public registry is searchable by potential clients seeking verified HVAC-R professionals. Having a complete profile with certifications and reviews significantly increases your visibility and credibility.',
  },
  {
    question: 'Who qualifies for the $7/year Student plan?',
    answer: 'Any student currently enrolled at a recognised Polytechnic in Zimbabwe studying HVAC-R, refrigeration, or a related discipline. You will be asked to upload a valid student ID and proof of enrolment during sign-up. Student accounts are verified annually and must be renewed each academic year.',
  },
  {
    question: 'What refrigerants can I legally handle after certification?',
    answer: 'Certification levels determine the refrigerant classes you are authorised to handle from lower-GWP A1 synthetics through to flammable hydrocarbons (A3) and ammonia. The Learning Hub and assessments cover each class, and the NOU (National Ozone Unit) oversees compliance with the Montreal Protocol and Kigali Amendment requirements.',
  },
  {
    question: 'Can suppliers sell gas to anyone who walks in?',
    answer: 'No. Registered suppliers on our platform must use the "Verify Buyer" tool before any transaction it confirms the buyer is a HEVACRAZ-certified technician in good standing. Sales to unregistered buyers are flagged to the NOU automatically and can result in supplier sanctions.',
  },
  {
    question: 'How long does certification approval take?',
    answer: 'Straightforward applications with complete documentation are typically reviewed within 5-7 working days. Applications requiring additional evidence or on-site assessment can take up to 21 working days. You can track the live status of your application from your dashboard.',
  },
  {
    question: 'Is my payment and personal data secure?',
    answer: 'Yes. All payments are processed via PCI-DSS-compliant gateways and we never store card details. Personal data is encrypted at rest and in transit, and only authorised HEVACRAZ and NOU reviewers can access your registry record. You can request a full data export or deletion at any time.',
  },
  {
    question: 'What happens if my certification expires?',
    answer: 'You will receive reminder emails 60, 30 and 7 days before expiry. Once expired, your public registry listing is marked "inactive" and you lose access to COC issuance and compliance-gated tools until you renew. Renewal requires continuing professional development (CPD) credits earned through the Learning Hub.',
  },
  {
    question: 'Do I need formal qualifications to join?',
    answer: 'Not for the Student tier. The Professional tier requires either a recognised trade qualification OR demonstrated experience verified through our assessment process. Apprentices and self-taught technicians can start with the Student tier and progress to Professional as they build CPD credits.',
  },
];

export default function FaqPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ backgroundColor: '#ffffff' }}>
      <section className="pt-28 sm:pt-32 pb-14 sm:pb-16 relative overflow-hidden" style={{ backgroundColor: '#FAFAF9' }}>
        <div
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[640px] h-[200px] opacity-[0.08] pointer-events-none blur-3xl"
          style={{ background: 'radial-gradient(closest-side, #D97706, transparent 70%)' }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[#D97706] text-xs font-semibold tracking-[0.24em] uppercase mb-3">Support</p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.08]" style={{ color: '#1C1917' }}>
            Frequently Asked Questions
          </h1>
          <p className="mt-5 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Answers to the most common questions about HEVACRAZ membership, certification,
            compliance, and supplier flows.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="space-y-3 sm:space-y-4">
            {FAQS.map((faq, index) => {
              const open = openFaq === index;
              return (
                <li key={index}>
                  <div
                    className={`border overflow-hidden bg-white transition-all duration-200 ${
                      open ? 'shadow-md border-[#D97706]/30' : 'hover:shadow-sm'
                    }`}
                    style={{ borderColor: open ? 'rgba(217,119,6,0.3)' : '#E7E5E4' }}
                  >
                    <button
                      onClick={() => setOpenFaq(open ? null : index)}
                      className="w-full px-5 sm:px-6 py-5 text-left flex justify-between items-center gap-4 transition-colors hover:bg-gray-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-inset"
                      aria-expanded={open}
                    >
                      <span className="font-semibold text-base sm:text-lg tracking-tight" style={{ color: '#1C1917' }}>
                        {faq.question}
                      </span>
                      <span
                        className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
                          open ? 'bg-[#D97706] text-white rotate-90' : 'bg-[#FAFAF9] text-[#D4A574]'
                        }`}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </button>
                    <div
                      className={`grid transition-all duration-300 ${
                        open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-5 sm:px-6 pb-5 text-sm sm:text-[15px] text-gray-600 leading-relaxed">
                          {faq.answer}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="mt-10 text-center text-sm text-gray-500">
            Still have questions?{' '}
            <a href="/contact" className="font-semibold hover:underline" style={{ color: '#D97706' }}>
              Contact us
            </a>
            .
          </p>
        </div>
      </section>

      <FinalCTA />
    </div>
  );
}
