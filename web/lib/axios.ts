import axios from 'axios';

const api = axios.create({
    baseURL: typeof window !== 'undefined' ? '/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000'),
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

async function clearAccessSession() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    try {
        await fetch('/api/session', { method: 'DELETE', credentials: 'same-origin' });
    } catch {
        // Cookie clear is best-effort; 401 handling still continues.
    }
}

let last502Toast = 0;
const BACKEND_502_COOLDOWN_MS = 15000;

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        if (typeof window !== 'undefined' && error.response?.status === 502) {
            const now = Date.now();
            if (now - last502Toast > BACKEND_502_COOLDOWN_MS) {
                last502Toast = now;
                import('react-hot-toast').then(({ default: toast }) => {
                    toast.error('Backend unavailable. Check that the API service is running.', { duration: 6000 });
                });
            }
        }
        if (typeof window !== 'undefined' && error.response?.status === 401) {
            const url = String(error.config?.url || '');
            const isAuthRequest = url.includes('/auth/') || url.includes('/session');
            if (!isAuthRequest) {
                await clearAccessSession();
                const path = window.location.pathname || '';
                const onProtected =
                    path.startsWith('/dashboard') ||
                    path.startsWith('/admin') ||
                    path.startsWith('/checkout') ||
                    path.startsWith('/account');
                if (onProtected) {
                    window.location.href = `/login?session=expired&from=${encodeURIComponent(path)}`;
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
