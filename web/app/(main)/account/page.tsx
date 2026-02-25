'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
    const router = useRouter();

    useEffect(() => {
        router.push('/dashboard');
    }, [router]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-white font-black tracking-widest uppercase animate-pulse">
                Redirecting to Account...
            </div>
        </div>
    );
}
