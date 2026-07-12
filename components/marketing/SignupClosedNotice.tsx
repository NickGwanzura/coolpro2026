import Link from 'next/link';
import { ArrowLeft, Lock, Mail } from 'lucide-react';

export function SignupClosedNotice({ title, accent = '#1C1917' }: { title: string; accent?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAFAF9] px-4 py-24">
      <div className="w-full max-w-md border border-[#E5E0DB] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: `${accent}14` }}>
          <Lock className="h-5 w-5" style={{ color: accent }} />
        </div>
        <h1 className="text-xl font-bold text-[#1C1917]">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Self-service registration is temporarily closed while HEVACRAZ and the National Ozone Unit
          process the current queue. New applicants are being added directly by the admin team.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 bg-[#1C1917] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2C2420]"
          >
            <Mail className="h-4 w-4" />
            Contact HEVACRAZ
          </Link>
          <Link
            href="/join"
            className="inline-flex items-center justify-center gap-2 border border-[#E5E0DB] px-5 py-3 text-sm font-semibold text-[#1C1917] transition hover:bg-[#FAFAF9]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to join options
          </Link>
        </div>
      </div>
    </main>
  );
}
