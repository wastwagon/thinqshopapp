'use client';

/** Screen-reader announcements for dynamic UI (cart totals, checkout quotes). */
export default function LiveRegion({ message }: { message: string }) {
    if (!message) return null;
    return (
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {message}
        </div>
    );
}
