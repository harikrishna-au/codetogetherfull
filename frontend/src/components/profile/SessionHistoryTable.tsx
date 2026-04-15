import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, Clock, Calendar, Code, User, Trophy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Session {
    id: string;
    roomId: string;
    problem: {
        title: string;
        difficulty: string;
    };
    date: string;
    duration: number;
    result: {
        solved: boolean;
        testCasesPassed: number;
        totalTestCases: number;
    };
    partner: {
        name: string;
    } | null;
    mode: string;
    language: string;
    endReason: string;
}

interface SessionHistoryTableProps {
    sessions: Session[];
    loading?: boolean;
}

const difficultyColor: Record<string, string> = {
    easy: 'text-green-400',
    medium: 'text-yellow-400',
    hard: 'text-red-400',
};

export const SessionHistoryTable = ({ sessions, loading = false }: SessionHistoryTableProps) => {
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <Card className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
                <CardHeader className="pb-3">
                    <CardTitle className="text-[#cfd3d6] text-sm font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#6b7075]" />
                        Recent Sessions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="h-9 w-9 rounded-lg bg-white/[0.06]" />
                                <div className="space-y-1.5 flex-1">
                                    <Skeleton className="h-3 w-3/4 bg-white/[0.06]" />
                                    <Skeleton className="h-3 w-1/2 bg-white/[0.06]" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (sessions.length === 0) {
        return (
            <Card className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
                <CardContent className="flex flex-col items-center justify-center py-14 text-[#4a5057]">
                    <Code className="w-10 h-10 mb-3 opacity-40" />
                    <p className="text-sm font-medium text-[#6b7075]">No sessions yet</p>
                    <p className="text-xs mt-1">Complete your first coding session to see history</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl overflow-hidden">
            <CardHeader className="pb-3">
                <CardTitle className="text-[#cfd3d6] text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#6b7075]" />
                    Recent Sessions
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                                <th className="text-left px-4 py-2.5 text-[#6b7075] font-medium">Problem</th>
                                <th className="text-left px-3 py-2.5 text-[#6b7075] font-medium">Mode</th>
                                <th className="text-left px-3 py-2.5 text-[#6b7075] font-medium">Result</th>
                                <th className="text-left px-3 py-2.5 text-[#6b7075] font-medium hidden md:table-cell">Partner</th>
                                <th className="text-left px-3 py-2.5 text-[#6b7075] font-medium">Time</th>
                                <th className="text-left px-3 py-2.5 text-[#6b7075] font-medium hidden lg:table-cell">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map((session) => (
                                <tr
                                    key={session.id}
                                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors last:border-0"
                                >
                                    <td className="px-4 py-3 max-w-[180px]">
                                        <p className="text-[#cfd3d6] font-medium truncate" title={session.problem.title}>
                                            {session.problem.title}
                                        </p>
                                        <span className={`text-[10px] ${difficultyColor[session.problem.difficulty] ?? 'text-[#6b7075]'}`}>
                                            {session.problem.difficulty.charAt(0).toUpperCase() + session.problem.difficulty.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="flex items-center gap-1.5 text-[#8a9099]">
                                            {session.mode === 'challenge'
                                                ? <Trophy className="w-3 h-3 text-yellow-500" />
                                                : <User className="w-3 h-3 text-blue-400" />}
                                            <span className="capitalize">{session.mode}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="flex items-center gap-1.5">
                                            {session.result.solved
                                                ? <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                                                : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                                            <span className={session.result.solved ? 'text-green-400' : 'text-red-400'}>
                                                {session.result.testCasesPassed}/{session.result.totalTestCases}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 hidden md:table-cell">
                                        <span className="text-[#6b7075] truncate max-w-[100px] block" title={session.partner?.name ?? 'Unknown'}>
                                            {session.partner?.name ?? 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 font-mono text-[#6b7075]">
                                        {formatDuration(session.duration)}
                                    </td>
                                    <td className="px-3 py-3 text-[#4a5057] hidden lg:table-cell whitespace-nowrap">
                                        {formatDistanceToNow(new Date(session.date), { addSuffix: true })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile card list */}
                <div className="sm:hidden divide-y divide-white/[0.04]">
                    {sessions.map((session) => (
                        <div key={session.id} className="px-4 py-3 space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-[#cfd3d6] text-xs font-medium truncate">{session.problem.title}</p>
                                    <span className={`text-[10px] ${difficultyColor[session.problem.difficulty] ?? 'text-[#6b7075]'}`}>
                                        {session.problem.difficulty.charAt(0).toUpperCase() + session.problem.difficulty.slice(1)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {session.result.solved
                                        ? <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                                        : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                                    <span className={`text-[10px] ${session.result.solved ? 'text-green-400' : 'text-red-400'}`}>
                                        {session.result.testCasesPassed}/{session.result.totalTestCases}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-[#4a5057]">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />{formatDuration(session.duration)}
                                </span>
                                <span className="capitalize">{session.mode}</span>
                                <span className="flex items-center gap-1 ml-auto">
                                    <Calendar className="w-3 h-3" />
                                    {formatDistanceToNow(new Date(session.date), { addSuffix: true })}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
