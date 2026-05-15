"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { UserRole } from '@/types/index';
import type { UserSession } from './mock-users';
export type { UserSession } from './mock-users';
export { MOCK_USERS } from './mock-users';

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
        credentials: 'include',
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

export async function loginByEmail(email: string, password?: string): Promise<UserSession> {
    const body: Record<string, string> = { email };
    if (password) body.password = password;
    return postLogin(body);
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
    login: (email: string, password?: string) => Promise<void>;
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

    const handleLogin = async (email: string, password?: string) => {
        const session = await loginByEmail(email, password);
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
