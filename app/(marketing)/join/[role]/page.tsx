import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, HardHat, GraduationCap, Presentation } from 'lucide-react';
import { RegistrationApplicationForm } from '@/components/marketing/RegistrationApplicationForm';
import { SignupClosedNotice } from '@/components/marketing/SignupClosedNotice';
import { APPLICANT_ROLES, isRegistrationApplicationRole, type RegistrationApplicationRole } from '@/lib/application-roles';
import { SELF_SIGNUP_OPEN } from '@/lib/signup-config';

const PAGE: Record<RegistrationApplicationRole, {
  accent: string;
  tint: string;
  eyebrow: string;
  heading: string;
  intro: string;
  icon: React.ReactNode;
}> = {
  trainer: {
    accent: '#7C3AED',
    tint: 'rgba(124,58,237,0.10)',
    eyebrow: 'Trainer Registration',
    heading: 'Apply to train and assess technicians',
    intro: 'Tell us about your qualifications and assessment experience. Once approved you can create courses, grade learner exams, and put technicians forward for certificates.',
    icon: <Presentation className="h-6 w-6" />,
  },
  lecturer: {
    accent: '#0E7490',
    tint: 'rgba(14,116,144,0.10)',
    eyebrow: 'Lecturer Registration',
    heading: 'Apply to publish courses for your students',
    intro: 'Tell us where you teach and what you teach. Once approved you can create courses for approval, grade exams, and schedule training sessions.',
    icon: <GraduationCap className="h-6 w-6" />,
  },
  contractor: {
    accent: '#B45309',
    tint: 'rgba(180,83,9,0.10)',
    eyebrow: 'Contractor Registration',
    heading: 'Register your contracting business',
    intro: 'Tell us about your business and the work you do. Once approved you can plan jobs, log refrigerant use, request certificates for completed work, and verify the technicians you hire.',
    icon: <HardHat className="h-6 w-6" />,
  },
};

export async function generateMetadata({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  return { title: isRegistrationApplicationRole(role) ? `Apply as ${APPLICANT_ROLES[role].label} | HEVACRAZ` : 'Join | HEVACRAZ' };
}

export default async function JoinRolePage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  // Only trainer, lecturer and contractor use this page. Anything else (including admin roles)
  // is a plain 404, so there is no route that lets anyone apply to be an administrator.
  if (!isRegistrationApplicationRole(role)) notFound();

  const page = PAGE[role];
  if (!SELF_SIGNUP_OPEN[role]) {
    return <SignupClosedNotice title={`${APPLICANT_ROLES[role].label} registration is closed`} accent={page.accent} />;
  }

  return (
    <div style={{ backgroundColor: '#ffffff' }}>
      <section className="pt-28 sm:pt-32 pb-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/join" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#1C1917] transition-colors mb-5">
            <ArrowLeft className="h-4 w-4" />
            Back to paths
          </Link>
          <div className="flex items-start gap-4">
            <div className="shrink-0 p-2.5 mt-1 rounded-lg" style={{ backgroundColor: page.tint, color: page.accent }}>
              {page.icon}
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.22em] uppercase mb-2" style={{ color: page.accent }}>
                {page.eyebrow}
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.1]" style={{ color: '#1C1917' }}>
                {page.heading}
              </h1>
              <p className="mt-4 text-gray-600 leading-relaxed">{page.intro}</p>
              <p className="mt-3 text-sm text-gray-500">
                Reviews take {APPLICANT_ROLES[role].reviewTime}. You will confirm your email first, then we email you the decision.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 sm:pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <RegistrationApplicationForm role={role} accent={page.accent} accentTint={page.tint} />
        </div>
      </section>
    </div>
  );
}
