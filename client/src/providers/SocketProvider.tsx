"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/useAuthStore";
import toast from "react-hot-toast";
import api from "@/lib/api";

interface NotificationItem {
    _id: string;
    type: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    data?: any;
}

interface SocketContextType {
    socket: Socket | null;
    notifications: NotificationItem[];
    unreadCount: number;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    notifications: [],
    unreadCount: 0,
    fetchNotifications: async () => { },
    markAsRead: async () => { },
    markAllRead: async () => { },
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: ReactNode }) {
    const { user, token } = useAuthStore();
    const socketRef = useRef<Socket | null>(null);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        if (!token) return;
        try {
            const [notifRes, countRes] = await Promise.all([
                api.get("/api/notifications"),
                api.get("/api/notifications/unread-count"),
            ]);
            setNotifications(notifRes.data);
            setUnreadCount(countRes.data.count);
        } catch { /* ignore */ }
    }, [token]);

    const markAsRead = useCallback(async (id: string) => {
        try {
            await api.patch(`/api/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { /* ignore */ }
    }, []);

    const markAllRead = useCallback(async () => {
        try {
            await api.patch("/api/notifications/read-all");
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        if (!user || !token) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            return;
        }

        // Connect to the backend socket server
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";
        const socket = io(apiUrl, { transports: ["websocket", "polling"] });
        socketRef.current = socket;

        socket.on("connect", () => {
            // Join personal room
            socket.emit("join", user._id);
            // Join role room
            socket.emit("joinRole", user.role);
        });

        // Listen for any event and show a toast
        const events = [
            "donation:accepted",
            "donation:pickedUp",
            "donation:delivered",
            "delivery:new",
            "volunteer:rated",
            "verification:update",
        ];

        events.forEach(event => {
            socket.on(event, (data: any) => {
                if (data.message) {
                    toast(data.message, { icon: "🔔", duration: 5000 });
                }
                // Refresh notifications
                fetchNotifications();
            });
        });

        // Initial fetch
        fetchNotifications();

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [user, token, fetchNotifications]);

    return (
        <SocketContext.Provider value={{
            socket: socketRef.current,
            notifications,
            unreadCount,
            fetchNotifications,
            markAsRead,
            markAllRead,
        }}>
            {children}
        </SocketContext.Provider>
    );
}
