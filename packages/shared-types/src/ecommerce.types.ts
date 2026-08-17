export interface Product {
    id: number;
    name: string;
    slug: string;
    price: number;
    description?: string;
    category_id: number;
    images?: string[];
    wholesale_min_quantity?: number | null;
    wholesale_discount_pct?: number | null;
    enforce_min_quantity?: boolean;
}

export interface Order {
    id: number;
    order_number: string;
    total: number;
    status: string;
    created_at: string;
}
