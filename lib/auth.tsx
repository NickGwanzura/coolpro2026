"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserSession, getSession, login as authLogin, logout as authLogout } from './auth';

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
        // Check session on mount
        const session = getSession();
        setUser(session);
        setIsLoading(false);
    }, []);

    const login = (role: string, region: string) => {
        const session = authLogin(role, region);
        setUser(session);
    };

    const logout = () => {
        authLogout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
