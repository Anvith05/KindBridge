"use client";

import { useState, useRef, useEffect } from "react";
import { useSocket } from "@/providers/SocketProvider";
import { Bell, X, Check, CheckCheck } from "lucide-react";

export default function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllRead } = useSocket();
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all"
            >
                <Bell className="w-4 h-4 text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[200] animate-fade-in">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="text-xs text-brand-600 font-semibold hover:text-brand-700 flex items-center gap-1"
                                >
                                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)} className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                                <X className="w-3.5 h-3.5 text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="text-center py-12">
                                <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                <p className="text-gray-400 text-sm font-medium">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n._id}
                                    onClick={() => !n.isRead && markAsRead(n._id)}
                                    className={`flex items-start gap-3 p-4 border-b border-gray-50 cursor-pointer transition-colors ${!n.isRead ? "bg-brand-50/30 hover:bg-brand-50/60" : "hover:bg-gray-50"
                                        }`}
                                >
                                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.isRead ? "bg-brand-500" : "bg-transparent"}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm leading-relaxed ${!n.isRead ? "text-gray-900 font-medium" : "text-gray-600"}`}>
                                            {n.message}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
