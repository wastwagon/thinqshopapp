'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardPageHeader from '@/components/dashboard/DashboardPageHeader';
import DashboardContent from '@/components/dashboard/DashboardContent';
import OrderHistory from '@/components/ui/OrderHistory';

export default function OrdersPage() {
    return (
        <DashboardLayout>
            <DashboardContent>
                <DashboardPageHeader
                    title="Orders"
                    subtitle="Track and manage your purchases"
                    accent="orange"
                />
                <OrderHistory />
            </DashboardContent>
        </DashboardLayout>
    );
}
