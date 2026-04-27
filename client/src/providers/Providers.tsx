"use client";

import { Toaster } from "react-hot-toast";
import { SocketProvider } from "@/providers/SocketProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SocketProvider>
            {children}
            <Toaster position="top-center" toastOptions={{
                style: {
                    borderRadius: '12px',
                    background: '#1a1a2e',
                    color: '#fff',
                    fontSize: '14px',
                    padding: '12px 20px',
                },
            }} />
        </SocketProvider>
    );
}
