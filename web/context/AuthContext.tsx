'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { clearSessionCookies, setSessionCookies } from '@/lib/session-cookies';

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
    login: (token: string, redirectPath?: string) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: () => {},
    logout: () => { },
    refreshUser: async () => { },
    isAuthenticated: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const { data } = await api.get('/users/profile');
                    setUser(data);
                    setSessionCookies(data.role);
                } catch (error) {
                    console.error("Auth check failed", error);
                    localStorage.removeItem('token');
                    clearSessionCookies();
                    setUser(null);
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const refreshUser = async () => {
        try {
            const { data } = await api.get('/users/profile');
            setUser(data);
            setSessionCookies(data.role);
        } catch (e) {
            console.error('Refresh profile failed', e);
        }
    };

    const login = (token: string, redirectPath?: string) => {
        localStorage.setItem('token', token);
        const decoded: any = jwtDecode(token);
        const userRole = decoded.role || 'user';
        setSessionCookies(userRole);
        setUser({ id: decoded.sub, email: decoded.email, role: userRole });
        api.get('/users/profile').then(({ data }) => {
            setUser(data);
            setSessionCookies(data.role);
        }).catch(console.error);
        // Safe redirect: only /dashboard or /admin (and subpaths)
        const safe = redirectPath && /^\/(dashboard|admin)(\/|$)/.test(redirectPath) ? redirectPath : null;
        const target = userRole === 'admin' || userRole === 'superadmin'
            ? (safe && safe.startsWith('/admin') ? safe : '/admin')
            : (safe && safe.startsWith('/dashboard') ? safe : '/dashboard');
        // Use window.location for full reload so middleware sees the new cookie (router.push can fail)
        window.location.href = target;
    };

    const logout = () => {
        localStorage.removeItem('token');
        clearSessionCookies();
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
