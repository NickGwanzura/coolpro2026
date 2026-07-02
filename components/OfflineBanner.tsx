'use client';

import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/lib/useOnlineStatus';

export function OfflineBanner() {
    const isOnline = useOnlineStatus();

    if (isOnline) return null;

    return (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white px-4 py-2.5 text-center text-sm font-medium z-50 flex items-center justify-center gap-2">
            <WifiOff className="h-4 w-4" />
            You are currently offline. Changes may not be saved.
        </div>
    );
}
