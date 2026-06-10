import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/context/AuthContext';
import { API_ENDPOINTS } from '@/lib/api';
import { Trophy, Flame, ArrowLeft, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import BackgroundEffects from '@/components/landing/BackgroundEffects';

type Period = 'all' | 'month' | 'week';

interface LeaderboardEntry {
    rank: number;
    userId: string;
    displayName: string;
    rating: number;
    peakRating: number;
    tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
    wins: number;
    losses: number;
    streak: number;
}

const tierColors: Record<LeaderboardEntry['tier'], string> = {
    Bronze: 'text-amber-700',
    Silver: 'text-slate-300',
    Gold: 'text-yellow-400',
    Platinum: 'text-cyan-300',
    Diamond: 'text-violet-400',
};

const periods: { key: Period; label: string }[] = [
    { key: 'all', label: 'All Time' },
    { key: 'month', label: 'This Month' },
    { key: 'week', label: 'This Week' },
];

const rankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
};

const Leaderboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [period, setPeriod] = useState<Period>('all');
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const fetchLeaderboard = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `${API_ENDPOINTS.LEADERBOARD}?scope=global&period=${period}&limit=50`,
                    { credentials: 'include' },
                );
                if (!res.ok) throw new Error('Failed to load leaderboard');
                const data = await res.json();
                if (!cancelled) setEntries(data.entries ?? []);
            } catch {
                if (!cancelled) toast.error('Failed to load leaderboard');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchLeaderboard();
        return () => { cancelled = true; };
    }, [period]);

    return (
        <div className="relative min-h-screen overflow-x-hidden">
            <BackgroundEffects />

            <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 pt-10 space-y-6">
                {/* Back button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    Back
                </button>

                {/* Title */}
                <div className="flex items-center gap-3 animate-fade-in">
                    <Trophy className="w-8 h-8 text-yellow-400" />
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Leaderboard</h1>
                </div>

                {/* Period tabs */}
                <div className="flex gap-2">
                    {periods.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setPeriod(key)}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-200
                                ${period === key
                                    ? 'bg-white/[0.1] border-white/[0.2] text-white'
                                    : 'bg-white/[0.03] border-white/[0.08] text-muted-foreground hover:text-white'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl overflow-hidden animate-fade-in">
                    <div className="grid grid-cols-[3rem_1fr_5rem_4.5rem_3.5rem] gap-2 px-4 py-2.5 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-white/[0.06]">
                        <span>Rank</span>
                        <span>Player</span>
                        <span className="text-right">Rating</span>
                        <span className="text-right">W / L</span>
                        <span className="text-right">Streak</span>
                    </div>

                    {loading && (
                        <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading rankings…
                        </div>
                    )}

                    {!loading && entries.length === 0 && (
                        <div className="py-10 text-center text-muted-foreground text-sm">
                            No rated matches {period !== 'all' ? 'in this period ' : ''}yet — play a challenge match to get ranked!
                        </div>
                    )}

                    {!loading && entries.map((entry) => {
                        const isMe = entry.userId === user?.id;
                        return (
                            <div
                                key={entry.userId}
                                className={`grid grid-cols-[3rem_1fr_5rem_4.5rem_3.5rem] gap-2 items-center px-4 py-2.5 text-sm border-b border-white/[0.04] last:border-b-0
                                    ${isMe ? 'bg-white/[0.07] border-l-2 border-l-white' : 'hover:bg-white/[0.02]'}`}
                            >
                                <span className="font-mono text-muted-foreground">{rankBadge(entry.rank)}</span>
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <Avatar className="h-7 w-7 shrink-0">
                                        <AvatarFallback className="bg-primary/20 text-primary text-xs border border-primary/30">
                                            {entry.displayName.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className={`truncate ${isMe ? 'text-white font-semibold' : 'text-foreground'}`}>
                                        {entry.displayName}{isMe && <span className="text-muted-foreground text-xs ml-1.5">(you)</span>}
                                    </span>
                                </div>
                                <span className="text-right tabular-nums">
                                    <span className="font-semibold">{entry.rating}</span>
                                    <span className={`block text-[10px] ${tierColors[entry.tier]}`}>{entry.tier}</span>
                                </span>
                                <span className="text-right tabular-nums text-muted-foreground">
                                    <span className="text-green-400">{entry.wins}</span>
                                    {' / '}
                                    <span className="text-red-400">{entry.losses}</span>
                                </span>
                                <span className="text-right tabular-nums">
                                    {entry.streak > 0 ? (
                                        <span className="inline-flex items-center gap-0.5 text-orange-400">
                                            <Flame className="w-3.5 h-3.5" />{entry.streak}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
