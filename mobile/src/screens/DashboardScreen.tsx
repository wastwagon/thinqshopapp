import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Package, Send, ShoppingBag, ShieldCheck, CreditCard, ChevronRight, User } from 'lucide-react-native';
import axios from 'axios';

const API_URL = 'http://10.0.2.2:4000'; // Or your deployed URL

export default function DashboardScreen({ navigation }: any) {
    const [balance, setBalance] = useState<string>('0.00');
    const [refreshing, setRefreshing] = useState(false);
    const [userName, setUserName] = useState('User');

    const fetchData = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                // Testing fallback
                setBalance('12,450.00');
                setUserName('Alexander');
                return;
            }

            const [profileRes, walletRes] = await Promise.all([
                axios.get(`${API_URL}/users/profile`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/finance/wallet`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            setUserName(profileRes.data.first_name || 'User');
            setBalance(walletRes.data.balance_ghs);
        } catch (error) {
            console.error(error);
            // Default mock for demo
            setBalance('12,450.00');
            setUserName('Alexander');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchData().then(() => setRefreshing(false));
    }, []);

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        navigation.replace('Login');
    };

    const modules = [
        { name: 'Logistics Network', icon: Package, desc: 'Track Shipments & Waybills' },
        { name: 'Global Procurement', icon: ShoppingBag, desc: 'Manage Sourcing Sequences' },
        { name: 'Financial Transfers', icon: Send, desc: 'China Remittance Handlers' },
        { name: 'Support Protocol', icon: ShieldCheck, desc: 'Submit Help Manifests' }
    ];

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        >
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerSubtitle}>Verified Customer</Text>
                    <Text style={styles.headerTitle}>Welcome, {userName}</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.avatarNode}>
                    <User size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Balances Card */}
            <View style={styles.walletCard}>
                <View style={styles.walletBgGlow} />
                <View style={styles.walletHeader}>
                    <View style={styles.walletIconContainer}>
                        <CreditCard size={20} color="#2563eb" />
                    </View>
                    <Text style={styles.walletCardLabel}>Capital Dynamics Pipeline</Text>
                </View>
                <View style={styles.balanceContainer}>
                    <Text style={styles.currency}>GHS</Text>
                    <Text style={styles.balanceAmount}>{balance}</Text>
                </View>

                <TouchableOpacity style={styles.topUpButton}>
                    <Text style={styles.topUpText}>Initialize Deposit</Text>
                </TouchableOpacity>
            </View>

            {/* Modules */}
            <View style={styles.sectionHeaderContainer}>
                <Text style={styles.sectionHeader}>Operational Nodes</Text>
            </View>

            <View style={styles.modulesGrid}>
                {modules.map((mod, index) => (
                    <TouchableOpacity key={index} style={styles.moduleCard}>
                        <View style={styles.moduleIconBadge}>
                            <mod.icon size={24} color="#2563eb" />
                        </View>
                        <Text style={styles.moduleTitle}>{mod.name}</Text>
                        <Text style={styles.moduleDesc}>{mod.desc}</Text>
                        <View style={styles.moduleArrow}>
                            <ChevronRight size={16} color="#444" />
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        paddingHorizontal: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 32,
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 2,
        color: '#666',
        marginBottom: 4,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -1,
    },
    avatarNode: {
        width: 48,
        height: 48,
        backgroundColor: '#222',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    walletCard: {
        backgroundColor: '#111',
        borderRadius: 32,
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#222',
        marginBottom: 32,
    },
    walletBgGlow: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        borderRadius: 150,
    },
    walletHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
    },
    walletIconContainer: {
        width: 40,
        height: 40,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    walletCardLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    balanceContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 32,
    },
    currency: {
        fontSize: 16,
        fontWeight: '900',
        color: '#444',
        marginTop: 8,
    },
    balanceAmount: {
        fontSize: 48,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -2,
    },
    topUpButton: {
        backgroundColor: '#2563eb',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2563eb',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    topUpText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sectionHeaderContainer: {
        marginBottom: 16,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: '900',
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    modulesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    moduleCard: {
        width: '47%',
        backgroundColor: '#111',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#222',
        position: 'relative',
    },
    moduleIconBadge: {
        width: 48,
        height: 48,
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    moduleTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    moduleDesc: {
        fontSize: 11,
        color: '#666',
        fontWeight: '500',
        lineHeight: 16,
    },
    moduleArrow: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 24,
        height: 24,
        borderRadius: 8,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
