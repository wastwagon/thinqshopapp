import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const method = searchParams.get('method') || '';
    const targetUrl = `${BACKEND_URL.replace(/\/$/, '')}/logistics/freight-rates${method ? `?method=${encodeURIComponent(method)}` : ''}`;

    try {
        const res = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });
        const data = await res.text();
        const contentType = res.headers.get('content-type') || 'application/json';
        return new NextResponse(data, {
            status: res.status,
            headers: { 'Content-Type': contentType },
        });
    } catch (err) {
        console.error('[API proxy] freight-rates', targetUrl, err);
        return NextResponse.json(
            { message: 'Backend unreachable. Is the API running on ' + BACKEND_URL + '?' },
            { status: 502 }
        );
    }
}
