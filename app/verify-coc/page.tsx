'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, ShieldCheck, XCircle, FileText, Loader2 } from 'lucide-react';

interface PublicCocVerification {
  certificateNumber: string;
  technicianName: string;
  clientName: string;
  location: string;
  equipmentType: string;
  installationDate: string;
  status: string;
  issuedDate: string | null;
}

function formatDate(value: string | null) {
  if (!value) return 'Not available';
  return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium' }).format(new Date(value));
}

function VerifyCocContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [result, setResult] = useState<PublicCocVerification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = async (certificateNumber: string, token?: string | null) => {
    if (!certificateNumber.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const qs = new URLSearchParams({ q: certificateNumber.trim() });
      if (token) qs.set('token', token);
      const res = await fetch(`/api/public/coc-requests?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setResult(null);
        setError(data.error ?? 'Certificate not found.');
      } else {
        setResult(data);
      }
    } catch {
      setResult(null);
      setError('Verification service unavailable. Try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialQuery = searchParams.get('q');
    const token = searchParams.get('token');
    if (initialQuery) {
      runSearch(initialQuery, token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <section className="pt-28 sm:pt-32 pb-14">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[#D97706] text-xs font-semibold tracking-[0.24em] uppercase mb-3">Public Verification</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: '#1C1917' }}>
            Verify a Certificate of Conformity
          </h1>
          <p className="mt-4 text-gray-600 leading-relaxed">
            Confirm a HEVACRAZ/NOU-issued installation compliance certificate is genuine and currently approved.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              runSearch(query);
            }}
            className="mt-8 flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Certificate number — e.g. COC-XXXXXXXX"
                className="w-full border border-gray-200 py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-[#D97706] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Verify
            </button>
          </form>
        </div>
      </section>

      <section className="pb-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {searched && !loading && error && (
            <div className="border border-rose-200 bg-rose-50 p-6 text-center">
              <XCircle className="mx-auto mb-3 h-8 w-8 text-rose-500" />
              <p className="font-semibold text-rose-800">{error}</p>
              <p className="mt-1 text-sm text-rose-600">
                Only approved certificates can be verified here. Check the certificate number and try again.
              </p>
            </div>
          )}

          {result && (
            <div className="border border-emerald-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-emerald-100 bg-emerald-50 px-6 py-4">
                <ShieldCheck className="h-6 w-6 text-emerald-600" />
                <div>
                  <p className="font-bold text-emerald-900">Valid, Approved Certificate</p>
                  <p className="text-xs text-emerald-700">Issued by HEVACRAZ / National Ozone Unit Zimbabwe</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Certificate Number</p>
                  <p className="mt-1 font-mono font-semibold text-gray-900">{result.certificateNumber}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Technician</p>
                  <p className="mt-1 font-medium text-gray-900">{result.technicianName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Client / Project</p>
                  <p className="mt-1 font-medium text-gray-900">{result.clientName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Location</p>
                  <p className="mt-1 font-medium text-gray-900">{result.location}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Equipment Type</p>
                  <p className="mt-1 font-medium text-gray-900">{result.equipmentType}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Installation Date</p>
                  <p className="mt-1 font-medium text-gray-900">{formatDate(result.installationDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Issued</p>
                  <p className="mt-1 font-medium text-gray-900">{formatDate(result.issuedDate)}</p>
                </div>
              </div>
            </div>
          )}

          {!searched && (
            <div className="border border-dashed border-gray-200 p-10 text-center">
              <FileText className="mx-auto mb-3 h-8 w-8 text-gray-200" />
              <p className="text-sm text-gray-400">Enter a certificate number above to verify it.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function VerifyCocPage() {
  return (
    <Suspense fallback={null}>
      <VerifyCocContent />
    </Suspense>
  );
}
