import { NextRequest, NextResponse } from 'next/server';

// Prefer BACKEND_URL for server-side proxy (Docker: http://backend:7000); NEXT_PUBLIC_API_URL is for client
const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000';

type RouteParams = { path: string[] };
type ParamsArg = RouteParams | Promise<RouteParams>;

async function pathFromParams(params: ParamsArg): Promise<string[]> {
    const p = await Promise.resolve(params);
    return p?.path ?? [];
}

export async function GET(request: NextRequest, { params }: { params: ParamsArg }) {
    return proxy(request, await pathFromParams(params));
}

export async function POST(request: NextRequest, { params }: { params: ParamsArg }) {
    return proxy(request, await pathFromParams(params));
}

export async function PATCH(request: NextRequest, { params }: { params: ParamsArg }) {
    return proxy(request, await pathFromParams(params));
}

export async function PUT(request: NextRequest, { params }: { params: ParamsArg }) {
    return proxy(request, await pathFromParams(params));
}

export async function DELETE(request: NextRequest, { params }: { params: ParamsArg }) {
    return proxy(request, await pathFromParams(params));
}

async function proxy(request: NextRequest, pathSegments: string[]) {
    const path = pathSegments.join('/');
    const url = new URL(request.url);
    const search = url.searchParams.toString();
    const targetUrl = `${BACKEND_URL.replace(/\/$/, '')}/${path}${search ? `?${search}` : ''}`;

    try {
        const headers: HeadersInit = {};
        request.headers.forEach((value, key) => {
            const lower = key.toLowerCase();
            if (lower === 'host' || lower === 'connection') return;
            headers[key] = value;
        });

        const init: RequestInit = {
            method: request.method,
            headers,
        };
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            const body = await request.text();
            if (body) init.body = body;
        }

        const res = await fetch(targetUrl, init);
        const contentType = res.headers.get('content-type') || 'application/json';
        const isBinary = contentType.startsWith('image/') || contentType === 'application/octet-stream' || contentType.includes('font/');
        const body = isBinary ? await res.arrayBuffer() : await res.text();
        const responseHeaders = new Headers();
        res.headers.forEach((value, key) => {
            const lower = key.toLowerCase();
            if (lower === 'connection' || lower === 'transfer-encoding' || lower === 'keep-alive' || lower === 'set-cookie') return;
            responseHeaders.set(key, value);
        });
        const setCookies = typeof (res.headers as any).getSetCookie === 'function'
            ? (res.headers as any).getSetCookie() as string[]
            : [];
        for (const cookie of setCookies) {
            responseHeaders.append('set-cookie', cookie);
        }
        if (!responseHeaders.has('content-type')) {
            responseHeaders.set('Content-Type', contentType);
        }

        return new NextResponse(body, {
            status: res.status,
            headers: responseHeaders,
        });
    } catch (err) {
        console.error('[API proxy]', targetUrl, err);
        const hint = BACKEND_URL.startsWith('http://backend:')
            ? ' Check that the backend container is running and on the same Docker network.'
            : '';
        return NextResponse.json(
            { message: 'Backend unreachable. Is the API running on ' + BACKEND_URL + '?' + hint },
            { status: 502 }
        );
    }
}
