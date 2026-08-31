'use client';

type ShopContentProps = {
    children: React.ReactNode;
    wide?: boolean;
    className?: string;
};

export default function ShopContent({ children, className = '' }: ShopContentProps) {
    return (
        <div className={`page-shell ${className}`}>
            {children}
        </div>
    );
}
