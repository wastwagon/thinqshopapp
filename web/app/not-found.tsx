import Link from 'next/link';
import ShopLayout from '@/components/layout/ShopLayout';
import { ShopEmptyState } from '@/components/shop/ShopSuccessShell';

export default function NotFound() {
    return (
        <ShopLayout>
            <ShopEmptyState
                message="This page does not exist or has been moved."
                href="/"
                linkLabel="Return home"
            />
        </ShopLayout>
    );
}
