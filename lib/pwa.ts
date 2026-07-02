
"use client";

import { useState } from 'react';
import { SyncStatus } from '../types/index';
import { useOnlineStatus } from './useOnlineStatus';

export function usePWA() {
  const isOnline = useOnlineStatus();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  const triggerSync = async () => {
    setSyncStatus('syncing');
    // Mock background sync
    await new Promise((r) => setTimeout(r, 2000));
    setSyncStatus('synced');
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  return { isOnline, syncStatus, triggerSync };
}
