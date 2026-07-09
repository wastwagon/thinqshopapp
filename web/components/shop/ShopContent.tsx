'use client';

type ShopContentProps = {
    children: React.ReactNode;
    wide?: boolean;
    className?: string;
};

export default function ShopContent({ children, wide, className = '' }: ShopContentProps) {
    return (
        <div
            className={`w-full min-w-0 mx-auto px-4 sm:px-6 ${
                wide ? 'max-w-lg md:max-w-4xl' : 'max-w-lg md:max-w-3xl'
            } ${className}`}
        >
            {children}
        </div>
    );
}
