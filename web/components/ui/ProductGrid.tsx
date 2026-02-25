import ProductCard from './ProductCard';

interface ProductGridProps {
    products: any[];
    loading?: boolean;
}

export default function ProductGrid({ products, loading }: ProductGridProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse shadow-sm">
                        <div className="bg-gray-100 h-64 rounded-xl mb-6"></div>
                        <div className="h-4 bg-gray-100 rounded-full w-3/4 mb-4"></div>
                        <div className="h-4 bg-gray-100 rounded-full w-1/2"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No products found.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}
