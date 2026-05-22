"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";
import {
    LogOut, Plus, Package, Clock, CheckCircle, HeartHandshake,
    LayoutDashboard, History, X, Trash2, Eye, MapPin, Calendar,
    TrendingUp, Filter, Search, ChevronDown, AlertCircle, Loader2, Play
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import WatchAndEarn from "@/components/WatchAndEarn";

const ROLE_HOME: Record<string, string> = {
    donor: "/donor",
    volunteer: "/volunteer",
    ngo: "/ngo",
    admin: "/admin",
};

export default function DonorDashboard() {
    const { user, logout, setUser } = useAuthStore();
    const router = useRouter();
    const [donations, setDonations] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [detailModal, setDetailModal] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [activeTab, setActiveTab] = useState<"my" | "requests" | "watch">("my");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    // Form
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("Clothing");
    const [description, setDescription] = useState("");
    const [condition, setCondition] = useState("gently_used");
    const [pickupAddress, setPickupAddress] = useState("");
    const [availFrom, setAvailFrom] = useState("");
    const [availTo, setAvailTo] = useState("");
    const hasInitialized = useRef(false);

    const fetchAll = useCallback(async (showLoader = true) => {
        if (showLoader) setFetching(true);
        try {
            const [donRes, reqRes] = await Promise.all([
                api.get("/api/donations/my"),
                api.get("/api/requests"),
            ]);
            setDonations(donRes.data);
            setRequests(reqRes.data);
        } catch { /* ignore */ }
        if (showLoader) setFetching(false);
    }, []);

    useEffect(() => {
        if (!user) {
            hasInitialized.current = false;
            router.push("/auth");
            return;
        }

        if (hasInitialized.current) return;
        hasInitialized.current = true;

        const init = async () => {
            try {
                const { data } = await api.get("/api/auth/me");
                if (data.role !== "donor") {
                    router.replace(ROLE_HOME[data.role] || "/auth");
                    return;
                }
                if (
                    user._id !== data._id ||
                    user.role !== data.role ||
                    user.name !== data.name ||
                    user.email !== data.email
                ) {
                    setUser({ _id: data._id, name: data.name, email: data.email, role: data.role });
                }
                await fetchAll();
            } catch {
                if (user.role !== "donor") {
                    router.replace(ROLE_HOME[user.role] || "/auth");
                    return;
                }
                await fetchAll();
            }
        };
        init();
    }, [user?._id, router, setUser, fetchAll]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post("/api/donations", {
                title, category, description, condition, pickupAddress,
                availabilityFrom: availFrom, availabilityTo: availTo,
            });
            toast.success("Donation posted successfully!");
            setShowModal(false);
            resetForm();
            fetchAll();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to post donation");
        } finally { setLoading(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this donation?")) return;
        try {
            await api.delete(`/api/donations/${id}`);
            toast.success("Donation deleted");
            fetchAll();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to delete");
        }
    };

    const handleAcceptRequest = async (id: string) => {
        try {
            await api.post(`/api/requests/${id}/accept`);
            toast.success("Request accepted! You can fulfill it when ready.");
            fetchAll();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to accept request");
        }
    };

    const handleFulfillRequest = async (id: string) => {
        if (!confirm("Mark this NGO request as fulfilled?")) return;
        try {
            await api.patch(`/api/requests/${id}/fulfill`);
            toast.success("Request marked as fulfilled!");
            fetchAll();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to fulfill request");
        }
    };

    const resetForm = () => {
        setTitle(""); setDescription(""); setPickupAddress("");
        setAvailFrom(""); setAvailTo(""); setCategory("Clothing");
        setCondition("gently_used");
    };

    const filtered = useMemo(() => {
        return donations.filter(d => {
            const matchSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                d.category.toLowerCase().includes(searchTerm.toLowerCase());
            const matchFilter = filterStatus === "all" || d.status === filterStatus;
            return matchSearch && matchFilter;
        });
    }, [donations, searchTerm, filterStatus]);

    if (!user) return null;

    const stats = [
        { label: "Total Donations", value: donations.length, icon: Package, gradient: "from-brand-500 to-brand-600", bg: "bg-brand-50" },
        { label: "Available", value: donations.filter(d => d.status === "available").length, icon: Clock, gradient: "from-warm-500 to-warm-600", bg: "bg-warm-50" },
        { label: "Picked Up", value: donations.filter(d => d.status === "picked_up" || d.status === "assigned").length, icon: TrendingUp, gradient: "from-purple-500 to-purple-600", bg: "bg-purple-50" },
        { label: "Delivered", value: donations.filter(d => d.status === "delivered").length, icon: CheckCircle, gradient: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50" },
    ];

    const statusColor: Record<string, string> = {
        available: "bg-emerald-100 text-emerald-700",
        assigned: "bg-blue-100 text-blue-700",
        picked_up: "bg-yellow-100 text-yellow-700",
        delivered: "bg-brand-100 text-brand-700",
        cancelled: "bg-gray-100 text-gray-600",
    };

    const urgencyColors: Record<string, string> = {
        low: "bg-green-100 text-green-700",
        medium: "bg-yellow-100 text-yellow-700",
        high: "bg-orange-100 text-orange-700",
        critical: "bg-red-100 text-red-700",
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ====== NAV ====== */}
            <nav className="sticky top-0 z-50 glass border-b border-white/20">
                <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/20">
                            <HeartHandshake className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-gray-900 tracking-tight">KindBridge</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-brand-50 rounded-lg border border-brand-100">
                            <LayoutDashboard className="w-4 h-4 text-brand-600" />
                            <span className="text-sm font-semibold text-brand-700">Donor Dashboard</span>
                        </div>
                        <NotificationBell />
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold">
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
                        <h1 className="text-3xl font-extrabold text-gray-900">Welcome, {user.name} 👋</h1>
                        <p className="text-gray-500 mt-1">Manage your donations and browse NGO supply requests.</p>
                    </div>
                    <button onClick={() => setShowModal(true)}
                        className="btn-primary !py-3 !px-6 !rounded-xl text-sm flex items-center gap-2 whitespace-nowrap">
                        <Plus className="w-4 h-4" /> New Donation
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
                    <button onClick={() => setActiveTab("my")}
                        className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === "my" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            }`}>
                        <Package className="w-4 h-4 inline mr-1.5 -mt-0.5" /> My Donations
                    </button>
                    <button onClick={() => setActiveTab("requests")}
                        className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === "requests" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            }`}>
                        <AlertCircle className="w-4 h-4 inline mr-1.5 -mt-0.5" /> NGO Requests
                    </button>
                    <button onClick={() => setActiveTab("watch")}
                        className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === "watch" ? "bg-white text-brand-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            }`}>
                        <Play className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Watch & Earn
                    </button>
                </div>

                {/* ====== MY DONATIONS TAB ====== */}
                {activeTab === "my" && (
                    <div className="card-premium p-6">
                        {/* Search & Filter Bar */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <div className="relative flex-1">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    className="input-premium !pl-11" placeholder="Search donations..."
                                />
                            </div>
                            <div className="relative">
                                <Filter className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                                    className="input-premium !pl-11 !pr-10 appearance-none min-w-[160px]">
                                    <option value="all">All Status</option>
                                    <option value="available">Available</option>
                                    <option value="assigned">Assigned</option>
                                    <option value="picked_up">Picked Up</option>
                                    <option value="delivered">Delivered</option>
                                </select>
                                <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {fetching ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-20">
                                <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400 font-semibold text-lg">No donations found</p>
                                <p className="text-sm text-gray-300 mt-1">Click "New Donation" to post your first item!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filtered.map((d) => (
                                    <div key={d._id} className="group flex items-center justify-between p-4 rounded-xl bg-gray-50/80 hover:bg-brand-50/60 border border-transparent hover:border-brand-100 transition-all duration-300">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-brand-100/60 flex items-center justify-center flex-shrink-0">
                                                <Package className="w-5 h-5 text-brand-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-semibold text-gray-900 truncate">{d.title}</div>
                                                <div className="text-sm text-gray-400 flex items-center gap-2 flex-wrap">
                                                    <span>{d.category}</span>
                                                    <span>&middot;</span>
                                                    <span className="capitalize">{d.condition?.replace("_", " ")}</span>
                                                    {d.pickupAddress && (
                                                        <>
                                                            <span>&middot;</span>
                                                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{d.pickupAddress.substring(0, 30)}...</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${statusColor[d.status] || "bg-gray-100 text-gray-600"}`}>
                                                {d.status?.replace("_", " ")}
                                            </span>
                                            <button onClick={() => setDetailModal(d)} className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-brand-50 hover:border-brand-200 transition-all opacity-0 group-hover:opacity-100">
                                                <Eye className="w-4 h-4 text-gray-500" />
                                            </button>
                                            {d.status === "available" && (
                                                <button onClick={() => handleDelete(d._id)} className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-rose-50 hover:border-rose-200 transition-all opacity-0 group-hover:opacity-100">
                                                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-rose-500" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ====== NGO REQUESTS TAB ====== */}
                {activeTab === "requests" && (
                    <div className="card-premium p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <AlertCircle className="w-5 h-5 text-brand-400" />
                            <h2 className="text-lg font-bold text-gray-900">Active NGO Supply Requests</h2>
                            <span className="ml-auto text-xs font-bold bg-brand-50 text-brand-600 px-2.5 py-1 rounded-full">{requests.length} active</span>
                        </div>

                        {requests.length === 0 ? (
                            <div className="text-center py-20">
                                <AlertCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400 font-semibold">No active NGO requests right now</p>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 gap-4">
                                {requests.map((r) => (
                                    <div key={r._id} className="p-5 rounded-xl bg-gray-50 border border-gray-100 hover:border-brand-200 hover:shadow-sm transition-all">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <div className="font-bold text-gray-900 text-lg">{r.itemName}</div>
                                                <div className="text-sm text-gray-500">{r.category} &middot; Qty: {r.quantityNeeded}</div>
                                            </div>
                                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${urgencyColors[r.urgency] || "bg-gray-100 text-gray-600"}`}>
                                                {r.urgency}
                                            </span>
                                        </div>
                                        {r.ngoId && (
                                            <div className="text-xs text-gray-400 mt-2">
                                                From: <span className="font-medium text-gray-600">{r.ngoId.orgName || "NGO"}</span>
                                            </div>
                                        )}
                                        {r.deadline && (
                                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                                <Calendar className="w-3 h-3" />
                                                Deadline: {new Date(r.deadline).toLocaleDateString()}
                                            </div>
                                        )}
                                        {r.status === "pledged" && r.pledgedByDonorId && (
                                            <div className="text-xs text-brand-600 mt-2 font-medium">
                                                Accepted by {r.pledgedByDonorId.name || "a donor"}
                                                {String(r.pledgedByDonorId._id) === String(user?._id) ? " (you)" : ""}
                                            </div>
                                        )}
                                        <div className="mt-4 flex gap-2">
                                            {r.status === "active" && (
                                                <button
                                                    onClick={() => handleAcceptRequest(r._id)}
                                                    className="flex-1 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-brand-500 to-brand-600 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                                >
                                                    <HeartHandshake className="w-4 h-4" /> Accept to Fulfill
                                                </button>
                                            )}
                                            {r.status === "pledged" && String(r.pledgedByDonorId?._id) === String(user?._id) && (
                                                <button
                                                    onClick={() => handleFulfillRequest(r._id)}
                                                    className="flex-1 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle className="w-4 h-4" /> Mark Fulfilled
                                                </button>
                                            )}
                                            {r.status === "pledged" && String(r.pledgedByDonorId?._id) !== String(user?._id) && (
                                                <span className="flex-1 py-2.5 text-sm font-semibold text-center text-gray-400 bg-gray-100 rounded-xl">
                                                    Already accepted
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                
                {/* ====== WATCH & EARN TAB ====== */}
                {activeTab === "watch" && <WatchAndEarn />}
            </main>

            {/* ====== DETAIL MODAL ====== */}
            {detailModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setDetailModal(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Donation Details</h2>
                            <button onClick={() => setDetailModal(null)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-gray-900">{detailModal.title}</h3>
                                <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${statusColor[detailModal.status]}`}>
                                    {detailModal.status?.replace("_", " ")}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <InfoBlock label="Category" value={detailModal.category} />
                                <InfoBlock label="Condition" value={detailModal.condition?.replace("_", " ")} />
                            </div>
                            {detailModal.description && <InfoBlock label="Description" value={detailModal.description} />}
                            <InfoBlock label="Pickup Address" value={detailModal.pickupAddress} icon={<MapPin className="w-4 h-4 text-gray-400 inline mr-1" />} />
                            <div className="grid grid-cols-2 gap-4">
                                <InfoBlock label="Available From" value={detailModal.availabilityFrom ? new Date(detailModal.availabilityFrom).toLocaleDateString() : "—"} />
                                <InfoBlock label="Available To" value={detailModal.availabilityTo ? new Date(detailModal.availabilityTo).toLocaleDateString() : "—"} />
                            </div>
                            <InfoBlock label="Posted" value={new Date(detailModal.createdAt).toLocaleString()} />
                        </div>
                    </div>
                </div>
            )}

            {/* ====== CREATE MODAL ====== */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Post a Donation</h2>
                            <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Item Title</label>
                                <input required value={title} onChange={e => setTitle(e.target.value)} className="input-premium" placeholder="e.g. Winter Jacket" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                                    <select value={category} onChange={e => setCategory(e.target.value)} className="input-premium">
                                        <option>Clothing</option><option>Food</option><option>Books</option><option>Electronics</option><option>Furniture</option><option>Toys</option><option>Medical</option><option>Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Condition</label>
                                    <select value={condition} onChange={e => setCondition(e.target.value)} className="input-premium">
                                        <option value="new">New</option><option value="gently_used">Gently Used</option><option value="heavily_used">Heavily Used</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="input-premium resize-none" placeholder="Brief description of the item..." />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pickup Address</label>
                                <input required value={pickupAddress} onChange={e => setPickupAddress(e.target.value)} className="input-premium" placeholder="Full address for volunteer pickup" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Available From</label>
                                    <input type="date" required value={availFrom} onChange={e => setAvailFrom(e.target.value)} className="input-premium" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Available To</label>
                                    <input type="date" required value={availTo} onChange={e => setAvailTo(e.target.value)} className="input-premium" />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5 !rounded-xl text-sm flex items-center justify-center gap-2 mt-2">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-4 h-4" /> Post Donation</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoBlock({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
    return (
        <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</div>
            <div className="text-sm font-medium text-gray-800 capitalize">{icon}{value || "—"}</div>
        </div>
    );
}
