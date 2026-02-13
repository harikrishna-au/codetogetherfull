import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Calendar, Code, User, Trophy, Zap } from 'lucide-react';
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

export const SessionHistoryTable = ({ sessions, loading = false }: SessionHistoryTableProps) => {
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <Card className="bg-white/5 border-white/10 backdrop-blur">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Recent Sessions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-4">
                                <Skeleton className="h-12 w-12 rounded bg-white/10" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-full bg-white/10" />
                                    <Skeleton className="h-4 w-3/4 bg-white/10" />
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
            <Card className="bg-white/5 border-white/10 backdrop-blur">
                <CardContent className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Code className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">No sessions yet</p>
                    <p className="text-sm">Complete your first coding session to see history!</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-white/5 border-white/10 backdrop-blur overflow-hidden">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Sessions
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="border-white/10 hover:bg-white/5">
                            <TableHead className="text-gray-300">Problem</TableHead>
                            <TableHead className="text-gray-300">Mode</TableHead>
                            <TableHead className="text-gray-300">Result</TableHead>
                            <TableHead className="text-gray-300">Partner</TableHead>
                            <TableHead className="text-gray-300">Duration</TableHead>
                            <TableHead className="text-gray-300">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sessions.map((session) => (
                            <TableRow key={session.id} className="border-white/10 hover:bg-white/5 transition-colors">
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-white font-medium">{session.problem.title}</span>
                                        <span className={`text-xs ${session.problem.difficulty === 'easy' ? 'text-green-400' :
                                                session.problem.difficulty === 'medium' ? 'text-yellow-400' :
                                                    'text-red-400'
                                            }`}>
                                            {session.problem.difficulty.charAt(0).toUpperCase() + session.problem.difficulty.slice(1)}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5">
                                        {session.mode === 'challenge' ? (
                                            <Trophy className="w-3 h-3 text-yellow-500" />
                                        ) : (
                                            <User className="w-3 h-3 text-blue-400" />
                                        )}
                                        <span className="text-gray-300 capitalize text-sm">{session.mode}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {session.result.solved ? (
                                            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Solved
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20">
                                                <XCircle className="w-3 h-3 mr-1" />
                                                Failed
                                            </Badge>
                                        )}
                                        <span className="text-xs text-gray-500">
                                            ({session.result.testCasesPassed}/{session.result.totalTestCases})
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <User className="w-4 h-4 text-gray-500" />
                                        {session.partner?.name || 'Unknown'}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-gray-300 font-mono text-sm">
                                        <Clock className="w-3 h-3 text-gray-500" />
                                        {formatDuration(session.duration)}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                        <Calendar className="w-3 h-3" />
                                        {formatDistanceToNow(new Date(session.date), { addSuffix: true })}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};
