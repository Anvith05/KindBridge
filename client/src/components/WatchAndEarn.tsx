import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { IndianRupee, Eye, Globe, Play, Trophy, Users, Loader2, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export default function WatchAndEarn() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState({ earned: 0, views: 0 });
    const [globalStats, setGlobalStats] = useState({ globalEarned: 0, globalViews: 0 });
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [period, setPeriod] = useState<'weekly' | 'all-time'>('weekly');
    const [loading, setLoading] = useState(true);

    // Ad slot states
    const [slots, setSlots] = useState<{ id: string; active: boolean; remaining: number; earnedPop: boolean }[]>([
        { id: 'slot-1', active: false, remaining: 0, earnedPop: false },
        { id: 'slot-2', active: false, remaining: 0, earnedPop: false },
        { id: 'slot-3', active: false, remaining: 0, earnedPop: false }
    ]);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [period]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, globalRes, leaderRes] = await Promise.all([
                api.get('/api/ad-watch/stats'),
                api.get('/api/ad-watch/global'),
                api.get(`/api/ad-watch/leaderboard?period=${period}`)
            ]);
            setStats(statsRes.data);
            setGlobalStats(globalRes.data);
            setLeaderboard(leaderRes.data);
        } catch (error) {
            toast.error('Failed to load Watch & Earn data');
        } finally {
            setLoading(false);
        }
    };

    const handleWatchAd = async (slotId: string) => {
        // Find slot
        const slotIndex = slots.findIndex(s => s.id === slotId);
        if (slotIndex === -1) return;

        // Optimistically start the visual countdown (15s)
        const updatedSlotsStart = [...slots];
        updatedSlotsStart[slotIndex] = { ...updatedSlotsStart[slotIndex], active: true, remaining: 15, earnedPop: false };
        setSlots(updatedSlotsStart);

        try {
            // Register visit first
            await api.post('/api/ad-watch/watch', { adSlotId: slotId });
            
            // Countdown logic (visual)
            let currentRemaining = 15;
            const timer = setInterval(() => {
                currentRemaining -= 1;
                setSlots(prev => {
                    const next = [...prev];
                    const idx = next.findIndex(s => s.id === slotId);
                    if (idx > -1) next[idx].remaining = currentRemaining;
                    return next;
                });
                
                if (currentRemaining <= 0) {
                    clearInterval(timer);
                    // Finish ad
                    setSlots(prev => {
                        const next = [...prev];
                        const idx = next.findIndex(s => s.id === slotId);
                        if (idx > -1) {
                            next[idx].active = false;
                            next[idx].earnedPop = true;
                        }
                        return next;
                    });
                    
                    setTimeout(() => {
                        setSlots(prev => {
                            const next = [...prev];
                            const idx = next.findIndex(s => s.id === slotId);
                            if (idx > -1) next[idx].earnedPop = false;
                            return next;
                        });
                    }, 2000); // Remove popup after 2s
                    
                    toast.success('You earned ₹2 for charity!');
                    fetchData(); // Refresh stats
                }
            }, 1000);
            
        } catch (error: any) {
            // Revert on error
            setSlots(prev => {
                const next = [...prev];
                const idx = next.findIndex(s => s.id === slotId);
                if (idx > -1) next[idx].active = false;
                return next;
            });
            toast.error(error.response?.data?.error || 'Ad failed to load');
        }
    };

    if (loading && !stats.earned) {
        return (
            <div className="card-premium p-10 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-4" />
                <p className="font-semibold text-gray-500">Loading your impact...</p>
            </div>
        );
    }

    const impactMeals = Math.floor(stats.earned / 50); // Assuming 50 INR per meal

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* HERO STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card-premium p-6 overflow-hidden relative group">
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 rounded-full blur-2xl group-hover:bg-emerald-400/40 transition-colors"></div>
                    <div className="flex items-center gap-4 mb-2 relative">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <IndianRupee className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Your Impact</div>
                    </div>
                    <div className="text-4xl font-extrabold text-gray-900 animate-countUp relative">
                        ₹{stats.earned.toLocaleString()}
                    </div>
                    <div className="text-sm font-medium text-emerald-600 mt-2 relative flex items-center gap-1">
                        <Sparkles className="w-4 h-4" /> Funded {impactMeals} meal{impactMeals !== 1 ? 's' : ''}
                    </div>
                </div>

                <div className="card-premium p-6 relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                            <Eye className="w-5 h-5 text-brand-600" />
                        </div>
                        <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Ads Watched</div>
                    </div>
                    <div className="text-4xl font-extrabold text-gray-900">{stats.views}</div>
                </div>

                <div className="card-premium p-6 relative overflow-hidden bg-gradient-to-br from-brand-900 to-indigo-900 text-white border-transparent shadow-xl shadow-brand-900/20">
                    <div className="absolute right-0 bottom-0 opacity-10">
                        <Globe className="w-32 h-32 -mb-8 -mr-8" />
                    </div>
                    <div className="flex items-center gap-4 mb-2 relative">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                            <Users className="w-5 h-5 text-brand-200" />
                        </div>
                        <div className="text-sm font-bold text-brand-200 uppercase tracking-wider">Global Raised</div>
                    </div>
                    <div className="text-4xl font-extrabold text-white relative">
                        ₹{globalStats.globalEarned.toLocaleString()}
                    </div>
                    <div className="text-sm font-medium text-brand-300 mt-2 relative">From {globalStats.globalViews.toLocaleString()} total views</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* AD SLOTS */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                        <Play className="w-5 h-5 text-brand-500" />
                        Available Ads
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {slots.map((slot) => (
                            <div key={slot.id} className="card-premium p-4 flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden group">
                                {slot.earnedPop && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-extrabold text-emerald-500 animate-floatUp z-10 drop-shadow-md">
                                        +₹2
                                    </div>
                                )}
                                
                                <div className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4">Advertisement Area</div>
                                
                                {slot.active ? (
                                    <div className="w-full max-w-[200px] flex flex-col items-center">
                                        <div className="text-2xl font-bold text-brand-600 mb-3">{slot.remaining}s left</div>
                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-brand-500 transition-all duration-1000 ease-linear"
                                                style={{ width: `${(slot.remaining / 15) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => handleWatchAd(slot.id)}
                                        className="btn-primary flex items-center gap-2 shadow-brand-500/20 group-hover:scale-105 transition-transform"
                                    >
                                        <Play className="w-4 h-4 fill-white" /> Watch to Earn ₹2
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    
                    <div className="bg-brand-50/50 rounded-xl p-4 text-sm text-brand-700 mt-4 flex items-start gap-3">
                        <div className="mt-1"><Sparkles className="w-4 h-4" /></div>
                        <p><strong>How it works:</strong> Every time you watch a short ad, our sponsors donate ₹2 directly to the KindBridge platform fund. This helps us provide critical supplies and cover operational costs for deliveries without requiring donors to spend their own money.</p>
                    </div>
                </div>

                {/* LEADERBOARD */}
                <div className="card-premium flex flex-col">
                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-warm-500" /> Leaderboard
                        </h2>
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            <button 
                                onClick={() => setPeriod('weekly')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${period === 'weekly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                            >
                                Weekly
                            </button>
                            <button 
                                onClick={() => setPeriod('all-time')}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${period === 'all-time' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                            >
                                All-Time
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-4 flex-1 overflow-y-auto max-h-[400px]">
                        {leaderboard.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <Trophy className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                                <p className="font-semibold text-sm">No specific stats yet.<br/>Be the first to earn!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {leaderboard.map((l, i) => {
                                    const isCurrentUser = user && user._id === l.userId;
                                    return (
                                        <div key={l.userId} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isCurrentUser ? 'bg-brand-50 border border-brand-100' : 'hover:bg-gray-50'}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                                                i === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900' : 
                                                i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800' :
                                                i === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-orange-950' :
                                                'bg-white text-gray-500 border border-gray-200'
                                            }`}>
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`font-semibold truncate text-sm ${isCurrentUser ? 'text-brand-900' : 'text-gray-900'}`}>
                                                    {l.name} {isCurrentUser && ' (You)'}
                                                </div>
                                                <div className="text-xs text-gray-400">{l.totalViews} views</div>
                                            </div>
                                            <div className="font-extrabold text-sm text-gray-900">
                                                ₹{l.totalEarned}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
