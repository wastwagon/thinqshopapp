import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 via-white to-orange-50/40 px-6 font-sans">
            <h1 className="text-6xl font-black bg-gradient-to-br from-blue-600 to-brand bg-clip-text text-transparent mb-4 tracking-tighter" aria-hidden="true">404</h1>
            <h2 className="text-xl font-bold text-slate-900 mb-8 uppercase tracking-widest">Page not found</h2>
            <p className="text-slate-600 mb-10 max-w-md text-center">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
            <Link
                href="/"
                className="px-8 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl font-bold text-sm uppercase tracking-wider hover:from-brand hover:to-brand/95 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-all min-h-[48px] min-w-[160px] flex items-center justify-center shadow-lg shadow-slate-900/15"
            >
                Return home
            </Link>
        </div>
    );
}
