import ShopLayout from '@/components/layout/ShopLayout';
import { ShopLoadingState } from '@/components/shop/ShopSuccessShell';

export default function ProductLoading() {
    return (
        <ShopLayout>
            <ShopLoadingState message="Loading product…" />
        </ShopLayout>
    );
}
