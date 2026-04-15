import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API_ENDPOINTS } from '@/lib/api';
import {
    Trophy, Clock, Code, Home, RotateCcw, Eye,
    CheckCircle, XCircle, Zap, Loader2, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import BackgroundEffects from '@/components/landing/BackgroundEffects';

interface SessionResultsData {
    roomId: string;
    mode: string;
    difficulty: string;
    duration: number;
    question: {
        id: string;
        title: string;
        difficulty: string;
        tags: string[];
    };
    participant1: {
        userId: string;
        testCasesPassed: number;
        totalTestCases: number;
        runtime: number;
        language: string;
        finalCode: string;
        endReason: string;
    };
    participant2: {
        userId: string;
        testCasesPassed: number;
        totalTestCases: number;
        runtime: number;
        language: string;
        finalCode: string;
        endReason: string;
    };
}

const difficultyStyles: Record<string, string> = {
    easy: 'bg-green-500/10 text-green-400 border border-green-500/20',
    medium: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    hard: 'bg-red-500/10 text-red-400 border border-red-500/20',
};

const SessionResults = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [results, setResults] = useState<SessionResultsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCodeModal, setShowCodeModal] = useState(false);

    useEffect(() => {
        if (!user || !roomId) {
            navigate('/', { replace: true });
            return;
        }

        const fetchResults = async () => {
            try {
                const res = await fetch(`${API_ENDPOINTS.SESSION_RESULTS}/${roomId}`, {
                    credentials: 'include',
                });

                if (!res.ok) throw new Error('Failed to fetch results');

                const data = await res.json();
                setResults(data.results);

                if (data.results.mode === 'challenge') {
                    const myR = data.results.participant1.userId === user.id
                        ? data.results.participant1 : data.results.participant2;
                    const pR = data.results.participant1.userId === user.id
                        ? data.results.participant2 : data.results.participant1;

                    const won = myR.testCasesPassed > pR.testCasesPassed ||
                        (myR.testCasesPassed === pR.testCasesPassed && myR.runtime < pR.runtime);

                    if (won) {
                        setTimeout(() => {
                            confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
                        }, 500);
                    }
                }
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : 'Failed to load results');
                navigate('/', { replace: true });
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [user, roomId, navigate]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex items-center gap-3 text-[#8a9099]">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Loading results…</span>
                </div>
            </div>
        );
    }

    if (!results) return null;

    const myResults = results.participant1.userId === user?.id
        ? results.participant1 : results.participant2;
    const partnerResults = results.participant1.userId === user?.id
        ? results.participant2 : results.participant1;

    const isChallenge = results.mode === 'challenge';
    const iWon = isChallenge && (
        myResults.testCasesPassed > partnerResults.testCasesPassed ||
        (myResults.testCasesPassed === partnerResults.testCasesPassed &&
            myResults.runtime < partnerResults.runtime)
    );
    const isDraw = isChallenge &&
        myResults.testCasesPassed === partnerResults.testCasesPassed &&
        myResults.runtime === partnerResults.runtime;

    const diff = (results.difficulty || results.question.difficulty).toLowerCase();

    return (
        <div className="relative min-h-screen bg-black overflow-x-hidden">
            <BackgroundEffects />

            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">

                {/* ── Outcome Header ── */}
                <div className="text-center space-y-3 animate-fade-in">
                    {isChallenge ? (
                        <>
                            {iWon && (
                                <div className="flex items-center justify-center gap-3">
                                    <Trophy className="w-10 h-10 text-yellow-400" />
                                    <h1 className="text-4xl sm:text-5xl font-bold text-yellow-400 tracking-tight">Victory!</h1>
                                    <Trophy className="w-10 h-10 text-yellow-400" />
                                </div>
                            )}
                            {isDraw && (
                                <div className="flex items-center justify-center gap-3">
                                    <Zap className="w-10 h-10 text-blue-400" />
                                    <h1 className="text-4xl sm:text-5xl font-bold text-blue-400 tracking-tight">Draw!</h1>
                                    <Zap className="w-10 h-10 text-blue-400" />
                                </div>
                            )}
                            {!iWon && !isDraw && (
                                <h1 className="text-4xl sm:text-5xl font-bold text-[#cfd3d6] tracking-tight">Good Try!</h1>
                            )}
                        </>
                    ) : (
                        <h1 className="text-4xl sm:text-5xl font-bold text-[#e2e5e8] tracking-tight">Session Complete!</h1>
                    )}
                    <p className="text-[#6b7075] text-sm">Great work on the coding challenge</p>
                </div>

                {/* ── Problem Info ── */}
                <Card className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-[#e2e5e8] text-sm font-medium flex items-center gap-2">
                            <Code className="w-4 h-4 text-[#6b7075]" />
                            {results.question.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${difficultyStyles[diff] ?? difficultyStyles.easy}`}>
                                {diff.charAt(0).toUpperCase() + diff.slice(1)}
                            </span>
                            <span className="text-[#6b7075] flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {formatTime(results.duration)}
                            </span>
                            <span className="text-[#6b7075] capitalize">{results.mode} Mode</span>
                        </div>
                        {results.question.tags?.length > 0 && (
                            <div className="flex gap-1.5 flex-wrap">
                                {results.question.tags.map((tag, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.08] text-[#8a9099] rounded text-xs">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ── Performance Cards ── */}
                <div className="grid sm:grid-cols-2 gap-4">
                    {/* Your Results */}
                    <Card className={`border backdrop-blur-xl transition-all ${
                        iWon
                            ? 'border-yellow-400/40 bg-yellow-500/[0.06]'
                            : 'border-white/[0.08] bg-white/[0.03]'
                    }`}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-[#e2e5e8] text-sm font-medium flex items-center gap-2">
                                Your Performance
                                {iWon && <Trophy className="w-4 h-4 text-yellow-400" />}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0">
                            <PerformanceRow
                                label="Test Cases"
                                value={`${myResults.testCasesPassed}/${myResults.totalTestCases}`}
                                passed={myResults.testCasesPassed === myResults.totalTestCases}
                                showIcon
                            />
                            <PerformanceRow label="Runtime" value={`${myResults.runtime}ms`} mono />
                            <PerformanceRow label="Language" value={myResults.language} capitalize />
                        </CardContent>
                    </Card>

                    {/* Partner Results */}
                    {isChallenge && (
                        <Card className={`border backdrop-blur-xl transition-all ${
                            !iWon && !isDraw
                                ? 'border-yellow-400/40 bg-yellow-500/[0.06]'
                                : 'border-white/[0.08] bg-white/[0.03]'
                        }`}>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-[#e2e5e8] text-sm font-medium flex items-center gap-2">
                                    Partner's Performance
                                    {!iWon && !isDraw && <Trophy className="w-4 h-4 text-yellow-400" />}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-0">
                                <PerformanceRow
                                    label="Test Cases"
                                    value={`${partnerResults.testCasesPassed}/${partnerResults.totalTestCases}`}
                                    passed={partnerResults.testCasesPassed === partnerResults.totalTestCases}
                                    showIcon
                                />
                                <PerformanceRow label="Runtime" value={`${partnerResults.runtime}ms`} mono />
                                <PerformanceRow label="Language" value={partnerResults.language} capitalize />
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* ── Action Buttons ── */}
                <div className="flex flex-wrap gap-3 justify-center pt-2">
                    <Button
                        onClick={() => navigate('/matchmaking', {
                            state: { mode: results.mode, difficulty: results.difficulty }
                        })}
                        className="rounded-full px-6 h-10 bg-[#cfd3d6] text-[#0a0a0a] hover:bg-[#e2e5e8] transition-all text-sm font-medium"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Play Again
                    </Button>
                    <Button
                        onClick={() => setShowCodeModal(true)}
                        variant="ghost"
                        className="rounded-full px-6 h-10 text-[#8a9099] hover:text-[#cfd3d6] border border-white/[0.08] hover:border-white/[0.15] transition-all text-sm"
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        View Solutions
                    </Button>
                    <Button
                        onClick={() => navigate('/')}
                        variant="ghost"
                        className="rounded-full px-6 h-10 text-[#8a9099] hover:text-[#cfd3d6] border border-white/[0.08] hover:border-white/[0.15] transition-all text-sm"
                    >
                        <Home className="w-4 h-4 mr-2" />
                        Home
                    </Button>
                </div>
            </div>

            {/* ── Code Comparison Modal ── */}
            {showCodeModal && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    onClick={() => setShowCodeModal(false)}
                >
                    <div
                        className="bg-[#0d0d0d] border border-white/[0.08] rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-5 py-3.5 border-b border-white/[0.08] flex items-center justify-between">
                            <h2 className="text-[#e2e5e8] text-sm font-semibold">Code Comparison</h2>
                            <button
                                onClick={() => setShowCodeModal(false)}
                                className="text-[#6b7075] hover:text-[#cfd3d6] transition-colors p-1 rounded hover:bg-white/[0.06]"
                                aria-label="Close modal"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-0 divide-x divide-white/[0.06] overflow-y-auto max-h-[calc(90vh-56px)]">
                            <CodePane title={`Your Code`} language={myResults.language} code={myResults.finalCode} />
                            <CodePane title="Partner's Code" language={partnerResults.language} code={partnerResults.finalCode} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ── Sub-components ── */

const PerformanceRow = ({
    label, value, mono, capitalize: cap, passed, showIcon
}: {
    label: string;
    value: string;
    mono?: boolean;
    capitalize?: boolean;
    passed?: boolean;
    showIcon?: boolean;
}) => (
    <div className="flex items-center justify-between text-sm">
        <span className="text-[#6b7075]">{label}</span>
        <div className="flex items-center gap-2">
            {showIcon && (
                passed
                    ? <CheckCircle className="w-4 h-4 text-green-400" />
                    : <XCircle className="w-4 h-4 text-red-400" />
            )}
            <span className={`font-medium ${
                showIcon
                    ? (passed ? 'text-green-400' : 'text-yellow-400')
                    : 'text-[#cfd3d6]'
            } ${mono ? 'font-mono' : ''} ${cap ? 'capitalize' : ''}`}>
                {value}
            </span>
        </div>
    </div>
);

const CodePane = ({ title, language, code }: { title: string; language: string; code: string }) => (
    <div className="flex flex-col min-h-0">
        <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
            <h3 className="text-[#cfd3d6] text-xs font-medium">{title}</h3>
            <span className="text-[#6b7075] text-xs font-mono capitalize">{language}</span>
        </div>
        <pre className="flex-1 p-4 text-xs text-[#cfd3d6] font-mono overflow-auto leading-5 whitespace-pre">
            <code>{code || '// No code submitted'}</code>
        </pre>
    </div>
);

export default SessionResults;
