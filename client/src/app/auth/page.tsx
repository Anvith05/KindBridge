"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore, Role } from "@/store/useAuthStore";
import { HeartHandshake, ArrowRight, ArrowLeft, Eye, EyeOff, Package, Truck, Users, Mail, ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";

type AuthStep = "form" | "otp";

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [authStep, setAuthStep] = useState<AuthStep>("form");
    const router = useRouter();
    const loginFn = useAuthStore((state) => state.login);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [city, setCity] = useState("");
    const [role, setRole] = useState<Role>("donor");
    const [orgName, setOrgName] = useState("");
    const [address, setAddress] = useState("");
    const [idType, setIdType] = useState("");

    // OTP state
    const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
    const [otpSending, setOtpSending] = useState(false);
    const [otpVerifying, setOtpVerifying] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown timer for resend
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    // Auto-focus first OTP input when entering OTP step
    useEffect(() => {
        if (authStep === "otp") {
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
    }, [authStep]);

    const handleOtpChange = (index: number, value: string) => {
        // Only accept digits
        if (value && !/^\d$/.test(value)) return;

        const newDigits = [...otpDigits];
        newDigits[index] = value;
        setOtpDigits(newDigits);

        // Auto-advance to next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (pasted.length === 0) return;
        const newDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
            newDigits[i] = pasted[i] || "";
        }
        setOtpDigits(newDigits);
        // Focus the last filled input or the next empty one
        const focusIndex = Math.min(pasted.length, 5);
        inputRefs.current[focusIndex]?.focus();
    };

    const sendOtp = async () => {
        setOtpSending(true);
        try {
            const { data } = await api.post("/api/auth/send-otp", { email, purpose: "register" });
            toast.success("OTP sent to your email!");
            if (data.previewUrl) {
                setPreviewUrl(data.previewUrl);
            }
            setResendCooldown(60);
            setAuthStep("otp");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Failed to send OTP");
        } finally {
            setOtpSending(false);
        }
    };

    const verifyAndRegister = async () => {
        const otpCode = otpDigits.join("");
        if (otpCode.length !== 6) {
            toast.error("Please enter the complete 6-digit OTP");
            return;
        }

        setOtpVerifying(true);
        try {
            // Step 1: Verify OTP
            await api.post("/api/auth/verify-otp", { email, otp: otpCode, purpose: "register" });

            // Step 2: Register
            const payload: any = { name, email, phone, password, city, role };
            if (role === "ngo") { payload.orgName = orgName; payload.address = address; }
            else if (role === "volunteer") { payload.idType = idType; }

            const { data } = await api.post("/api/auth/register", payload);
            loginFn({ _id: data._id, name: data.name, email: data.email, role: data.role }, data.token);
            toast.success("Account created successfully! 🎉");
            redirectUser(data.role);
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Verification failed");
        } finally {
            setOtpVerifying(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                const { data } = await api.post("/api/auth/login", { email, password });
                loginFn({ _id: data._id, name: data.name, email: data.email, role: data.role }, data.token);
                toast.success(`Welcome back, ${data.name}!`);
                redirectUser(data.role);
            } else {
                // For registration, send OTP first
                await sendOtp();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    const redirectUser = (userRole: string) => {
        const routes: Record<string, string> = { donor: "/donor", volunteer: "/volunteer", ngo: "/ngo", admin: "/admin" };
        router.push(routes[userRole] || "/");
    };

    const roles = [
        { value: "donor", label: "Donor", desc: "Donate items", icon: Package, color: "brand" },
        { value: "volunteer", label: "Volunteer", desc: "Deliver items", icon: Truck, color: "emerald" },
        { value: "ngo", label: "NGO", desc: "Receive items", icon: Users, color: "purple" },
    ];

    // OTP Verification Screen
    if (authStep === "otp") {
        return (
            <div className="min-h-screen flex hero-mesh">
                {/* Left Panel — Branding */}
                <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 items-center justify-center p-16 overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
                    <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />
                    <div className="relative z-10 max-w-md">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
                                <ShieldCheck className="w-7 h-7 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-white">Verify Email</span>
                        </div>
                        <h2 className="text-4xl font-extrabold text-white leading-tight mb-6">
                            One last step to join KindBridge.
                        </h2>
                        <p className="text-brand-200 text-lg leading-relaxed mb-10">
                            We&apos;ve sent a 6-digit verification code to your email. Enter it below to complete your registration.
                        </p>
                        <div className="space-y-4">
                            {["Secure email verification", "Protection against fake accounts", "Your data stays safe"].map((f, i) => (
                                <div key={i} className="flex items-center gap-3 text-white/90">
                                    <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                                        <ArrowRight className="w-3 h-3" />
                                    </div>
                                    <span className="text-sm font-medium">{f}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Panel — OTP Form */}
                <div className="flex-1 flex items-center justify-center p-6 md:p-12">
                    <div className="w-full max-w-md animate-fade-in">
                        <button
                            onClick={() => { setAuthStep("form"); setOtpDigits(["", "", "", "", "", ""]); }}
                            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-8 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to registration
                        </button>

                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/25 mb-6">
                            <Mail className="w-8 h-8 text-white" />
                        </div>

                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Check your email</h1>
                        <p className="text-gray-500 mb-2">
                            We sent a 6-digit code to
                        </p>
                        <p className="text-brand-600 font-semibold mb-8">{email}</p>

                        {/* OTP Input Boxes */}
                        <div className="flex gap-3 justify-center mb-6" onPaste={handleOtpPaste}>
                            {otpDigits.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => { inputRefs.current[index] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    className={`w-13 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-300 focus:outline-none 
                                        ${digit
                                            ? "border-brand-500 bg-brand-50 text-brand-700 shadow-sm shadow-brand-500/10"
                                            : "border-gray-200 bg-white text-gray-900 hover:border-gray-300"
                                        }
                                        focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10`}
                                    style={{ width: '52px' }}
                                />
                            ))}
                        </div>

                        {/* Preview URL for dev/Ethereal */}
                        {previewUrl && (
                            <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                <p className="text-xs text-amber-700 font-medium mb-1">📧 Dev Mode — View email:</p>
                                <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                                    className="text-xs text-amber-600 underline hover:text-amber-800 break-all">
                                    {previewUrl}
                                </a>
                            </div>
                        )}

                        {/* Verify Button */}
                        <button
                            onClick={verifyAndRegister}
                            disabled={otpVerifying || otpDigits.join("").length !== 6}
                            className="btn-primary w-full !py-3.5 !rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {otpVerifying ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <ShieldCheck className="w-4 h-4" />
                                    Verify & Create Account
                                </>
                            )}
                        </button>

                        {/* Resend */}
                        <div className="text-center mt-6">
                            <p className="text-sm text-gray-400 mb-2">Didn&apos;t receive the code?</p>
                            {resendCooldown > 0 ? (
                                <p className="text-sm text-gray-400">
                                    Resend in <span className="font-semibold text-brand-600">{resendCooldown}s</span>
                                </p>
                            ) : (
                                <button
                                    onClick={async () => {
                                        setOtpDigits(["", "", "", "", "", ""]);
                                        await sendOtp();
                                    }}
                                    disabled={otpSending}
                                    className="text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors disabled:opacity-50"
                                >
                                    {otpSending ? "Sending..." : "Resend OTP"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Main Auth Form
    return (
        <div className="min-h-screen flex hero-mesh">

            {/* Left Panel — Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 items-center justify-center p-16 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />
                <div className="relative z-10 max-w-md">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                            <HeartHandshake className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-white">KindBridge</span>
                    </div>
                    <h2 className="text-4xl font-extrabold text-white leading-tight mb-6">
                        Every donation starts a ripple of change.
                    </h2>
                    <p className="text-brand-200 text-lg leading-relaxed mb-10">
                        Connect with verified volunteers and NGOs to ensure your surplus reaches those who need it most, tracked every step of the way.
                    </p>
                    <div className="space-y-4">
                        {["OTP-verified handoffs", "Real-time delivery tracking", "Geo-matched volunteer routing"].map((f, i) => (
                            <div key={i} className="flex items-center gap-3 text-white/90">
                                <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                                    <ArrowRight className="w-3 h-3" />
                                </div>
                                <span className="text-sm font-medium">{f}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel — Form */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12">
                <div className="w-full max-w-md animate-fade-in">

                    {/* Mobile Logo */}
                    <Link href="/" className="lg:hidden flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/25">
                            <HeartHandshake className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-900">KindBridge</span>
                    </Link>

                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                        {isLogin ? "Welcome back" : "Create your account"}
                    </h1>
                    <p className="text-gray-500 mb-8">
                        {isLogin ? "Enter your credentials to access your dashboard" : "Join KindBridge to make a meaningful impact"}
                    </p>

                    {/* Toggle */}
                    <div className="flex p-1 mb-8 bg-gray-100 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${isLogin ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Log In
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${!isLogin ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <>
                                {/* Role Selector */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">I want to join as</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {roles.map((r) => (
                                            <button
                                                key={r.value}
                                                type="button"
                                                onClick={() => setRole(r.value as Role)}
                                                className={`p-3 rounded-xl border-2 transition-all duration-300 text-center ${role === r.value
                                                        ? "border-brand-500 bg-brand-50 shadow-sm"
                                                        : "border-gray-100 bg-white hover:border-gray-200"
                                                    }`}
                                            >
                                                <r.icon className={`w-5 h-5 mx-auto mb-1.5 ${role === r.value ? "text-brand-600" : "text-gray-400"}`} />
                                                <div className={`text-xs font-bold ${role === r.value ? "text-brand-700" : "text-gray-700"}`}>{r.label}</div>
                                                <div className="text-[10px] text-gray-400 mt-0.5">{r.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                                        className="input-premium" placeholder="John Doe" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
                                        <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                                            className="input-premium" placeholder="+91 98765..." />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">City</label>
                                        <input type="text" required value={city} onChange={(e) => setCity(e.target.value)}
                                            className="input-premium" placeholder="Hyderabad" />
                                    </div>
                                </div>

                                {role === "ngo" && (
                                    <div className="space-y-4 p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Organization Name</label>
                                            <input type="text" required value={orgName} onChange={(e) => setOrgName(e.target.value)}
                                                className="input-premium" placeholder="Example Foundation" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">NGO Address</label>
                                            <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)}
                                                className="input-premium" placeholder="123 Charity Lane..." />
                                        </div>
                                    </div>
                                )}

                                {role === "volunteer" && (
                                    <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">ID Document Type</label>
                                        <select required value={idType} onChange={(e) => setIdType(e.target.value)}
                                            className="input-premium">
                                            <option value="">Select ID Type</option>
                                            <option value="Aadhaar">Aadhaar Card</option>
                                            <option value="PAN">PAN Card</option>
                                            <option value="Driving License">Driving License</option>
                                        </select>
                                    </div>
                                )}
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                className="input-premium" placeholder="you@example.com" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-premium !pr-12"
                                    placeholder="••••••••"
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otpSending}
                            className="btn-primary w-full !py-3.5 !rounded-xl text-sm flex items-center justify-center gap-2 mt-2"
                        >
                            {loading || otpSending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? "Sign In" : (
                                        <>
                                            <Mail className="w-4 h-4" />
                                            Verify Email & Sign Up
                                        </>
                                    )}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {!isLogin && (
                        <p className="text-xs text-gray-400 text-center mt-3">
                            A 6-digit OTP will be sent to your email for verification
                        </p>
                    )}

                    <p className="text-center text-sm text-gray-400 mt-8">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button onClick={() => { setIsLogin(!isLogin); setAuthStep("form"); }} className="text-brand-600 font-semibold hover:text-brand-700 transition-colors">
                            {isLogin ? "Sign Up" : "Log In"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
