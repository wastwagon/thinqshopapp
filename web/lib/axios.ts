import axios from 'axios';

// In browser use /api so Next.js rewrites proxy to the backend (avoids CORS and wrong port)
const api = axios.create({
    baseURL: typeof window !== 'undefined' ? '/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000'),
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (typeof window !== 'undefined' && error.response?.status === 401) {
            const isAuthRequest = error.config?.url?.includes('/auth/');
            if (!isAuthRequest) {
                localStorage.removeItem('token');
                document.cookie = 'thinq_session=; path=/; max-age=0';
                window.location.href = '/login?session=expired';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
