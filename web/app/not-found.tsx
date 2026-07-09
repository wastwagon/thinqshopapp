import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
            <div className="w-12 h-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 mb-6" aria-hidden />
            <p className="text-6xl font-bold text-blue-600 mb-2" aria-hidden="true">
                404
            </p>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Page not found</h1>
            <p className="text-gray-500 mb-8 max-w-md text-center text-sm">
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
            <Link
                href="/"
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors min-h-[44px] flex items-center justify-center"
            >
                Return home
            </Link>
        </div>
    );
}
