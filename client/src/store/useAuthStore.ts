import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

export type Role = 'donor' | 'volunteer' | 'ngo' | 'admin';

interface User {
    _id: string;
    name: string;
    email: string;
    role: Role;
}

interface AuthState {
    user: User | null;
    token: string | null;
    login: (userData: User, token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            login: (user, token) => set({ user, token }),
            logout: () => set({ user: null, token: null }),
        }),
        {
            name: 'auth-storage', // saves to local storage automatically
        }
    )
);
