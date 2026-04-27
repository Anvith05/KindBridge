import axios from 'axios';

// Create a globally configured Axios instance
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
});

// Auto-inject JWT token if it exists in localStorage
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
            try {
                const { state } = JSON.parse(authStorage);
                if (state?.token) {
                    config.headers.Authorization = `Bearer ${state.token}`;
                }
            } catch (err) {
                // ignore parse error
            }
        }
    }
    return config;
});

export default api;
