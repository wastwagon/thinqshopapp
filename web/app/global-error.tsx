'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    void error;
    return (
        <html lang="en">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
                <meta name="theme-color" content="#ffffff" />
            </head>
            <body
                style={{
                    margin: 0,
                    background: '#ffffff',
                    fontFamily: 'system-ui, sans-serif',
                    paddingTop: 'var(--app-sat, env(safe-area-inset-top, 0px))',
                }}
            >
                <div style={{ padding: '50px', textAlign: 'center' }}>
                    <h2>Something went wrong globally!</h2>
                    <button type="button" onClick={() => reset()}>Try again</button>
                </div>
            </body>
        </html>
    );
}
