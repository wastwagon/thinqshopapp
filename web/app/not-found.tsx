import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-app px-6">
            <p className="text-6xl font-semibold text-brand mb-2" aria-hidden="true">
                404
            </p>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Page not found</h1>
            <p className="text-gray-500 mb-8 max-w-md text-center text-sm">
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
            <Link
                href="/"
                className="px-6 py-3 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand/90 transition-colors min-h-[44px] flex items-center justify-center"
            >
                Return home
            </Link>
        </div>
    );
}
