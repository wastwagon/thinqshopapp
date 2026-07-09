'use client';

type DashboardContentProps = {
    children: React.ReactNode;
    wide?: boolean;
    className?: string;
};

export default function DashboardContent({ children, wide, className = '' }: DashboardContentProps) {
    return (
        <div
            className={`pb-2 md:pb-6 w-full min-w-0 ${
                wide ? 'max-w-lg mx-auto md:max-w-4xl' : 'max-w-lg mx-auto md:max-w-3xl'
            } ${className}`}
        >
            {children}
        </div>
    );
}
