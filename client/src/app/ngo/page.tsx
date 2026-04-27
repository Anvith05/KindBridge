"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";
import {
    LogOut, HeartHandshake, Plus, X, ClipboardList, Package,
    AlertTriangle, CheckCircle2, Loader2, Trash2, Calendar,
    BarChart3, Eye, Search, Filter, ChevronDown
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

export default function NGODashboard() {
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const [requests, setRequests] = useState<any[]>([]);
    const [donations, setDonations] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [detailModal, setDetailModal] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [activeTab, setActiveTab] = useState<"requests" | "donations">("requests");

    const [itemName, setItemName] = useState("");
    const [category, setCategory] = useState("Clothing");
    const [quantityNeeded, setQuantityNeeded] = useState("");
    const [urgency, setUrgency] = useState("medium");
    const [deadline, setDeadline] = useState("");

    useEffect(() => {
        if (!user || user.role !== "ngo") { router.push("/auth"); return; }
        fetchAll();
    }, [user, router]);

    const fetchAll = async () => {
        setFetching(true);
        try {
            const [reqRes, donRes] = await Promise.all([
                api.get("/api/requests"),
                api.get("/api/donations"),
            ]);
            setRequests(reqRes.data);
            setDonations(donRes.data);
        } catch { /* ignore */ }
        setFetching(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post("/api/requests", { itemName, category, quantityNeeded: Number(quantityNeeded), urgency, deadline: deadline || undefined });
            toast.success("Request posted successfully!");
            setShowModal(false);
            setItemName(""); setQuantityNeeded(""); setDeadline(""); setUrgency("medium");
            fetchAll();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to post request");
        } finally { setLoading(false); }
    };

    const handleDeleteRequest = async (id: string) => {
        if (!confirm("Delete this request?")) return;
        try {
            await api.delete(`/api/requests/${id}`);
            toast.success("Request deleted");
            fetchAll();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to delete");
        }
    };

    if (!user) return null;

    const urgencyColors: Record<string, string> = {
        low: "bg-green-100 text-green-700",
        medium: "bg-yellow-100 text-yellow-700",
        high: "bg-orange-100 text-orange-700",
        critical: "bg-red-100 text-red-700",
    };

    const stats = [
        { label: "Total Requests", value: requests.length, icon: ClipboardList, gradient: "from-purple-500 to-purple-600" },
        { label: "High Priority", value: requests.filter(r => r.urgency === "critical" || r.urgency === "high").length, icon: AlertTriangle, gradient: "from-rose-500 to-rose-600" },
        { label: "Fulfilled", value: requests.filter(r => r.status === "fulfilled").length, icon: CheckCircle2, gradient: "from-emerald-500 to-emerald-600" },
        { label: "Available Donations", value: donations.length, icon: Package, gradient: "from-brand-500 to-brand-600" },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ====== NAV ====== */}
            <nav className="sticky top-0 z-50 glass border-b border-white/20">
                <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <HeartHandshake className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-gray-900 tracking-tight">KindBridge</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg border border-purple-100">
                            <ClipboardList className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-semibold text-purple-700">NGO</span>
                        </div>
                        <NotificationBell />
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xs font-bold">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <button onClick={() => { logout(); router.push("/"); }}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 hover:text-rose-600 bg-white rounded-xl border border-gray-200 hover:border-rose-200 transition-all">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* ====== HEADER ====== */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">NGO Dashboard 🏛️</h1>
                        <p className="text-gray-500 mt-1">Post supply requests and track available donations.</p>
                    </div>
                    <button onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-xl transition-all whitespace-nowrap">
                        <Plus className="w-4 h-4" /> New Request
                    </button>
                </div>

                {/* ====== STATS ====== */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {stats.map((s, i) => (
                        <div key={i} className="card-premium p-5 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                                <s.icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="text-2xl font-extrabold text-gray-900">{s.value}</div>
                                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ====== TABS ====== */}
                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
                    <button onClick={() => setActiveTab("requests")}
                        className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === "requests" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            }`}>
                        <ClipboardList className="w-4 h-4 inline mr-1.5 -mt-0.5" /> My Requests
                    </button>
                    <button onClick={() => setActiveTab("donations")}
                        className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === "donations" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            }`}>
                        <Package className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Available Donations
                    </button>
                </div>

                {/* ====== MY REQUESTS TAB ====== */}
                {activeTab === "requests" && (
                    <div className="card-premium p-6">
                        {fetching ? (
                            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-purple-500 animate-spin" /></div>
                        ) : requests.length === 0 ? (
                            <div className="text-center py-20">
                                <ClipboardList className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400 font-semibold text-lg">No supply requests yet</p>
                                <p className="text-sm text-gray-300 mt-1">Click "New Request" to post your first need!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {requests.map((r) => (
                                    <div key={r._id} className="group flex items-center justify-between p-4 rounded-xl bg-gray-50/80 hover:bg-purple-50/60 border border-transparent hover:border-purple-100 transition-all duration-300">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-purple-100/60 flex items-center justify-center flex-shrink-0">
                                                <ClipboardList className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-semibold text-gray-900 truncate">{r.itemName}</div>
                                                <div className="text-sm text-gray-400">{r.category} &middot; Qty: {r.quantityNeeded} {r.deadline && <>&middot; <Calendar className="w-3 h-3 inline" /> {new Date(r.deadline).toLocaleDateString()}</>}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${urgencyColors[r.urgency]}`}>{r.urgency}</span>
                                            <button onClick={() => handleDeleteRequest(r._id)}
                                                className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-rose-50 hover:border-rose-200 transition-all opacity-0 group-hover:opacity-100">
                                                <Trash2 className="w-4 h-4 text-gray-400 hover:text-rose-500" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ====== AVAILABLE DONATIONS TAB ====== */}
                {activeTab === "donations" && (
                    <div className="card-premium p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Package className="w-5 h-5 text-brand-500" />
                            <h2 className="text-lg font-bold text-gray-900">Available Donations</h2>
                            <span className="ml-auto text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">{donations.length} items</span>
                        </div>
                        {donations.length === 0 ? (
                            <div className="text-center py-20">
                                <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400 font-semibold">No donations available right now</p>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 gap-4">
                                {donations.map((d) => (
                                    <div key={d._id} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-brand-200 hover:shadow-md transition-all duration-300">
                                        <div className="font-bold text-gray-900 text-lg mb-1">{d.title}</div>
                                        <div className="text-sm text-gray-500 mb-2">{d.category} &middot; <span className="capitalize">{d.condition?.replace("_", " ")}</span></div>
                                        {d.pickupAddress && <div className="text-xs text-gray-400 flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {d.pickupAddress}</div>}
                                        {d.donorId && <div className="text-xs text-gray-400 mt-1">From: <span className="font-medium text-gray-600">{d.donorId.name}</span></div>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* ====== CREATE REQUEST MODAL ====== */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">New Supply Request</h2>
                            <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200"><X className="w-4 h-4 text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Item Name</label><input required value={itemName} onChange={e => setItemName(e.target.value)} className="input-premium" placeholder="e.g. Blankets, Rice, Medicines" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label><select value={category} onChange={e => setCategory(e.target.value)} className="input-premium"><option>Clothing</option><option>Food</option><option>Books</option><option>Electronics</option><option>Furniture</option><option>Medical</option><option>Other</option></select></div>
                                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Quantity Needed</label><input type="number" required value={quantityNeeded} onChange={e => setQuantityNeeded(e.target.value)} className="input-premium" placeholder="50" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Urgency</label><select value={urgency} onChange={e => setUrgency(e.target.value)} className="input-premium"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div>
                                <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Deadline</label><input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="input-premium" /></div>
                            </div>
                            <button type="submit" disabled={loading} className="w-full py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transition-all mt-2 flex items-center justify-center gap-2">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-4 h-4" /> Post Request</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
