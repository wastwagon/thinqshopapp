'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html>
            <body>
                <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'system-ui' }}>
                    <h2>Something went wrong globally!</h2>
                    <button onClick={() => reset()}>Try again</button>
                </div>
            </body>
        </html>
    );
}
