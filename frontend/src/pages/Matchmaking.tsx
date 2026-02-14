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
      <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
        {/* Ambient glow — matches landing page style */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -right-[10%] w-[70%] h-[70%] rounded-full blur-[120px] bg-white/[0.04]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white/[0.02] blur-[80px]" />
        </div>

        <Card className="relative bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl max-w-lg w-full shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <CardContent className="p-8 text-center">
            {phase === 'matching' ? (
              <>
                <div className="mb-8">
                  <div className="relative mx-auto w-28 h-28">
                    {/* Outer ring — emerald */}
                    <div
                      className="absolute inset-0 rounded-full border-2 border-white/[0.06] border-t-white/50 animate-spin"
                      style={{ animationDuration: '1.2s' }}
                    />
                    <div
                      className="absolute inset-2 rounded-full border-2 border-white/[0.04] border-t-white/30 animate-spin"
                      style={{ animationDuration: '1.8s' }}
                    />
                    <div
                      className="absolute inset-4 rounded-full border-2 border-white/[0.03] border-t-white/15 animate-spin"
                      style={{ animationDuration: '2.4s' }}
                    />
                    <div className="absolute inset-6 rounded-full bg-white/[0.03] blur-xl" />
                    <span className="sr-only">Matching players…</span>
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  <p className="text-sm text-[#8a9099]">Matching players…</p>
                  <div className="flex items-center justify-center space-x-2 text-xs text-[#6b7075]">
                    <span className="capitalize">{mode}</span>
                    <span className="text-[#2e3338]">•</span>
                    <span className="capitalize">{difficulty}</span>
                  </div>
                  <p className="text-xs text-[#3a3f45]">Queue times vary based on availability.</p>
                </div>

                {!matchedRoomId && (
                  <button
                    className="mt-4 px-5 py-2 bg-red-900/60 text-red-300 border border-red-800/50 rounded-lg hover:bg-red-800/60 transition text-sm"
                    onClick={handleCancelQueue}
                  >
                    Cancel
                  </button>
                )}

                {matchFound && (
                  <div className="animate-fade-in mt-4">
                    <div className="flex items-center justify-center space-x-2 text-[#e2e5e8] mb-2">
                      <Zap className="w-5 h-5" />
                      <span className="font-semibold">Match Found!</span>
                    </div>
                    <p className="text-[#6b7075] text-sm">Preparing your coding session...</p>
                  </div>
                )}
              </>
            ) : (
              <div className="animate-fade-in">
                <Code className="w-20 h-20 text-[#8a9099] mx-auto mb-6" />
                <h2 className="text-4xl font-bold text-[#e2e5e8] mb-4">Get Ready!</h2>
                <div className="text-6xl font-bold text-[#cfd3d6] mb-4 animate-pulse">
                  {countdown}
                </div>
                <p className="text-[#6b7075]">Session starting...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Matchmaking;
