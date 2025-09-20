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

// Helper to check if user is returning (e.g., after reload/network issue)
function isReturningUser() {
  return window.sessionStorage.getItem('inQueue') === '1';
}

const Matchmaking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // If user is already in queue, ignore location.state and use defaults
  const inQueue = isReturningUser();
  const locationState = (!inQueue && location.state) ? location.state : { mode: 'friendly', difficulty: 'easy' };
  const { user } = useSessionAuth();
  const [mode, setMode] = useState(locationState.mode);
  const [difficulty, setDifficulty] = useState(locationState.difficulty);
  const [matchedRoomId, setMatchedRoomId] = useState<string | null>(null);
  const [hasJoinedQueue, setHasJoinedQueue] = useState(false);
  // ...existing code...
  const { socket, connected } = useSocket();

  // Check if user already has an active session and redirect them
  useEffect(() => {
    if (!user) return;
    
    // Don't redirect if we just came from a session that failed
    const fromSession = sessionStorage.getItem('fromSession');
    if (fromSession) {
      sessionStorage.removeItem('fromSession');
      console.log('[Matchmaking] Just came from failed session, not redirecting');
      return;
    }
    
    let mounted = true;
    
    const checkActiveSession = async () => {
      try {
        const state = await fetchUserState(user.uid);
        if (!mounted) return;
        
        // Only redirect if user is explicitly in a room or matched state
        if (state && (state.state === 'matched' || state.state === 'in-session') && state.roomId && state.roomId.trim() !== '') {
          console.log('[Matchmaking] User has active session, redirecting to room:', state.roomId);
          navigate(`/session/${state.roomId}`, { 
            state: { mode: state.mode, difficulty: state.difficulty },
            replace: true 
          });
        }
      } catch (err) {
        console.error('[Matchmaking] Error checking user state:', err);
      }
    };
    
    // Add a small delay to prevent immediate redirect on page load
    const timeoutId = setTimeout(checkActiveSession, 1000);
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [user, navigate]);

  // Cancel queue handler
  const handleCancelQueue = async () => {
    await fetch(API_ENDPOINTS.CANCEL_QUEUE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ mode, difficulty }),
    });
    window.sessionStorage.removeItem('inQueue');
    navigate('/');
  };

  useEffect(() => {
    if (!user || !socket || !connected) return;
    let cleanupFns: (() => void)[] = [];
    let joined = false;
    // Listen for match found (only once)
    const onMatchFound = (data: any) => {
      window.sessionStorage.removeItem('inQueue');
      setHasJoinedQueue(false);
      joined = false;
      if (data && data.roomId) {
        setMatchedRoomId(data.roomId);
      }
      console.log('[Frontend] matchFound event:', data);
    };
    socket.once('matchFound', onMatchFound);
    cleanupFns.push(() => socket.off('matchFound', onMatchFound));
    // Listen for queue rejoin result (only once)
    const onQueueRejoined = (data: { waiting: boolean, mode?: string, difficulty?: string }) => {
      console.log('[Frontend] queueRejoined event:', data);
      if (data.waiting) {
        if (data.mode) setMode(data.mode);
        if (data.difficulty) setDifficulty(data.difficulty);
        window.sessionStorage.setItem('inQueue', '1');
        setHasJoinedQueue(true);
        joined = true;
      } else {
        if (!joined) {
          console.log('[Frontend] emitting joinQueue', mode);
          socket.emit('joinQueue', { type: mode });
          window.sessionStorage.setItem('inQueue', '1');
          setHasJoinedQueue(true);
          joined = true;
        }
      }
    };
    socket.once('queueRejoined', onQueueRejoined);
    cleanupFns.push(() => socket.off('queueRejoined', onQueueRejoined));
    // On mount, try to rejoin if returning, else join if not already joined
    if (isReturningUser()) {
      if (!joined) {
        console.log('[Frontend] emitting rejoinQueue (global)');
        socket.emit('rejoinQueue', { type: mode });
        setHasJoinedQueue(true);
        joined = true;
      }
    } else {
      if (!joined) {
        console.log('[Frontend] emitting joinQueue', mode);
        socket.emit('joinQueue', { type: mode });
        window.sessionStorage.setItem('inQueue', '1');
        setHasJoinedQueue(true);
        joined = true;
      }
    }
    return () => {
      cleanupFns.forEach(fn => fn());
      window.sessionStorage.removeItem('inQueue');
      setHasJoinedQueue(false);
      joined = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, socket, connected]);

  // Handler for Start Collaboration button
  const handleStartCollaboration = () => {
    if (!user || !socket || !connected) return;
    console.log('[Frontend] emitting joinQueue', mode);
    socket.emit('joinQueue', { type: mode });
    window.sessionStorage.setItem('inQueue', '1');
    setHasJoinedQueue(true);
  };

  // Navigate to /session/:roomId when matchedRoomId is set
  useEffect(() => {
    if (matchedRoomId) {
      navigate(`/session/${matchedRoomId}`, { state: { mode, difficulty } });
    }
  }, [matchedRoomId, navigate, mode, difficulty]);

  const { phase, countdown, matchFound } = useMatchmaking();
  useEffect(() => {
    if (phase === 'countdown') {
      const timeout = setTimeout(() => {
        navigate('/session', { state: { mode, difficulty } });
      }, countdown * 1000);
      return () => clearTimeout(timeout);
    }
  }, [phase, countdown, navigate, mode, difficulty]);

  return (
    <>
      {user && <ActiveUserHeartbeat userId={user.uid} />}
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <Card className="bg-white/5 border-white/20 max-w-lg w-full">
        <CardContent className="p-8 text-center">
          {phase === 'matching' ? (
            <>
              {/* Decorative multi-ring spinner */}
              <div className="mb-8">
                <div className="relative mx-auto w-28 h-28">
                  {/* outer ring */}
                  <div
                    className="absolute inset-0 rounded-full border-2 border-white/10 border-t-purple-400 animate-spin"
                    style={{ animationDuration: '1.2s' }}
                  />
                  {/* middle ring */}
                  <div
                    className="absolute inset-2 rounded-full border-2 border-white/10 border-t-blue-400 animate-spin"
                    style={{ animationDuration: '1.8s' }}
                  />
                  {/* inner ring */}
                  <div
                    className="absolute inset-4 rounded-full border-2 border-white/10 border-t-pink-400 animate-spin"
                    style={{ animationDuration: '2.4s' }}
                  />
                  {/* glow */}
                  <div className="absolute inset-6 rounded-full bg-purple-500/20 blur-2xl" />
                  <span className="sr-only">Matching players…</span>
                </div>
              </div>

              {/* Minimal helper text */}
              <div className="space-y-1 mb-4">
                <p className="text-sm text-gray-300">Matching players…</p>
                <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
                  <span className="capitalize">{mode}</span>
                  <span>•</span>
                  <span className="capitalize">{difficulty}</span>
                </div>
                <p className="text-xs text-gray-500">Queue times vary based on availability.</p>
              </div>
              {/* Only show Cancel button if not matched */}
              {!matchedRoomId && (
                <button
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                  onClick={handleCancelQueue}
                >
                  Cancel
                </button>
              )}

              {matchFound && (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-center space-x-2 text-green-400 mb-4">
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
