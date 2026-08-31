'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/axios';
import { isAdminRole } from '@/lib/access-cookie';
import { useRouter } from 'next/navigation';

interface User {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    user_identifier?: string;
    phone?: string;
    role?: string;
    profile_image?: string | null;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, redirectPath?: string) => Promise<void>;
    completeLogin: (redirectPath?: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => {},
    completeLogin: async () => {},
    logout: () => { },
    refreshUser: async () => { },
    isAuthenticated: false,
});

async function persistAccessToken(token: string): Promise<boolean> {
    const res = await fetch('/api/session', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
    });
    return res.ok;
}

async function clearAccessSession() {
    localStorage.removeItem('token');
    try {
        await fetch('/api/session', { method: 'DELETE', credentials: 'same-origin' });
    } catch {
        // ignore
    }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const legacy = localStorage.getItem('token');
                if (legacy) {
                    await persistAccessToken(legacy);
                    localStorage.removeItem('token');
                }
                const sessionRes = await fetch('/api/session', { credentials: 'same-origin' });
                if (!sessionRes.ok) {
                    setUser(null);
                    setLoading(false);
                    return;
                }
                const session = await sessionRes.json();
                setUser({
                    id: Number(session.sub),
                    email: session.email || '',
                    role: session.role || 'user',
                });
                try {
                    const { data } = await api.get('/users/profile');
                    setUser(data);
                } catch (error: unknown) {
                    const status = (error as { response?: { status?: number } })?.response?.status;
                    // Keep the JWT session on 403 / transient profile errors. Only 401
                    // after the session cookie itself is dead should sign the user out.
                    if (status === 401) {
                        const sessionOk = await fetch('/api/session', { credentials: 'same-origin' })
                            .then((res) => res.ok)
                            .catch(() => false);
                        if (!sessionOk) {
                            await clearAccessSession();
                            setUser(null);
                        }
                    }
                }
            } catch {
                setUser(null);
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const refreshUser = async () => {
        try {
            const { data } = await api.get('/users/profile');
            setUser(data);
        } catch (e) {
            console.error('Refresh profile failed', e);
        }
    };

    const redirectAfterLogin = (userRole: string, redirectPath?: string) => {
        const safe =
            redirectPath &&
            /^\/(dashboard|admin|checkout|cart|wishlist|track)(\/|$)/.test(redirectPath)
                ? redirectPath
                : null;
        const target = isAdminRole(userRole)
            ? safe && safe.startsWith('/admin')
                ? safe
                : '/admin'
            : safe && !safe.startsWith('/admin')
              ? safe
              : '/dashboard';
        window.location.href = target;
    };

    const completeLogin = async (redirectPath?: string) => {
        const sessionRes = await fetch('/api/session', { credentials: 'same-origin' });
        const session = sessionRes.ok ? await sessionRes.json() : {};
        const userRole = session.role || 'user';
        setUser({ id: Number(session.sub), email: session.email || '', role: userRole });
        api.get('/users/profile').then(({ data }) => {
            setUser(data);
        }).catch(console.error);
        redirectAfterLogin(userRole, redirectPath);
    };

    const login = async (token: string, redirectPath?: string) => {
        const ok = await persistAccessToken(token);
        if (!ok) {
            throw new Error('Could not start a secure session');
        }
        localStorage.removeItem('token');
        await completeLogin(redirectPath);
    };

    const logout = () => {
        void clearAccessSession().finally(() => {
            setUser(null);
            router.push('/');
        });
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, completeLogin, logout, refreshUser, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
