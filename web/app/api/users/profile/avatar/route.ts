import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000';

/** Forward multipart avatar upload (catch-all /api proxy uses request.text() which breaks binary). */
export async function POST(request: NextRequest) {
    const auth = request.headers.get('authorization');
    const formData = await request.formData();

    try {
        const res = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/users/profile/avatar`, {
            method: 'POST',
            headers: auth ? { Authorization: auth } : {},
            body: formData,
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (err) {
        console.error('[API profile avatar]', err);
        return NextResponse.json(
            { message: 'Upload failed. Is the API running?' },
            { status: 502 }
        );
    }
}
