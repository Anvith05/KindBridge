"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";
import {
    LogOut, HeartHandshake, Trophy, MapPin, Truck, Star, Package,
    CheckCircle, Clock, Loader2, Navigation, Eye, X, Calendar, User
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import IndiaLocationPicker, { type IndiaLocationValue } from "@/components/IndiaLocationPicker";

const ROLE_HOME: Record<string, string> = {
    donor: "/donor",
    volunteer: "/volunteer",
    ngo: "/ngo",
    admin: "/admin",
};

function parseIndianAddress(addr: string): IndiaLocationValue {
    if (!addr?.trim()) {
        return { state: "", city: "", locality: "", label: "" };
    }
    const parts = addr.replace(/,?\s*India\s*$/i, "").split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
        const state = parts[parts.length - 1] ?? "";
        const city = parts[parts.length - 2] ?? "";
        const locality = parts.length > 2 ? parts.slice(0, -2).join(", ") : "";
        return { state, city, locality, label: addr };
    }
    return { state: "", city: "", locality: parts[0] ?? "", label: addr };
}

export default function VolunteerDashboard() {
    const { user, logout, setUser } = useAuthStore();
    const router = useRouter();
    const [donations, setDonations] = useState<any[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [myDeliveries, setMyDeliveries] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [detailModal, setDetailModal] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<"available" | "mydeliveries" | "leaderboard">("available");
    const [otpInput, setOtpInput] = useState<Record<string, string>>({});
    const [photoInput, setPhotoInput] = useState<Record<string, File | null>>({});
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [locationReady, setLocationReady] = useState(false);
    const [locationForm, setLocationForm] = useState<IndiaLocationValue>({
        state: "", city: "", locality: "", label: "",
    });
    const [savedAddress, setSavedAddress] = useState("");
    const [searchRadius, setSearchRadius] = useState(15);
    const [savingLocation, setSavingLocation] = useState(false);
    const [locationPickerKey, setLocationPickerKey] = useState(0);
    const hasInitialized = useRef(false);

    const fetchData = useCallback(async (showLoader = true) => {
        if (showLoader) setFetching(true);
        try {
            const profileRes = await api.get("/api/volunteers/me");
            const profile = profileRes.data;
            const hasLocation = profile?.location?.coordinates?.length === 2;

            if (hasLocation) {
                setLocationReady(true);
                const saved = profile?.presentAddress ?? "";
                setSavedAddress(saved);
                setLocationForm(parseIndianAddress(saved));
            } else {
                setLocationReady(false);
                setDonations([]);
            }

            const [lbRes, delRes] = await Promise.all([
                api.get("/api/volunteers/leaderboard"),
                api.get("/api/deliveries/my"),
            ]);
            setLeaderboard(lbRes.data);
            setMyDeliveries(delRes.data);

            if (hasLocation) {
                const nearbyRes = await api.get("/api/volunteers/nearby-donations");
                setDonations(nearbyRes.data.donations || []);
                setSearchRadius(nearbyRes.data.radiusKm || 15);
                const saved = nearbyRes.data?.presentAddress || profile?.presentAddress || "";
                setSavedAddress(saved);
            }
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
                if (data.role !== "volunteer") {
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
            } catch {
                if (user.role !== "volunteer") {
                    router.replace(ROLE_HOME[user.role] || "/auth");
                    return;
                }
            }
            await fetchData();
        };
        init();
    }, [user?._id, router, setUser, fetchData]);

    const handleLocationChange = useCallback((value: IndiaLocationValue) => {
        setLocationForm(value);
    }, []);

    const handleOpenChangeAddress = () => {
        setLocationForm(parseIndianAddress(savedAddress));
        setLocationPickerKey((k) => k + 1);
        setLocationReady(false);
    };

    const handleSetLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!locationForm.city || !locationForm.state) {
            toast.error("Please select your state and city");
            return;
        }
        setSavingLocation(true);
        try {
            await api.patch("/api/volunteers/location", {
                city: locationForm.city,
                state: locationForm.state,
                locality: locationForm.locality.trim() || undefined,
            });
            toast.success("Location saved! Showing pickups near you.");
            setLocationReady(true);
            await fetchData(false);
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to save location");
        } finally {
            setSavingLocation(false);
        }
    };

    const handleAccept = async (donationId: string) => {
        try {
            await api.post(`/api/deliveries/${donationId}/accept`);
            toast.success("Delivery accepted! OTP has been generated.");
            fetchData(false);
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to accept delivery");
        }
    };

    const handleConfirmPickup = async (deliveryId: string) => {
        const otp = otpInput[deliveryId];
        const photo = photoInput[deliveryId];
        if (!otp || otp.length !== 4) { toast.error("Enter a valid 4-digit OTP"); return; }
        if (!photo) { toast.error("Please upload a pickup photo"); return; }
        
        setProcessingId(deliveryId);
        try {
            const formData = new FormData();
            formData.append('otp', otp);
            formData.append('photo', photo);
            
            await api.patch(`/api/deliveries/${deliveryId}/pickup`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            toast.success("Pickup confirmed! Dropoff OTP generated.");
            setOtpInput(prev => ({ ...prev, [deliveryId]: "" }));
            setPhotoInput(prev => ({ ...prev, [deliveryId]: null }));
            fetchData(false);
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Pickup confirmation failed");
        } finally { setProcessingId(null); }
    };

    const handleConfirmDelivery = async (deliveryId: string) => {
        const otp = otpInput[deliveryId];
        if (!otp || otp.length !== 4) { toast.error("Enter a valid 4-digit OTP"); return; }
        setProcessingId(deliveryId);
        try {
            await api.patch(`/api/deliveries/${deliveryId}/deliver`, { otp });
            toast.success("Delivery confirmed! 🎉");
            setOtpInput(prev => ({ ...prev, [deliveryId]: "" }));
            fetchData(false);
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Delivery confirmation failed");
        } finally { setProcessingId(null); }
    };

    if (!user) return null;

    const stats = [
        { label: "Available Pickups", value: donations.length, icon: Package, gradient: "from-emerald-500 to-emerald-600" },
        { label: "Active Deliveries", value: myDeliveries.filter(d => d.status !== 'delivered' && d.status !== 'cancelled').length, icon: Truck, gradient: "from-brand-500 to-brand-600" },
        { label: "Completed", value: myDeliveries.filter(d => d.status === 'delivered').length, icon: CheckCircle, gradient: "from-warm-500 to-warm-600" },
        { label: "Status", value: "Active", icon: Navigation, gradient: "from-emerald-600 to-emerald-700" },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ====== NAV ====== */}
            <nav className="sticky top-0 z-50 glass border-b border-white/20">
                <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <HeartHandshake className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-gray-900 tracking-tight">KindBridge</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                            <Truck className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-semibold text-emerald-700">Volunteer</span>
                        </div>
                        <NotificationBell />
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-xs font-bold">
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
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900">Hello, {user.name} 🚀</h1>
                    <p className="text-gray-500 mt-1">Browse available donations and accept delivery missions.</p>
                </div>

                {/* ====== STATS ====== */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit flex-wrap">
                    <button onClick={() => setActiveTab("available")}
                        className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === "available" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            }`}>
                        <Package className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Available Pickups
                    </button>
                    <button onClick={() => setActiveTab("mydeliveries")}
                        className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all relative ${activeTab === "mydeliveries" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            }`}>
                        <Truck className="w-4 h-4 inline mr-1.5 -mt-0.5" /> My Deliveries
                        {myDeliveries.filter(d => d.status !== 'delivered' && d.status !== 'cancelled').length > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-brand-500 text-white rounded-full">
                                {myDeliveries.filter(d => d.status !== 'delivered' && d.status !== 'cancelled').length}
                            </span>
                        )}
                    </button>
                    <button onClick={() => setActiveTab("leaderboard")}
                        className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === "leaderboard" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            }`}>
                        <Trophy className="w-4 h-4 inline mr-1.5 -mt-0.5" /> Leaderboard
                    </button>
                </div>

                {/* ====== AVAILABLE PICKUPS TAB ====== */}
                {activeTab === "available" && (
                    <div className="card-premium p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <MapPin className="w-5 h-5 text-emerald-500" />
                            <h2 className="text-lg font-bold text-gray-900">Nearby Donations</h2>
                            {locationReady && (
                                <span className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">{donations.length} within {searchRadius} km</span>
                            )}
                        </div>

                        {!locationReady && !fetching && (
                            <div className="mb-6 p-6 rounded-2xl bg-emerald-50/80 border border-emerald-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-1">Set your present location</h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Choose your state and city in India. Coordinates are set automatically when you save — no GPS needed.
                                </p>
                                <form onSubmit={handleSetLocation} className="space-y-3">
                                    <IndiaLocationPicker
                                        key={locationPickerKey}
                                        onChange={handleLocationChange}
                                        initialState={locationForm.state}
                                        initialCity={locationForm.city}
                                        initialLocality={locationForm.locality}
                                    />
                                    <button
                                        type="submit"
                                        disabled={savingLocation}
                                        className="w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {savingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                                        Save &amp; Show Nearby Pickups
                                    </button>
                                </form>
                            </div>
                        )}

                        {locationReady && savedAddress && (
                            <div className="mb-4 p-3 rounded-xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row sm:items-center gap-2">
                                <div className="flex items-center gap-2 text-sm text-gray-600 flex-1 min-w-0">
                                    <Navigation className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                    <span className="truncate"><span className="font-semibold">Your location:</span> {savedAddress}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleOpenChangeAddress}
                                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 bg-white"
                                >
                                    Change address
                                </button>
                            </div>
                        )}

                        {fetching ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                            </div>
                        ) : !locationReady ? null : donations.length === 0 ? (
                            <div className="text-center py-20">
                                <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400 font-semibold text-lg">No pickups near you right now</p>
                                <p className="text-sm text-gray-300 mt-1">Try updating your address or check back later.</p>
                            </div>
                        ) : (
                            <div className="grid sm:grid-cols-2 gap-4">
                                {donations.map((d) => (
                                    <div key={d._id} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all duration-300">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-gray-900 text-lg truncate">{d.title}</div>
                                                <div className="text-sm text-gray-500 mt-0.5">{d.category} &middot; <span className="capitalize">{d.condition?.replace("_", " ")}</span></div>
                                            </div>
                                            <button onClick={() => setDetailModal(d)} className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-emerald-50 transition-all flex-shrink-0 ml-2">
                                                <Eye className="w-4 h-4 text-gray-400" />
                                            </button>
                                        </div>

                                        {d.pickupAddress && (
                                            <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-1">
                                                <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500" />
                                                <span className="truncate"><span className="font-medium text-gray-500">Pickup:</span> {d.pickupAddress}</span>
                                            </div>
                                        )}
                                        {(d.dropAddress || d.ngoId?.address) && (
                                            <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-1">
                                                <Navigation className="w-3.5 h-3.5 flex-shrink-0 text-brand-500" />
                                                <span className="truncate"><span className="font-medium text-gray-500">Drop:</span> {d.dropAddress || d.ngoId?.address}{(d.dropNgoName || d.ngoId?.orgName) ? ` (${d.dropNgoName || d.ngoId?.orgName})` : ""}</span>
                                            </div>
                                        )}

                                        {d.donorId && (
                                            <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
                                                <User className="w-3.5 h-3.5 flex-shrink-0" />
                                                <span>Donor: {d.donorId.name || "Anonymous"}</span>
                                            </div>
                                        )}

                                        <button onClick={() => handleAccept(d._id)}
                                            className="w-full py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-md shadow-emerald-500/20 hover:shadow-lg hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2">
                                            <Truck className="w-4 h-4" /> Accept Delivery
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ====== MY DELIVERIES TAB ====== */}
                {activeTab === "mydeliveries" && (
                    <div className="card-premium p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Truck className="w-5 h-5 text-brand-500" />
                            <h2 className="text-lg font-bold text-gray-900">My Deliveries</h2>
                            <span className="ml-auto text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-100">{myDeliveries.length} total</span>
                        </div>

                        {fetching ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
                            </div>
                        ) : myDeliveries.length === 0 ? (
                            <div className="text-center py-20">
                                <Truck className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400 font-semibold text-lg">No deliveries yet</p>
                                <p className="text-sm text-gray-300 mt-1">Accept a pickup to start delivering!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {myDeliveries.map((del) => {
                                    const donation = del.donationId;
                                    const statusStyles: Record<string, { bg: string; text: string }> = {
                                        accepted: { bg: "bg-blue-100", text: "text-blue-700" },
                                        picked_up: { bg: "bg-yellow-100", text: "text-yellow-700" },
                                        delivered: { bg: "bg-emerald-100", text: "text-emerald-700" },
                                        cancelled: { bg: "bg-gray-100", text: "text-gray-600" },
                                    };
                                    const st = statusStyles[del.status] || statusStyles.accepted;

                                    return (
                                        <div key={del._id} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-brand-200 transition-all">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-gray-900 text-lg truncate">{donation?.title || "Donation"}</div>
                                                    <div className="text-sm text-gray-500 mt-0.5">
                                                        {donation?.category} &middot; <span className="capitalize">{donation?.condition?.replace("_", " ")}</span>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${st.bg} ${st.text}`}>
                                                    {del.status?.replace("_", " ")}
                                                </span>
                                            </div>

                                            {donation?.pickupAddress && (
                                                <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-1">
                                                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500" />
                                                    <span className="truncate"><span className="font-medium text-gray-500">Pickup:</span> {donation.pickupAddress}</span>
                                                </div>
                                            )}
                                            {del.ngoId?.address && (
                                                <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-1">
                                                    <Navigation className="w-3.5 h-3.5 flex-shrink-0 text-brand-500" />
                                                    <span className="truncate"><span className="font-medium text-gray-500">Drop:</span> {del.ngoId.address}{del.ngoId.orgName ? ` (${del.ngoId.orgName})` : ""}</span>
                                                </div>
                                            )}

                                            {donation?.donorId && (
                                                <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
                                                    <User className="w-3.5 h-3.5 flex-shrink-0" />
                                                    <span>Donor: {donation.donorId.name || "Anonymous"} {donation.donorId.phone ? `· ${donation.donorId.phone}` : ""}</span>
                                                </div>
                                            )}

                                            {del.status === "accepted" && (
                                                <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100">
                                                    <p className="text-sm font-semibold text-blue-700 mb-2">📦 Confirm Pickup</p>
                                                    <p className="text-xs text-blue-500 mb-3">Upload a photo of the item and enter the OTP.</p>
                                                    <div className="flex flex-col gap-3">
                                                        <div className="bg-white p-2 rounded-lg border border-blue-100">
                                                            <input 
                                                                type="file" 
                                                                accept="image/*"
                                                                onChange={(e) => setPhotoInput(prev => ({ ...prev, [del._id]: e.target.files?.[0] || null }))}
                                                                className="text-xs w-full file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
                                                            />
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                maxLength={4}
                                                                placeholder="Enter OTP"
                                                                value={otpInput[del._id] || ""}
                                                                onChange={(e) => setOtpInput(prev => ({ ...prev, [del._id]: e.target.value.replace(/\D/g, "") }))}
                                                                className="input-premium !py-2.5 flex-1 text-center tracking-[0.5em] font-mono font-bold text-lg"
                                                            />
                                                            <button
                                                                onClick={() => handleConfirmPickup(del._id)}
                                                                disabled={processingId === del._id}
                                                                className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5"
                                                            >
                                                                {processingId === del._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                                Confirm
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {del.status === "picked_up" && (
                                                <div className="p-4 bg-yellow-50/60 rounded-xl border border-yellow-100">
                                                    <p className="text-sm font-semibold text-yellow-700 mb-2">🚚 Confirm Delivery to NGO</p>
                                                    <p className="text-xs text-yellow-600 mb-3">Enter the 4-digit dropoff OTP from the NGO to complete delivery.</p>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            maxLength={4}
                                                            placeholder="Enter OTP"
                                                            value={otpInput[del._id] || ""}
                                                            onChange={(e) => setOtpInput(prev => ({ ...prev, [del._id]: e.target.value.replace(/\D/g, "") }))}
                                                            className="input-premium !py-2.5 flex-1 text-center tracking-[0.5em] font-mono font-bold text-lg"
                                                        />
                                                        <button
                                                            onClick={() => handleConfirmDelivery(del._id)}
                                                            disabled={processingId === del._id}
                                                            className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-1.5"
                                                        >
                                                            {processingId === del._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                            Deliver
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {del.status === "delivered" && (
                                                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center gap-2">
                                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                                    <span className="text-sm font-semibold text-emerald-700">Delivered successfully!</span>
                                                    {del.deliveredAt && (
                                                        <span className="ml-auto text-xs text-emerald-500">{new Date(del.deliveredAt).toLocaleString()}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ====== LEADERBOARD TAB ====== */}
                {activeTab === "leaderboard" && (
                    <div className="card-premium p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Trophy className="w-5 h-5 text-warm-500" />
                            <h2 className="text-lg font-bold text-gray-900">Volunteer Leaderboard</h2>
                        </div>

                        {leaderboard.length === 0 ? (
                            <div className="text-center py-20">
                                <Trophy className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400 font-semibold">No leaderboard data yet</p>
                                <p className="text-sm text-gray-300 mt-1">Complete deliveries to climb the ranks!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {leaderboard.map((v, i) => (
                                    <div key={v._id} className={`flex items-center gap-4 p-4 rounded-xl transition-all ${i === 0 ? "bg-gradient-to-r from-yellow-50 to-yellow-100/50 border border-yellow-200" :
                                            i === 1 ? "bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-200" :
                                                i === 2 ? "bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200" :
                                                    "bg-gray-50 border border-gray-100"
                                        }`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black ${i === 0 ? "bg-yellow-200 text-yellow-800" :
                                                i === 1 ? "bg-gray-200 text-gray-700" :
                                                    i === 2 ? "bg-orange-200 text-orange-800" :
                                                        "bg-gray-100 text-gray-500"
                                            }`}>
                                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-gray-900 truncate">{v.userId?.name || "Volunteer"}</div>
                                            <div className="text-xs text-gray-400">{v.deliveryCount} deliveries &middot; Badge: {v.badge}</div>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-100">
                                            <Star className="w-4 h-4 fill-warm-500 text-warm-500" />
                                            <span className="text-sm font-bold text-gray-900">{v.rating?.toFixed(1) || "N/A"}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* ====== DETAIL MODAL ====== */}
            {detailModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setDetailModal(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Donation Details</h2>
                            <button onClick={() => setDetailModal(null)} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <h3 className="text-2xl font-bold text-gray-900">{detailModal.title}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div><div className="text-xs font-semibold text-gray-400 uppercase mb-1">Category</div><div className="text-sm font-medium text-gray-800">{detailModal.category}</div></div>
                                <div><div className="text-xs font-semibold text-gray-400 uppercase mb-1">Condition</div><div className="text-sm font-medium text-gray-800 capitalize">{detailModal.condition?.replace("_", " ")}</div></div>
                            </div>
                            {detailModal.description && <div><div className="text-xs font-semibold text-gray-400 uppercase mb-1">Description</div><div className="text-sm text-gray-800">{detailModal.description}</div></div>}
                            <div><div className="text-xs font-semibold text-gray-400 uppercase mb-1">Pickup Address</div><div className="text-sm font-medium text-gray-800 flex items-center gap-1"><MapPin className="w-4 h-4 text-emerald-500" />{detailModal.pickupAddress}</div></div>
                            {(detailModal.dropAddress || detailModal.ngoId?.address) && (
                                <div><div className="text-xs font-semibold text-gray-400 uppercase mb-1">Drop Address</div><div className="text-sm font-medium text-gray-800 flex items-center gap-1"><Navigation className="w-4 h-4 text-brand-500" />{detailModal.dropAddress || detailModal.ngoId?.address}{(detailModal.dropNgoName || detailModal.ngoId?.orgName) ? ` — ${detailModal.dropNgoName || detailModal.ngoId?.orgName}` : ""}</div></div>
                            )}
                            {detailModal.donorId && <div><div className="text-xs font-semibold text-gray-400 uppercase mb-1">Donor</div><div className="text-sm font-medium text-gray-800">{detailModal.donorId.name} &middot; {detailModal.donorId.email}</div></div>}
                            <button onClick={() => { handleAccept(detailModal._id); setDetailModal(null); }}
                                className="btn-primary w-full !py-3 !rounded-xl text-sm flex items-center justify-center gap-2 mt-4 !bg-gradient-to-r !from-emerald-500 !to-emerald-600 !shadow-emerald-500/20">
                                <Truck className="w-4 h-4" /> Accept This Delivery
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
