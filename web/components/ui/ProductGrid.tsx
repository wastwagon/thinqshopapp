import ProductCard from './ProductCard';

interface ProductGridProps {
    products: any[];
    loading?: boolean;
}

export default function ProductGrid({ products, loading }: ProductGridProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-4 lg:gap-5">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="flat-card overflow-hidden animate-pulse">
                        <div className="bg-gray-100 aspect-square"></div>
                        <div className="p-3">
                            <div className="h-4 bg-gray-100 rounded-full w-3/4 mb-3"></div>
                            <div className="h-4 bg-gray-100 rounded-full w-1/2"></div>
                        </div>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-4 lg:gap-5">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
}
