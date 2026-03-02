'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import TopbarView, { type Notification } from './TopbarView';

interface TopbarProps {
    onMenuPress?: () => void;
}

export default function Topbar(props: TopbarProps) {
    const { onMenuPress } = props;
    const { user, logout } = useAuth();
    const [notifications, setNotifications] = useState([] as Notification[]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const accountMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
                setAccountMenuOpen(false);
            }
        }
        if (accountMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [accountMenuOpen]);

    const fetchNotifications = async () => {
        try {
            if (user) {
                const { data } = await api.get('/notifications');
                setNotifications(data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const handleMarkAsRead = async (id: number) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error(error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await api.post('/notifications/read-all');
            setNotifications(ns => ns.map(n => ({ ...n, is_read: true })));
            setShowNotifications(false);
        } catch (error) {
            console.error(error);
        }
    };

    return React.createElement(TopbarView, {
        onMenuPress,
        user,
        logout,
        notifications,
        showNotifications,
        setShowNotifications,
        accountMenuOpen,
        setAccountMenuOpen,
        mobileSearchOpen,
        setMobileSearchOpen,
        accountMenuRef,
        handleMarkAsRead,
        handleMarkAllAsRead,
    });
}
