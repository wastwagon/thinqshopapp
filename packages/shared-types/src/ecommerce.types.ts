export interface Product {
    id: number;
    name: string;
    slug: string;
    price: number;
    description?: string;
    category_id: number;
    images?: string[];
}

export interface Order {
    id: number;
    order_number: string;
    total: number;
    status: string;
    created_at: string;
}
