'use client';

type DashboardContentProps = {
    children: React.ReactNode;
    wide?: boolean;
    className?: string;
};

export default function DashboardContent({ children, className = '' }: DashboardContentProps) {
    return (
        <div className={`pb-10 md:pb-6 w-full min-w-0 ${className}`}>
            {children}
        </div>
    );
}
