export default function ProductLoading() {
    return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 p-8" role="status" aria-label="Loading product">
            <div className="w-10 h-10 border-2 border-brand/20 border-t-brand rounded-full animate-spin" aria-hidden />
            <span className="text-sm font-medium text-gray-500">Loading product…</span>
        </div>
    );
}
