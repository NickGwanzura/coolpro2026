"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface UserSession {
    id: string;
    name: string;
    email: string;
    role: 'technician' | 'trainer' | 'vendor' | 'org_admin' | 'program_admin';
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
    program_admin: {
        id: 'admin-001',
        name: 'Demo Program Admin',
        email: 'admin@coolpro.demo',
        role: 'program_admin',
        region: 'Harare',
        isDemo: true,
    },
};

export function getSession(): UserSession | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('coolpro_session');
    return stored ? JSON.parse(stored) : null;
}

export function login(role: string, region: string): UserSession {
    const baseUser = MOCK_USERS[role] || MOCK_USERS.technician;
    const session: UserSession = {
        ...baseUser,
        region: region || baseUser.region,
        isDemo: true,
    };

    if (typeof window !== 'undefined') {
        localStorage.setItem('coolpro_session', JSON.stringify(session));
        document.cookie = `coolpro_auth=1; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `coolpro_role=${session.role}; path=/; max-age=86400; SameSite=Lax`;
    }

    return session;
}

export function logout() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('coolpro_session');
        document.cookie = 'coolpro_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'coolpro_role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        window.location.href = '/login';
    }
}

interface AuthContextType {
    user: UserSession | null;
    login: (role: string, region: string) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const session = getSession();
        setUser(session);
        setIsLoading(false);
    }, []);

    const handleLogin = (role: string, region: string) => {
        const session = login(role, region);
        setUser(session);
    };

    const handleLogout = () => {
        logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user: user, login: handleLogin, logout: handleLogout, isLoading }}>
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
