"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

interface EmergencyModeContextValue {
    emergencyMode: boolean;
    setEmergencyMode: (value: boolean) => void;
    toggleEmergencyMode: () => void;
}

const EmergencyModeContext = createContext<EmergencyModeContextValue | undefined>(undefined);

function getInitialEmergencyMode() {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.localStorage.getItem('coolpro_emergency_mode') === '1';
}

export function EmergencyModeProvider({ children }: { children: ReactNode }) {
    const [emergencyMode, setEmergencyMode] = useState<boolean>(getInitialEmergencyMode);

    useEffect(() => {
        window.localStorage.setItem('coolpro_emergency_mode', emergencyMode ? '1' : '0');
    }, [emergencyMode]);

    const value = useMemo<EmergencyModeContextValue>(() => ({
        emergencyMode,
        setEmergencyMode,
        toggleEmergencyMode: () => setEmergencyMode((current) => !current),
    }), [emergencyMode]);

    return (
        <EmergencyModeContext.Provider value={value}>
            {children}
        </EmergencyModeContext.Provider>
    );
}

export function useEmergencyMode() {
    const context = useContext(EmergencyModeContext);

    if (!context) {
        throw new Error('useEmergencyMode must be used within EmergencyModeProvider');
    }

    return context;
}
