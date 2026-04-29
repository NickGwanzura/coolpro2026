"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { UserRole } from '@/types/index';

export interface UserSession {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    region: string;
    isDemo: boolean;
}

export const MOCK_USERS: Record<string, UserSession> = {
    technician: {
        id: 'tech-001',
        name: 'Demo Technician',
        email: 'tech@coolpro.demo',
        role: 'technician',
        region: 'Harare',
        isDemo: true,
    },
    trainer: {
        id: 'trainer-001',
        name: 'Demo Trainer',
        email: 'trainer@coolpro.demo',
        role: 'trainer',
        region: 'Bulawayo',
        isDemo: true,
    },
    vendor: {
        id: 'vendor-001',
        name: 'Demo Vendor',
        email: 'vendor@coolpro.demo',
        role: 'vendor',
        region: 'Mutare',
        isDemo: true,
    },
    org_admin: {
        id: 'org-001',
        name: 'Demo Org Admin',
        email: 'org@coolpro.demo',
        role: 'org_admin',
        region: 'Gweru',
        isDemo: true,
    },
    lecturer: {
        id: 'lect-001',
        name: 'Demo Lecturer',
        email: 'lecturer@coolpro.demo',
        role: 'lecturer',
        region: 'Harare',
        isDemo: true,
    },
    regulator: {
        id: 'reg-001',
        name: 'Demo Regulator',
        email: 'regulator@coolpro.demo',
        role: 'regulator',
        region: 'Harare',
        isDemo: true,
    },
};

export function getSession(): UserSession | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('coolpro_user');
    return stored ? JSON.parse(stored) as UserSession : null;
}

async function postLogin(body: Record<string, string>): Promise<UserSession> {
    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? `Login failed (${res.status})`);
    }
    const data = await res.json() as { user: UserSession };
    if (typeof window !== 'undefined') {
        localStorage.setItem('coolpro_user', JSON.stringify(data.user));
    }
    return data.user;
}

export async function loginByEmail(email: string): Promise<UserSession> {
    return postLogin({ email });
}

export async function login(role: string, region: string): Promise<UserSession> {
    return postLogin({ role, region });
}

export async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    if (typeof window !== 'undefined') {
        localStorage.removeItem('coolpro_user');
        window.location.href = '/login';
    }
}

interface AuthContextType {
    user: UserSession | null;
    login: (email: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
    demo?: (role: string, region: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/auth/session')
            .then(r => r.json())
            .then((data: { user: UserSession | null }) => {
                if (data.user) {
                    setUser(data.user);
                    localStorage.setItem('coolpro_user', JSON.stringify(data.user));
                } else {
                    const cached = getSession();
                    setUser(cached);
                }
            })
            .catch(() => {
                setUser(getSession());
            })
            .finally(() => setIsLoading(false));
    }, []);

    const handleLogin = async (email: string) => {
        const session = await loginByEmail(email);
        setUser(session);
    };

    const handleLogout = async () => {
        await logout();
        setUser(null);
    };

    const demoLogin = async (role: string, region: string) => {
        const session = await login(role, region);
        setUser(session);
    };

    return (
        <AuthContext.Provider value={{ user, login: handleLogin, logout: handleLogout, isLoading, demo: demoLogin }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
