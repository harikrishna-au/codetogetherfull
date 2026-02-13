import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { API_ENDPOINTS } from '@/lib/api';
import {
    Trophy,
    Clock,
    Code,
    Zap,
    Target,
    Flame,
    Calendar,
    User as UserIcon
} from 'lucide-react';
import { StatCard } from '@/components/profile/StatCard';
import { SessionHistoryTable } from '@/components/profile/SessionHistoryTable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 pt-20">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* User Header */}
                <div className="flex items-center space-x-6 animate-fade-in">
                    <Avatar className="h-24 w-24 border-4 border-purple-500/30">
                        <AvatarImage src={user?.imageUrl} />
                        <AvatarFallback className="bg-purple-600 text-2xl text-white">
                            {user?.fullName?.charAt(0) || user?.primaryEmailAddress?.emailAddress?.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-4xl font-bold text-white">{user?.fullName || 'Coder'}</h1>
                        <p className="text-gray-400 text-lg flex items-center gap-2">
                            <UserIcon className="w-4 h-4" />
                            {user?.primaryEmailAddress?.emailAddress}
                        </p>
                        <p className="text-purple-300 text-sm mt-1">
                            Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in delay-100">
                    <StatCard
                        icon={Target}
                        label="Total Sessions"
                        value={stats?.totalSessions || 0}
                        loading={loading}
                        iconColor="text-blue-400"
                    />
                    <StatCard
                        icon={Trophy}
                        label="Win Rate"
                        value={getWinRate()}
                        subtitle={`${stats?.winLossRecord.wins || 0}W - ${stats?.winLossRecord.losses || 0}L`}
                        loading={loading}
                        iconColor="text-yellow-400"
                    />
                    <StatCard
                        icon={Flame}
                        label="Winning Streak"
                        value={stats?.currentStreak || 0}
                        loading={loading}
                        iconColor="text-orange-500"
                    />
                    <StatCard
                        icon={Clock}
                        label="Coding Time"
                        value={formatTime(stats?.totalCodingTime || 0)}
                        loading={loading}
                        iconColor="text-green-400"
                    />
                </div>

                {/* Breakdown & History */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in delay-200">
                    {/* Detailed Stats */}
                    <div className="space-y-6 lg:col-span-1">
                        <Card className="bg-white/5 border-white/10 backdrop-blur h-full">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Code className="w-5 h-5" />
                                    Problems Solved
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                                    <div className="text-3xl font-bold text-white mb-1">
                                        {stats?.totalProblemsSolved || 0}
                                    </div>
                                    <div className="text-sm text-gray-400">Total Solved</div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-green-400 text-sm">Easy</span>
                                        <div className="flex items-center gap-2 flex-1 mx-4">
                                            <div className="h-2 bg-white/10 rounded-full flex-1 overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500 rounded-full"
                                                    style={{ width: `${stats?.totalProblemsSolved ? ((stats.problemsSolved.easy / stats.totalProblemsSolved) * 100) : 0}%` }}
                                                />
                                            </div>
                                            <span className="text-white font-mono text-sm w-6 text-right">{stats?.problemsSolved.easy || 0}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-yellow-400 text-sm">Medium</span>
                                        <div className="flex items-center gap-2 flex-1 mx-4">
                                            <div className="h-2 bg-white/10 rounded-full flex-1 overflow-hidden">
                                                <div
                                                    className="h-full bg-yellow-500 rounded-full"
                                                    style={{ width: `${stats?.totalProblemsSolved ? ((stats.problemsSolved.medium / stats.totalProblemsSolved) * 100) : 0}%` }}
                                                />
                                            </div>
                                            <span className="text-white font-mono text-sm w-6 text-right">{stats?.problemsSolved.medium || 0}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-red-400 text-sm">Hard</span>
                                        <div className="flex items-center gap-2 flex-1 mx-4">
                                            <div className="h-2 bg-white/10 rounded-full flex-1 overflow-hidden">
                                                <div
                                                    className="h-full bg-red-500 rounded-full"
                                                    style={{ width: `${stats?.totalProblemsSolved ? ((stats.problemsSolved.hard / stats.totalProblemsSolved) * 100) : 0}%` }}
                                                />
                                            </div>
                                            <span className="text-white font-mono text-sm w-6 text-right">{stats?.problemsSolved.hard || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/10">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-300 text-sm">Favorite Language</span>
                                        <span className="text-purple-300 font-mono capitalize">
                                            {stats?.favoriteLanguage || 'None'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

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
