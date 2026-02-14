import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { API_ENDPOINTS } from '@/lib/api';
import {
    Trophy,
    Clock,
    Code,
    Target,
    Flame,
    User as UserIcon,
    ArrowLeft,
} from 'lucide-react';
import { StatCard } from '@/components/profile/StatCard';
import { SessionHistoryTable } from '@/components/profile/SessionHistoryTable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import BackgroundEffects from '@/components/landing/BackgroundEffects';

interface UserStats {
    totalSessions: number;
    problemsSolved: {
        easy: number;
        medium: number;
        hard: number;
    };
    totalProblemsSolved: number;
    winLossRecord: {
        wins: number;
        losses: number;
    };
    currentStreak: number;
    favoriteLanguage: string;
    totalCodingTime: number;
}

const ProfilePage = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [stats, setStats] = useState<UserStats | null>(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                const [statsRes, historyRes] = await Promise.all([
                    fetch(`${API_ENDPOINTS.USER_STATS}/${user.id}`),
                    fetch(`${API_ENDPOINTS.USER_HISTORY}/${user.id}?limit=10`)
                ]);

                if (!statsRes.ok || !historyRes.ok) {
                    throw new Error('Failed to fetch profile data');
                }

                const statsData = await statsRes.json();
                const historyData = await historyRes.json();

                setStats(statsData.stats);
                setHistory(historyData.history);
            } catch (err: any) {
                console.error('Error fetching profile:', err);
                toast.error('Failed to load profile data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${mins}m`;
    };

    const getWinRate = () => {
        if (!stats) return '0%';
        const total = stats.winLossRecord.wins + stats.winLossRecord.losses;
        if (total === 0) return '0%';
        return `${Math.round((stats.winLossRecord.wins / total) * 100)}%`;
    };

    return (
        <div className="relative min-h-screen overflow-x-hidden">
            <BackgroundEffects />

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-8 pt-10 space-y-8">

                {/* Back button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm text-[#8a9099] hover:text-[#e2e5e8] transition-colors duration-200 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    Back
                </button>

                {/* User Header */}
                <div className="flex items-center gap-6 animate-fade-in">
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-white/[0.06] blur-xl scale-110" />
                        <Avatar className="relative h-20 w-20 ring-1 ring-white/[0.12]">
                            <AvatarImage src={user?.imageUrl} />
                            <AvatarFallback className="bg-white/[0.06] text-[#e2e5e8] text-2xl font-semibold border border-white/[0.08]">
                                {user?.fullName?.charAt(0) || user?.primaryEmailAddress?.emailAddress?.charAt(0) || '?'}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-[#e2e5e8] tracking-tight">
                            {user?.fullName || 'Coder'}
                        </h1>
                        <p className="text-[#6b7075] text-sm mt-1 flex items-center gap-1.5">
                            <UserIcon className="w-3.5 h-3.5" />
                            {user?.primaryEmailAddress?.emailAddress}
                        </p>
                        <p className="text-[#4a5057] text-xs mt-1">
                            Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in">
                    <StatCard
                        icon={Target}
                        label="Total Sessions"
                        value={stats?.totalSessions || 0}
                        loading={loading}
                        iconColor="text-[#cfd3d6]"
                    />
                    <StatCard
                        icon={Trophy}
                        label="Win Rate"
                        value={getWinRate()}
                        subtitle={`${stats?.winLossRecord.wins || 0}W — ${stats?.winLossRecord.losses || 0}L`}
                        loading={loading}
                        iconColor="text-yellow-400"
                    />
                    <StatCard
                        icon={Flame}
                        label="Win Streak"
                        value={stats?.currentStreak || 0}
                        loading={loading}
                        iconColor="text-orange-400"
                    />
                    <StatCard
                        icon={Clock}
                        label="Coding Time"
                        value={formatTime(stats?.totalCodingTime || 0)}
                        loading={loading}
                        iconColor="text-[#8a9099]"
                    />
                </div>

                {/* Breakdown & History */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">

                    {/* Problems Solved breakdown */}
                    <Card className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl lg:col-span-1">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-[#cfd3d6] text-sm font-medium flex items-center gap-2">
                                <Code className="w-4 h-4 text-[#6b7075]" />
                                Problems Solved
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {/* Total count */}
                            <div className="text-center py-4 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                                <div className="text-4xl font-bold text-[#e2e5e8] mb-0.5">
                                    {stats?.totalProblemsSolved || 0}
                                </div>
                                <div className="text-xs text-[#4a5057]">Total Solved</div>
                            </div>

                            {/* Difficulty bars */}
                            <div className="space-y-3">
                                {[
                                    { label: 'Easy', key: 'easy' as const, color: 'bg-green-500', text: 'text-green-400' },
                                    { label: 'Medium', key: 'medium' as const, color: 'bg-yellow-500', text: 'text-yellow-400' },
                                    { label: 'Hard', key: 'hard' as const, color: 'bg-red-500', text: 'text-red-400' },
                                ].map(({ label, key, color, text }) => {
                                    const count = stats?.problemsSolved[key] || 0;
                                    const pct = stats?.totalProblemsSolved
                                        ? (count / stats.totalProblemsSolved) * 100
                                        : 0;
                                    return (
                                        <div key={key} className="flex items-center gap-3">
                                            <span className={`${text} text-xs w-12 shrink-0`}>{label}</span>
                                            <div className="h-1.5 bg-white/[0.06] rounded-full flex-1 overflow-hidden">
                                                <div
                                                    className={`h-full ${color} rounded-full transition-all duration-700`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="text-[#6b7075] font-mono text-xs w-4 text-right shrink-0">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="pt-3 border-t border-white/[0.06] flex justify-between items-center">
                                <span className="text-[#4a5057] text-xs">Fav. Language</span>
                                <span className="text-[#cfd3d6] font-mono text-xs capitalize">
                                    {stats?.favoriteLanguage || 'None'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Session History */}
                    <div className="lg:col-span-2">
                        <SessionHistoryTable sessions={history} loading={loading} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
