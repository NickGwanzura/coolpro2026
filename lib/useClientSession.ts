'use client';

import { useSyncExternalStore } from 'react';
import { getSession, type UserSession } from './auth';

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getServerSnapshot(): UserSession | null {
  return null;
}

let cachedRaw: string | null = null;
let cachedSession: UserSession | null = null;

function getSnapshot(): UserSession | null {
  const raw = typeof window === 'undefined' ? null : localStorage.getItem('coolpro_user');
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSession = getSession();
  }
  return cachedSession;
}

/**
 * Reads the locally-cached session (set by the auth API on login) without the
 * read-in-an-effect-then-setState flicker. Returns null during SSR and on the
 * client until the browser has a chance to read localStorage.
 */
export function useClientSession(): UserSession | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
