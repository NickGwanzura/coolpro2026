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

/**
 * Reads the locally-cached session (set by the auth API on login) without the
 * read-in-an-effect-then-setState flicker. Returns null during SSR and on the
 * client until the browser has a chance to read localStorage.
 */
export function useClientSession(): UserSession | null {
  return useSyncExternalStore(subscribe, getSession, getServerSnapshot);
}
