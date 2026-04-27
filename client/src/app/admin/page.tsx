"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";
import {
    LogOut, HeartHandshake, ShieldCheck, Users, Package, BarChart3,
    Loader2, CheckCircle, XCircle, Clock, Activity, TrendingUp,
    UserCheck, Building2, Truck, Mail, Phone, MapPin, Calendar,
    AlertTriangle, Eye, ChevronRight
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

export default function AdminDashboard() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const [activePanel, setActivePanel] = useState<"overview" | "verify" | "donations" | "requests">("overview");
    const [analytics, setAnalytics] = useState<any>(null);
    const [donations, setDonations] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [pendingVolunteers, setPendingVolunteers] = useState<any[]>([]);
    const [pendingNGOs, setPendingNGOs] = useState<any[]>([]);
    const [allVolunteers, setAllVolunteers] = useState<any[]>([]);
    const [allNGOs, setAllNGOs] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [verifyTab, setVerifyTab] = useState<"pending" | "all">("pending");
    const [verifyType, setVerifyType] = useState<"volunteers" | "ngos">("volunteers");
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (!user || user.role !== "admin") { router.push("/auth"); return; }
        fetchAll();
    }, [user, router]);

    const fetchAll = async () => {
        setFetching(true);
        try {
            const [analyticsRes, donRes, reqRes, pvRes, pnRes, avRes, anRes] = await Promise.all([
                api.get("/api/admin/analytics"),
                api.get("/api/donations"),
                api.get("/api/requests"),
                api.get("/api/admin/volunteers/pending"),
                api.get("/api/admin/ngos/pending"),
                api.get("/api/admin/volunteers"),
                api.get("/api/admin/ngos"),
            ]);
            setAnalytics(analyticsRes.data);
            setDonations(donRes.data);
            setRequests(reqRes.data);
            setPendingVolunteers(pvRes.data);
            setPendingNGOs(pnRes.data);
            setAllVolunteers(avRes.data);
            setAllNGOs(anRes.data);
        } catch { /* ignore */ }
        setFetching(false);
    };

    const handleVerify = async (type: "volunteers" | "ngos", id: string, status: "approved" | "rejected") => {
        setProcessingId(id);
        try {
            await api.patch(`/api/admin/${type}/${id}/verify`, { status });
            toast.success(`${type === "volunteers" ? "Volunteer" : "NGO"} ${status} successfully!`);
            fetchAll();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to update status");
        } finally {
            setProcessingId(null);
        }
    };

    if (!user) return null;

    const pendingCount = (analytics?.pendingVolunteers || 0) + (analytics?.pendingNGOs || 0);

    const stats = [
        { label: "Total Users", value: analytics?.totalUsers || 0, icon: Users, gradient: "from-brand-500 to-brand-600" },
        { label: "Total Donations", value: analytics?.totalDonations || 0, icon: Package, gradient: "from-emerald-500 to-emerald-600" },
        { label: "Delivered", value: analytics?.deliveredDonations || 0, icon: CheckCircle, gradient: "from-green-500 to-green-600" },
        { label: "Pending Verification", value: pendingCount, icon: Clock, gradient: pendingCount > 0 ? "from-rose-500 to-rose-600" : "from-gray-400 to-gray-500" },
    ];

    const miniStats = [
        { label: "Donors", value: analytics?.totalDonors || 0, icon: Package },
        { label: "Volunteers", value: analytics?.totalVolunteers || 0, icon: Truck },
        { label: "NGOs", value: analytics?.totalNGOs || 0, icon: Building2 },
        { label: "NGO Requests", value: analytics?.totalRequests || 0, icon: Activity },
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

    const verifyStatusColor: Record<string, { bg: string; text: string; label: string }> = {
        pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Pending" },
        approved: { bg: "bg-green-100", text: "text-green-700", label: "Approved" },
        rejected: { bg: "bg-red-100", text: "text-red-700", label: "Rejected" },
    };

    const navItems = [
        { key: "overview", label: "Overview", icon: BarChart3 },
        { key: "verify", label: "Verification", icon: ShieldCheck, badge: pendingCount },
        { key: "donations", label: "Donations", icon: Package },
        { key: "requests", label: "NGO Requests", icon: Activity },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ====== NAV ====== */}
            <nav className="sticky top-0 z-50 glass border-b border-white/20">
                <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-lg">
                            <HeartHandshake className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-gray-900 tracking-tight">KindBridge</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200">
                            <ShieldCheck className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-semibold text-gray-700">Admin Panel</span>
                        </div>
                        {pendingCount > 0 && (
                            <button onClick={() => setActivePanel("verify")} className="relative">
                                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center">
                                    <ShieldCheck className="w-4 h-4 text-rose-600" />
                                </div>
                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">{pendingCount}</span>
                            </button>
                        )}
                        <NotificationBell />
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-white text-xs font-bold">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <button onClick={() => { logout(); router.push("/"); }}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 hover:text-rose-600 bg-white rounded-xl border border-gray-200 hover:border-rose-200 transition-all">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* ====== HEADER ====== */}
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900">Admin Control Center 🛡️</h1>
                    <p className="text-gray-500 mt-1">Monitor activity, verify accounts, and manage the platform.</p>
                </div>

                {/* ====== STATS ====== */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {stats.map((s, i) => (
                        <div key={i} className="card-premium p-5 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                                <s.icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="text-2xl font-extrabold text-gray-900">{fetching ? "—" : s.value}</div>
                                <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ====== TABS ====== */}
                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit flex-wrap">
                    {navItems.map(n => (
                        <button key={n.key} onClick={() => setActivePanel(n.key as any)}
                            className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all relative ${activePanel === n.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                }`}>
                            <n.icon className="w-4 h-4 inline mr-1.5 -mt-0.5" /> {n.label}
                            {n.badge && n.badge > 0 && (
                                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full">{n.badge}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ====== OVERVIEW ====== */}
                {activePanel === "overview" && (
                    <>
                        {/* Mini stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {miniStats.map((s, i) => (
                                <div key={i} className="card-premium p-4 flex items-center gap-3">
                                    <s.icon className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <div className="text-lg font-bold text-gray-900">{fetching ? "—" : s.value}</div>
                                        <div className="text-xs text-gray-400">{s.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Recent Donations */}
                            <div className="card-premium p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-gray-900">Recent Donations</h2>
                                    <button onClick={() => setActivePanel("donations")} className="text-xs text-brand-600 font-semibold hover:text-brand-700 flex items-center gap-1">View All <ChevronRight className="w-3 h-3" /></button>
                                </div>
                                {fetching ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-brand-500 animate-spin" /></div> : donations.length === 0 ? (
                                    <p className="text-gray-400 text-sm text-center py-10">No donations yet</p>
                                ) : (
                                    <div className="space-y-2">{donations.slice(0, 5).map(d => (
                                        <div key={d._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                                            <div className="min-w-0"><div className="text-sm font-semibold text-gray-900 truncate">{d.title}</div><div className="text-xs text-gray-400">{d.category} &middot; {d.donorId?.name || "Unknown"}</div></div>
                                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full capitalize ${statusColor[d.status]}`}>{d.status?.replace("_", " ")}</span>
                                        </div>
                                    ))}</div>
                                )}
                            </div>

                            {/* Recent Requests */}
                            <div className="card-premium p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-gray-900">Recent NGO Requests</h2>
                                    <button onClick={() => setActivePanel("requests")} className="text-xs text-purple-600 font-semibold hover:text-purple-700 flex items-center gap-1">View All <ChevronRight className="w-3 h-3" /></button>
                                </div>
                                {fetching ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-purple-500 animate-spin" /></div> : requests.length === 0 ? (
                                    <p className="text-gray-400 text-sm text-center py-10">No requests yet</p>
                                ) : (
                                    <div className="space-y-2">{requests.slice(0, 5).map(r => (
                                        <div key={r._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                                            <div className="min-w-0"><div className="text-sm font-semibold text-gray-900 truncate">{r.itemName}</div><div className="text-xs text-gray-400">{r.category} &middot; Qty: {r.quantityNeeded}</div></div>
                                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full capitalize ${urgencyColors[r.urgency]}`}>{r.urgency}</span>
                                        </div>
                                    ))}</div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* ====== VERIFICATION QUEUE ====== */}
                {activePanel === "verify" && (
                    <div className="card-premium p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <ShieldCheck className="w-5 h-5 text-brand-500" />
                            <h2 className="text-lg font-bold text-gray-900">Verification Queue</h2>
                        </div>

                        {/* Type Selector */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-6">
                            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit">
                                <button onClick={() => setVerifyType("volunteers")}
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${verifyType === "volunteers" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
                                    <Truck className="w-4 h-4 inline mr-1 -mt-0.5" /> Volunteers
                                    {pendingVolunteers.length > 0 && <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full">{pendingVolunteers.length}</span>}
                                </button>
                                <button onClick={() => setVerifyType("ngos")}
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${verifyType === "ngos" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
                                    <Building2 className="w-4 h-4 inline mr-1 -mt-0.5" /> NGOs
                                    {pendingNGOs.length > 0 && <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full">{pendingNGOs.length}</span>}
                                </button>
                            </div>
                            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit">
                                <button onClick={() => setVerifyTab("pending")}
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${verifyTab === "pending" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
                                    <Clock className="w-4 h-4 inline mr-1 -mt-0.5" /> Pending
                                </button>
                                <button onClick={() => setVerifyTab("all")}
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${verifyTab === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
                                    All
                                </button>
                            </div>
                        </div>

                        {/* Volunteer List */}
                        {verifyType === "volunteers" && (
                            <>
                                {(() => {
                                    const list = verifyTab === "pending" ? pendingVolunteers : allVolunteers;
                                    if (fetching) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-brand-500 animate-spin" /></div>;
                                    if (list.length === 0) return (
                                        <div className="text-center py-20">
                                            <UserCheck className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                            <p className="text-gray-400 font-semibold text-lg">{verifyTab === "pending" ? "No pending volunteer applications" : "No volunteers registered yet"}</p>
                                        </div>
                                    );
                                    return (
                                        <div className="space-y-4">
                                            {list.map((v: any) => {
                                                const vs = verifyStatusColor[v.verifyStatus] || verifyStatusColor.pending;
                                                return (
                                                    <div key={v._id} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-brand-200 transition-all">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
                                                                    {v.userId?.name?.charAt(0)?.toUpperCase() || "V"}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="font-bold text-gray-900 text-lg">{v.userId?.name || "Unknown"}</div>
                                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-500">
                                                                        <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{v.userId?.email}</span>
                                                                        <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{v.userId?.phone || "—"}</span>
                                                                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{v.userId?.city || "—"}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                                                        <span>ID Type: <strong className="text-gray-600">{v.idType || "—"}</strong></span>
                                                                        <span>Deliveries: <strong className="text-gray-600">{v.deliveryCount}</strong></span>
                                                                        <span>Rating: <strong className="text-gray-600">{v.rating?.toFixed(1) || "N/A"}</strong></span>
                                                                        {v.userId?.createdAt && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Joined: {new Date(v.userId.createdAt).toLocaleDateString()}</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <span className={`px-3 py-1.5 text-xs font-bold rounded-full ${vs.bg} ${vs.text}`}>{vs.label}</span>
                                                                {v.verifyStatus === "pending" && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleVerify("volunteers", v._id, "approved")}
                                                                            disabled={processingId === v._id}
                                                                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50">
                                                                            {processingId === v._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleVerify("volunteers", v._id, "rejected")}
                                                                            disabled={processingId === v._id}
                                                                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-all disabled:opacity-50">
                                                                            <XCircle className="w-4 h-4" /> Reject
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </>
                        )}

                        {/* NGO List */}
                        {verifyType === "ngos" && (
                            <>
                                {(() => {
                                    const list = verifyTab === "pending" ? pendingNGOs : allNGOs;
                                    if (fetching) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-purple-500 animate-spin" /></div>;
                                    if (list.length === 0) return (
                                        <div className="text-center py-20">
                                            <Building2 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                            <p className="text-gray-400 font-semibold text-lg">{verifyTab === "pending" ? "No pending NGO applications" : "No NGOs registered yet"}</p>
                                        </div>
                                    );
                                    return (
                                        <div className="space-y-4">
                                            {list.map((n: any) => {
                                                const ns = verifyStatusColor[n.verifyStatus] || verifyStatusColor.pending;
                                                return (
                                                    <div key={n._id} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-purple-200 transition-all">
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
                                                                    {n.orgName?.charAt(0)?.toUpperCase() || "N"}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="font-bold text-gray-900 text-lg">{n.orgName || "Unknown NGO"}</div>
                                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-500">
                                                                        <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{n.userId?.email}</span>
                                                                        <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{n.userId?.phone || "—"}</span>
                                                                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{n.address || "—"}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                                                        <span>Contact: <strong className="text-gray-600">{n.userId?.name || "—"}</strong></span>
                                                                        <span>City: <strong className="text-gray-600">{n.userId?.city || "—"}</strong></span>
                                                                        {n.mission && <span>Mission: <strong className="text-gray-600">{n.mission}</strong></span>}
                                                                        {n.userId?.createdAt && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Joined: {new Date(n.userId.createdAt).toLocaleDateString()}</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <span className={`px-3 py-1.5 text-xs font-bold rounded-full ${ns.bg} ${ns.text}`}>{ns.label}</span>
                                                                {n.verifyStatus === "pending" && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleVerify("ngos", n._id, "approved")}
                                                                            disabled={processingId === n._id}
                                                                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50">
                                                                            {processingId === n._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleVerify("ngos", n._id, "rejected")}
                                                                            disabled={processingId === n._id}
                                                                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-all disabled:opacity-50">
                                                                            <XCircle className="w-4 h-4" /> Reject
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </>
                        )}
                    </div>
                )}

                {/* ====== ALL DONATIONS ====== */}
                {activePanel === "donations" && (
                    <div className="card-premium p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Package className="w-5 h-5 text-brand-500" />
                            <h2 className="text-lg font-bold text-gray-900">All Platform Donations</h2>
                            <span className="ml-auto text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">{donations.length} total</span>
                        </div>
                        {fetching ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-brand-500 animate-spin" /></div> : (
                            <div className="space-y-2">
                                {donations.map(d => (
                                    <div key={d._id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50/80 hover:bg-brand-50/60 border border-transparent hover:border-brand-100 transition-all">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-brand-100/60 flex items-center justify-center flex-shrink-0"><Package className="w-5 h-5 text-brand-600" /></div>
                                            <div className="min-w-0"><div className="font-semibold text-gray-900 truncate">{d.title}</div><div className="text-sm text-gray-400">{d.category} &middot; {d.donorId?.name || "Unknown"}</div></div>
                                        </div>
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${statusColor[d.status]}`}>{d.status?.replace("_", " ")}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ====== ALL REQUESTS ====== */}
                {activePanel === "requests" && (
                    <div className="card-premium p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Activity className="w-5 h-5 text-purple-500" />
                            <h2 className="text-lg font-bold text-gray-900">All NGO Requests</h2>
                            <span className="ml-auto text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">{requests.length} total</span>
                        </div>
                        {fetching ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-purple-500 animate-spin" /></div> : (
                            <div className="space-y-2">
                                {requests.map(r => (
                                    <div key={r._id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50/80 hover:bg-purple-50/60 border border-transparent hover:border-purple-100 transition-all">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-purple-100/60 flex items-center justify-center flex-shrink-0"><Activity className="w-5 h-5 text-purple-600" /></div>
                                            <div className="min-w-0"><div className="font-semibold text-gray-900 truncate">{r.itemName}</div><div className="text-sm text-gray-400">{r.category} &middot; Qty: {r.quantityNeeded} &middot; {r.ngoId?.orgName || "Unknown NGO"}</div></div>
                                        </div>
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${urgencyColors[r.urgency]}`}>{r.urgency}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
