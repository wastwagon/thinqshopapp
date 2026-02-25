import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 font-sans">
            <h1 className="text-6xl font-black text-blue-600 mb-4 tracking-tighter" aria-hidden="true">404</h1>
            <h2 className="text-xl font-bold text-slate-900 mb-8 uppercase tracking-widest">Page not found</h2>
            <p className="text-slate-600 mb-10 max-w-md text-center">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
            <Link
                href="/"
                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors min-h-[48px] min-w-[160px] flex items-center justify-center"
            >
                Return home
            </Link>
        </div>
    );
}
