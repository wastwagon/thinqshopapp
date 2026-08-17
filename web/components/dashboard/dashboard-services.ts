import type { ServiceCardConfig } from './DashboardServiceCard';

export const DASHBOARD_SERVICES: ServiceCardConfig[] = [
    {
        title: 'Logistics',
        description: 'Ship packages worldwide',
        href: '/dashboard/logistics',
        image: '/assets/dashboard/service-logistic.png',
        gradient: 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700',
        accent: 'text-blue-600',
        imageBlend: 'multiply',
    },
    {
        title: 'Procurement',
        description: 'Source and purchase products',
        href: '/dashboard/procurement',
        image: '/assets/dashboard/service-procurement.png',
        gradient: 'bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-700',
        accent: 'text-emerald-600',
        imageBlend: 'multiply',
    },
    {
        title: 'Transfer',
        description: 'Send money securely',
        href: '/dashboard/transfers',
        image: '/assets/dashboard/service-transfer.png',
        gradient: 'bg-gradient-to-br from-blue-600 via-brand to-blue-950',
        accent: 'text-brand',
        imageBlend: 'normal',
    },
    {
        title: 'Shopping',
        description: 'Shop from trusted stores',
        href: '/shop',
        image: '/assets/dashboard/service-shopping.png',
        gradient: 'bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600',
        accent: 'text-orange-500',
        imageBlend: 'normal',
    },
];
