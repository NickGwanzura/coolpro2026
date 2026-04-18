'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { MapPin, Clock, Users, ArrowRight } from 'lucide-react';
import { MOCK_TRAINING_SESSIONS } from '@/constants/training';
import { STORAGE_KEYS } from '@/lib/platformStore';
import type { TrainingSession } from '@/types/index';

export default function TrainingPage() {
  const [referenceTime] = useState(() => Date.now());

  const storedSessions = useSyncExternalStore(
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

  const upcomingSessions = useMemo(
    () =>
      [...storedSessions]
        .filter((s) => new Date(s.startDate).getTime() >= referenceTime)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
    [storedSessions, referenceTime]
  );

  return (
    <div style={{ backgroundColor: '#FAFAF9' }}>
      {/* Page header */}
      <div className="pt-28 pb-16" style={{ backgroundColor: '#FAFAF9' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em]" style={{ color: '#5A7D5A' }}>
                Upcoming Trainings
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold mt-2" style={{ color: '#1C1917' }}>
                Public Training Calendar
              </h1>
              <p className="mt-3 max-w-2xl text-gray-600">
                Trainers schedule sessions with venue and fees this calendar updates automatically.
                Reservations are mocked until online payment is wired in.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: '#1C1917' }}
            >
              View Training Center
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Sessions grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-lg">No upcoming sessions at this time.</p>
              <p className="mt-2 text-sm">Check back soon or log in to view the full calendar.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="border bg-white p-6 shadow-sm"
                  style={{ borderColor: '#E5E0DB' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                        {new Intl.DateTimeFormat('en-ZW', { month: 'short', day: 'numeric' }).format(
                          new Date(session.startDate)
                        )}
                      </p>
                      <h3 className="mt-2 text-xl font-bold" style={{ color: '#1C1917' }}>
                        {session.title}
                      </h3>
                    </div>
                    <span className="px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: '#D97706' }}>
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
                      {new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium', timeStyle: 'short' }).format(
                        new Date(session.startDate)
                      )}
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {session.seatsRemaining} seats left
                    </p>
                  </div>
                  <Link
                    href="/login"
                    className="mt-6 block w-full py-3 text-sm font-semibold text-white text-center"
                    style={{ backgroundColor: '#D97706' }}
                  >
                    Reserve Seat (Mock)
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
