import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API_ENDPOINTS } from '@/lib/api';
import { Trophy, Clock, Code, Home, RotateCcw, Eye, CheckCircle, XCircle, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

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

const SessionResults = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
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

                if (!res.ok) {
                    throw new Error('Failed to fetch results');
                }

                const data = await res.json();
                setResults(data.results);

                // Trigger confetti if user won in challenge mode
                if (data.results.mode === 'challenge') {
                    const myResults = data.results.participant1.userId === user.id
                        ? data.results.participant1
                        : data.results.participant2;
                    const partnerResults = data.results.participant1.userId === user.id
                        ? data.results.participant2
                        : data.results.participant1;

                    if (myResults.testCasesPassed > partnerResults.testCasesPassed ||
                        (myResults.testCasesPassed === partnerResults.testCasesPassed &&
                            myResults.runtime < partnerResults.runtime)) {
                        setTimeout(() => {
                            confetti({
                                particleCount: 100,
                                spread: 70,
                                origin: { y: 0.6 }
                            });
                        }, 500);
                    }
                }
            } catch (err: any) {
                toast.error(err.message || 'Failed to load results');
                navigate('/', { replace: true });
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [user, roomId, navigate]);

    const handlePlayAgain = () => {
        if (!results) return;
        navigate('/matchmaking', {
            state: { mode: results.mode, difficulty: results.difficulty }
        });
    };

    const handleGoHome = () => {
        navigate('/');
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading results...</div>
            </div>
        );
    }

    if (!results) {
        return null;
    }

    const myResults = results.participant1.userId === user?.id
        ? results.participant1
        : results.participant2;
    const partnerResults = results.participant1.userId === user?.id
        ? results.participant2
        : results.participant1;

    const isChallenge = results.mode === 'challenge';
    const iWon = isChallenge && (
        myResults.testCasesPassed > partnerResults.testCasesPassed ||
        (myResults.testCasesPassed === partnerResults.testCasesPassed &&
            myResults.runtime < partnerResults.runtime)
    );
    const isDraw = isChallenge &&
        myResults.testCasesPassed === partnerResults.testCasesPassed &&
        myResults.runtime === partnerResults.runtime;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center space-y-4 animate-fade-in">
                    {isChallenge && (
                        <div className="flex items-center justify-center gap-3">
                            {iWon && (
                                <>
                                    <Trophy className="w-12 h-12 text-yellow-400" />
                                    <h1 className="text-5xl font-bold text-yellow-400">Victory!</h1>
                                    <Trophy className="w-12 h-12 text-yellow-400" />
                                </>
                            )}
                            {isDraw && (
                                <>
                                    <Zap className="w-12 h-12 text-blue-400" />
                                    <h1 className="text-5xl font-bold text-blue-400">Draw!</h1>
                                    <Zap className="w-12 h-12 text-blue-400" />
                                </>
                            )}
                            {!iWon && !isDraw && (
                                <h1 className="text-5xl font-bold text-gray-400">Good Try!</h1>
                            )}
                        </div>
                    )}
                    {!isChallenge && (
                        <h1 className="text-5xl font-bold text-white">Session Complete!</h1>
                    )}
                    <p className="text-gray-300 text-lg">Great work on the coding challenge</p>
                </div>

                {/* Problem Info */}
                <Card className="bg-white/10 border-white/20 backdrop-blur">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Code className="w-5 h-5" />
                            {results.question.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center gap-4 text-sm">
                            <span className={`px-3 py-1 rounded-full ${results.difficulty === 'easy' ? 'bg-green-500/20 text-green-300' :
                                    results.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                                        'bg-red-500/20 text-red-300'
                                }`}>
                                {results.difficulty.charAt(0).toUpperCase() + results.difficulty.slice(1)}
                            </span>
                            <span className="text-gray-300 flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatTime(results.duration)}
                            </span>
                            <span className="text-gray-300 capitalize">{results.mode} Mode</span>
                        </div>
                        {results.question.tags && results.question.tags.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                                {results.question.tags.map((tag, i) => (
                                    <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Results Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Your Results */}
                    <Card className={`border-2 ${iWon ? 'border-yellow-400 bg-yellow-500/10' : 'bg-white/10 border-white/20'} backdrop-blur`}>
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                Your Performance
                                {iWon && <Trophy className="w-5 h-5 text-yellow-400" />}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300">Test Cases</span>
                                <div className="flex items-center gap-2">
                                    {myResults.testCasesPassed === myResults.totalTestCases ? (
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-400" />
                                    )}
                                    <span className={`font-bold ${myResults.testCasesPassed === myResults.totalTestCases
                                            ? 'text-green-400'
                                            : 'text-yellow-400'
                                        }`}>
                                        {myResults.testCasesPassed}/{myResults.totalTestCases}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300">Runtime</span>
                                <span className="text-white font-mono">{myResults.runtime}ms</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300">Language</span>
                                <span className="text-white capitalize">{myResults.language}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Partner Results */}
                    {isChallenge && (
                        <Card className={`border-2 ${!iWon && !isDraw ? 'border-yellow-400 bg-yellow-500/10' : 'bg-white/10 border-white/20'} backdrop-blur`}>
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    Partner's Performance
                                    {!iWon && !isDraw && <Trophy className="w-5 h-5 text-yellow-400" />}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-300">Test Cases</span>
                                    <div className="flex items-center gap-2">
                                        {partnerResults.testCasesPassed === partnerResults.totalTestCases ? (
                                            <CheckCircle className="w-5 h-5 text-green-400" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-400" />
                                        )}
                                        <span className={`font-bold ${partnerResults.testCasesPassed === partnerResults.totalTestCases
                                                ? 'text-green-400'
                                                : 'text-yellow-400'
                                            }`}>
                                            {partnerResults.testCasesPassed}/{partnerResults.totalTestCases}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-300">Runtime</span>
                                    <span className="text-white font-mono">{partnerResults.runtime}ms</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-300">Language</span>
                                    <span className="text-white capitalize">{partnerResults.language}</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 justify-center pt-4">
                    <Button
                        onClick={handlePlayAgain}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 text-lg"
                    >
                        <RotateCcw className="w-5 h-5 mr-2" />
                        Play Again
                    </Button>
                    <Button
                        onClick={() => setShowCodeModal(true)}
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10 px-6 py-3 text-lg"
                    >
                        <Eye className="w-5 h-5 mr-2" />
                        View Solutions
                    </Button>
                    <Button
                        onClick={handleGoHome}
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10 px-6 py-3 text-lg"
                    >
                        <Home className="w-5 h-5 mr-2" />
                        Home
                    </Button>
                </div>
            </div>

            {/* Code Comparison Modal */}
            {showCodeModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setShowCodeModal(false)}>
                    <div className="bg-[#1e1e1e] rounded-lg max-w-7xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                            <h2 className="text-white text-xl font-bold">Code Comparison</h2>
                            <button onClick={() => setShowCodeModal(false)} className="text-gray-400 hover:text-white">
                                ✕
                            </button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
                            <div>
                                <h3 className="text-white font-semibold mb-2">Your Code ({myResults.language})</h3>
                                <pre className="bg-[#252526] p-4 rounded text-sm text-gray-300 overflow-x-auto">
                                    <code>{myResults.finalCode || '// No code submitted'}</code>
                                </pre>
                            </div>
                            <div>
                                <h3 className="text-white font-semibold mb-2">Partner's Code ({partnerResults.language})</h3>
                                <pre className="bg-[#252526] p-4 rounded text-sm text-gray-300 overflow-x-auto">
                                    <code>{partnerResults.finalCode || '// No code submitted'}</code>
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SessionResults;
