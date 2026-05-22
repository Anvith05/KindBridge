import axios from 'axios';

// Create a globally configured Axios instance
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '',
});

// Auto-inject JWT token if it exists in localStorage
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
            try {
                const parsed = JSON.parse(authStorage);
                const token = parsed?.state?.token ?? parsed?.token;
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } catch {
                // ignore parse error
            }
        }
    }
    return config;
});

export default api;
