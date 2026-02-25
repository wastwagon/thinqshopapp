export default function MainLoading() {
    return (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 p-8" role="status" aria-label="Loading">
            <div className="w-10 h-10 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" aria-hidden />
            <span className="text-sm font-medium text-gray-500">Loading…</span>
        </div>
    );
}
