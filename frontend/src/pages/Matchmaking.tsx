import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Code, Zap } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';
import { useSessionAuth } from '@/context/SessionAuthContext';
import { useMatchmaking } from '@/context/MatchmakingContext';
import { API_ENDPOINTS } from '@/lib/api';
import ActiveUserHeartbeat from '@/components/ActiveUserHeartbeat';
import { fetchUserState } from '@/lib/userState';

const Matchmaking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSessionAuth();
  const { socket, connected } = useSocket();
  const { phase, countdown, matchFound, matchedRoomId, matchedQuestion, joinQueue: ctxJoinQueue } = useMatchmaking();

  const locationState = location.state || { mode: 'friendly', difficulty: 'easy' };
  const [mode] = useState(locationState.mode || 'friendly');
  const [difficulty] = useState(locationState.difficulty || 'easy');

  const hasJoinedRef = useRef(false);

  // Check if user already has an active session and redirect
  useEffect(() => {
    if (!user) return;

    const fromSession = sessionStorage.getItem('fromSession');
    if (fromSession) {
      sessionStorage.removeItem('fromSession');
      return;
    }

    let mounted = true;
    const checkActiveSession = async () => {
      try {
        const state = await fetchUserState(user.id);
        if (!mounted) return;
        if (state && (state.state === 'matched' || state.state === 'in-session') && state.roomId?.trim()) {
          navigate(`/session/${state.roomId}`, {
            state: { mode: state.mode, difficulty: state.difficulty },
            replace: true,
          });
        }
      } catch (err) {
        console.error('[Matchmaking] Error checking user state:', err);
      }
    };

    const t = setTimeout(checkActiveSession, 1000);
    return () => { mounted = false; clearTimeout(t); };
  }, [user, navigate]);

  // Join the queue once socket is connected
  useEffect(() => {
    if (!user || !socket || !connected || hasJoinedRef.current) return;
    hasJoinedRef.current = true;

    // Listen for queue rejoin response
    const onQueueRejoined = (data: { waiting: boolean; mode?: string; difficulty?: string }) => {
      console.log('[Matchmaking] queueRejoined:', data);
      if (!data.waiting) {
        // Not already in queue — join fresh
        ctxJoinQueue(mode, difficulty);
      }
      // If waiting=true, we're already in the queue — nothing to do, matchFound will fire
    };
    socket.once('queueRejoined', onQueueRejoined);

    if (sessionStorage.getItem('inQueue') === '1') {
      console.log('[Matchmaking] Returning user — emitting rejoinQueue');
      socket.emit('rejoinQueue', { type: mode });
    } else {
      console.log('[Matchmaking] New user — joining queue', mode, difficulty);
      ctxJoinQueue(mode, difficulty);
    }

    return () => {
      socket.off('queueRejoined', onQueueRejoined);
      // Reset so a reconnect or StrictMode re-mount can re-join
      hasJoinedRef.current = false;
    };
  }, [user, socket, connected]); // eslint-disable-line react-hooks/exhaustive-deps

  // Navigate when match is found and we have a roomId
  useEffect(() => {
    if (matchedRoomId) {
      navigate(`/session/${matchedRoomId}`, { state: { mode, difficulty, question: matchedQuestion } });
    }
  }, [matchedRoomId, navigate, mode, difficulty]);

  // Cancel queue handler
  const handleCancelQueue = () => {
    if (!user) return;
    // Emit leaveQueue over socket (fastest path — removes from in-memory queue instantly)
    if (socket && connected) socket.emit('leaveQueue');
    sessionStorage.removeItem('inQueue');
    sessionStorage.removeItem('queueMode');
    sessionStorage.removeItem('queueDifficulty');
    hasJoinedRef.current = false;
    navigate('/');
  };

  return (
    <>
      {user && <ActiveUserHeartbeat userId={user.id} />}
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        <Card className="bg-white/5 border-white/20 max-w-lg w-full">
          <CardContent className="p-8 text-center">
            {phase === 'matching' ? (
              <>
                <div className="mb-8">
                  <div className="relative mx-auto w-28 h-28">
                    <div
                      className="absolute inset-0 rounded-full border-2 border-white/10 border-t-purple-400 animate-spin"
                      style={{ animationDuration: '1.2s' }}
                    />
                    <div
                      className="absolute inset-2 rounded-full border-2 border-white/10 border-t-blue-400 animate-spin"
                      style={{ animationDuration: '1.8s' }}
                    />
                    <div
                      className="absolute inset-4 rounded-full border-2 border-white/10 border-t-pink-400 animate-spin"
                      style={{ animationDuration: '2.4s' }}
                    />
                    <div className="absolute inset-6 rounded-full bg-purple-500/20 blur-2xl" />
                    <span className="sr-only">Matching players…</span>
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  <p className="text-sm text-gray-300">Matching players…</p>
                  <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
                    <span className="capitalize">{mode}</span>
                    <span>•</span>
                    <span className="capitalize">{difficulty}</span>
                  </div>
                  <p className="text-xs text-gray-500">Queue times vary based on availability.</p>
                </div>

                {!matchedRoomId && (
                  <button
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    onClick={handleCancelQueue}
                  >
                    Cancel
                  </button>
                )}

                {matchFound && (
                  <div className="animate-fade-in mt-4">
                    <div className="flex items-center justify-center space-x-2 text-green-400 mb-2">
                      <Zap className="w-5 h-5" />
                      <span className="font-semibold">Match Found!</span>
                    </div>
                    <p className="text-gray-300 text-sm">Preparing your coding session...</p>
                  </div>
                )}
              </>
            ) : (
              <div className="animate-fade-in">
                <Code className="w-20 h-20 text-green-400 mx-auto mb-6" />
                <h2 className="text-4xl font-bold text-white mb-4">Get Ready!</h2>
                <div className="text-6xl font-bold text-green-400 mb-4 animate-pulse">
                  {countdown}
                </div>
                <p className="text-gray-300">Session starting...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Matchmaking;
