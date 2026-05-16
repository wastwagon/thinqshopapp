'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import OrderHistory from '@/components/ui/OrderHistory';

export default function OrdersPage() {
    return (
        <DashboardLayout>
            <div className="pb-6 md:pb-8">
                <header className="mb-5 px-1">
                    <h1 className="page-title">Orders</h1>
                    <p className="page-subtitle">Track and manage your purchases</p>
                </header>
                <OrderHistory />
            </div>
        </DashboardLayout>
    );
}
