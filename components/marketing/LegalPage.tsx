import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export type LegalSection = {
  title: string;
  id?: string;
  paragraphs?: string[];
  bullets?: string[];
};

export function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <div className="bg-[#FAFAF9] px-4 py-10 sm:px-6 sm:py-16">
      <article className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-[#E7E5E4] bg-white shadow-sm">
        <header className="border-b border-[#E7E5E4] bg-gradient-to-br from-white to-[#FFF7ED] px-5 py-8 sm:px-10 sm:py-12">
          <Link href="/" className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-[#78716C] hover:text-[#1C1917] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to HEVACRAZ
          </Link>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-[#B45309]">HEVACRAZ platform</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1C1917] sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#57534E]">{intro}</p>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-[#78716C]">
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-semibold text-amber-800">For legal review</span>
            <span>Last updated 7 October 2026</span>
          </div>
        </header>

        <div className="border-b border-blue-100 bg-blue-50 px-5 py-4 text-sm leading-6 text-blue-950 sm:px-10">
          These pages describe the platform’s intended operating rules and current features. HEVACRAZ should have them reviewed and approved by Zimbabwean legal and data-protection counsel before treating them as final legal terms.
        </div>

        <div className="divide-y divide-[#F1F0EE] px-5 sm:px-10">
          {sections.map((section, index) => (
            <section key={section.title} id={section.id} className="scroll-mt-24 py-6 sm:py-8">
              <h2 className="text-lg font-semibold text-[#1C1917]">{index + 1}. {section.title}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-sm leading-7 text-[#57534E]">{paragraph}</p>
              ))}
              {section.bullets && (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-[#57534E] marker:text-[#D97706]">
                  {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
              )}
            </section>
          ))}
        </div>

        <footer className="flex flex-col gap-3 border-t border-[#E7E5E4] bg-[#FAFAF9] px-5 py-6 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <a href="mailto:compliance@hevacraz.co.zw" className="font-medium text-[#B45309] hover:text-[#92400E]">Contact: compliance@hevacraz.co.zw</a>
          <a href="https://zimlii.org/akn/zw/act/2021/5" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 text-[#57534E] hover:text-[#1C1917]">
            Zimbabwe Cyber and Data Protection Act <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </footer>
      </article>
    </div>
  );
}
