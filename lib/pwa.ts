
"use client";

import { useState, useEffect } from 'react';
import { SyncStatus } from '../types/index';

export function usePWA() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerSync = async () => {
    setSyncStatus('syncing');
    // Mock background sync
    await new Promise((r) => setTimeout(r, 2000));
    setSyncStatus('synced');
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  return { isOnline, syncStatus, triggerSync };
}
