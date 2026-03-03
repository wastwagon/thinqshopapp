'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import OrderHistory from '@/components/ui/OrderHistory';
import { Package } from 'lucide-react';

export default function OrdersPage() {
    return (
        <DashboardLayout>
            <div className="pb-6 md:pb-8">
            <div className="mb-6 flex items-center gap-3">
                <Package className="h-8 w-8 text-blue-600" />
                <div>
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 tracking-tight leading-tight">Orders</h1>
                    <p className="text-xs text-blue-600 flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                        Order history
                    </p>
                </div>
            </div>
            <OrderHistory />
            </div>
        </DashboardLayout>
    );
}
