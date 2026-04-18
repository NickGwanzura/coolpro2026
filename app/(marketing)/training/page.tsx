'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { MapPin, Clock, Users, ArrowRight, CalendarCheck } from 'lucide-react';
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
      <section className="pt-28 sm:pt-32 pb-12 sm:pb-16" style={{ backgroundColor: '#FAFAF9' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.24em]" style={{ color: '#5A7D5A' }}>
                Upcoming Trainings
              </p>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mt-3 tracking-tight leading-[1.08]" style={{ color: '#1C1917' }}>
                Public Training
                <br className="hidden sm:block" /> Calendar
              </h1>
              <p className="mt-5 max-w-2xl text-gray-600 leading-relaxed text-base sm:text-lg">
                Trainers schedule sessions with venue and fees. This calendar updates automatically.
                Reservations are mocked until online payment is wired in.
              </p>
            </div>
            <Link
              href="/login"
              className="group inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2"
              style={{ backgroundColor: '#1C1917' }}
            >
              View Training Center
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Sessions grid */}
      <section className="pb-20 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-20 sm:py-28 border bg-white" style={{ borderColor: '#E5E0DB' }}>
              <div className="inline-flex p-4 mb-5" style={{ backgroundColor: '#FAFAF9' }}>
                <CalendarCheck className="h-8 w-8" style={{ color: '#5A7D5A' }} />
              </div>
              <p className="text-lg font-semibold" style={{ color: '#1C1917' }}>
                No upcoming sessions at this time.
              </p>
              <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
                New trainings are posted regularly. Log in to view the full calendar or check back soon.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 mt-6 px-5 py-3 text-sm font-semibold text-white transition-all hover:brightness-110"
                style={{ backgroundColor: '#D97706' }}
              >
                Log in
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingSessions.map((session) => {
                const nearlyFull = session.seatsRemaining <= 5;
                const dateLabel = new Intl.DateTimeFormat('en-ZW', {
                  month: 'short',
                  day: 'numeric',
                }).format(new Date(session.startDate));
                const dateTimeLabel = new Intl.DateTimeFormat('en-ZW', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(session.startDate));

                return (
                  <article
                    key={session.id}
                    className="group relative border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[#D97706]/40 flex flex-col"
                    style={{ borderColor: '#E5E0DB' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-400">
                          {dateLabel}
                        </p>
                        <h3 className="mt-2 text-lg sm:text-xl font-bold tracking-tight" style={{ color: '#1C1917' }}>
                          {session.title}
                        </h3>
                      </div>
                      <span
                        className="shrink-0 px-3 py-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: '#D97706' }}
                      >
                        ${session.feeUsd}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-gray-600 flex-1">{session.summary}</p>

                    <div className="mt-5 pt-4 border-t border-gray-100 space-y-2.5 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="truncate">
                          {session.venue}, {session.province}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                        <span>{dateTimeLabel}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className={nearlyFull ? 'font-semibold text-[#D97706]' : ''}>
                          {session.seatsRemaining} seats left
                          {nearlyFull && <span className="ml-2 text-xs uppercase tracking-wider">Almost full</span>}
                        </span>
                      </p>
                    </div>

                    <Link
                      href="/login"
                      className="group/btn mt-6 inline-flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 shadow-sm hover:shadow-md"
                      style={{ backgroundColor: '#D97706' }}
                    >
                      Reserve Seat <span className="text-white/70">(Mock)</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
