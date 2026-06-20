import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';
import { useSessionAuth } from '@/context/SessionAuthContext';
import { useMatchmaking } from '@/context/MatchmakingContext';
import ActiveUserHeartbeat from '@/components/ActiveUserHeartbeat';
import LoadingScreen from '@/components/LoadingScreen';
import { toast } from 'sonner';

const Matchmaking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSessionAuth();
  const { socket, connected } = useSocket();
  const { phase, countdown, matchFound, matchedRoomId, matchedQuestion, queueStatus, joinQueue: ctxJoinQueue, leaveQueue } = useMatchmaking();

  const locationState = location.state || { mode: 'friendly', difficulty: 'easy' };
  const [mode] = useState(locationState.mode || 'friendly');
  const [difficulty] = useState(locationState.difficulty || 'easy');

  const hasJoinedRef = useRef(false);

  // Join the queue once socket is connected
  useEffect(() => {
    if (!user || !socket || !connected || hasJoinedRef.current) return;
    hasJoinedRef.current = true;

    // Handle matchError — e.g. no questions available
    const onMatchError = (data: { message: string }) => {
      console.error('[Matchmaking] matchError:', data.message);
      toast.error(data.message || 'Matchmaking failed. Please try again.');
      sessionStorage.removeItem('inQueue');
      hasJoinedRef.current = false;
      navigate('/');
    };
    socket.on('matchError', onMatchError);

    // Handle rejoin response
    const onQueueRejoined = (data: { waiting: boolean; mode?: string; difficulty?: string }) => {
      console.log('[Matchmaking] queueRejoined:', data);
      if (!data.waiting) {
        // Not in queue anymore — join fresh with current mode/difficulty
        ctxJoinQueue(mode, difficulty);
      }
      // waiting=true means backend re-added us to the in-memory queue — matchFound will fire
    };
    socket.once('queueRejoined', onQueueRejoined);

    const inQueue = sessionStorage.getItem('inQueue') === '1';
    if (inQueue) {
      console.log('[Matchmaking] Returning user — emitting rejoinQueue', mode);
      socket.emit('rejoinQueue', { type: mode });
    } else {
      console.log('[Matchmaking] New user — joining queue', mode, difficulty);
      ctxJoinQueue(mode, difficulty);
    }

    return () => {
      socket.off('matchError', onMatchError);
      socket.off('queueRejoined', onQueueRejoined);
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
    // Always allow navigation away, even if user/socket is missing
    if (socket && connected) {
      try {
        socket.emit('leaveQueue');
      } catch (e) {
        console.error('Error emitting leaveQueue:', e);
      }
    }

    sessionStorage.removeItem('inQueue');
    sessionStorage.removeItem('queueMode');
    sessionStorage.removeItem('queueDifficulty');
    hasJoinedRef.current = false;
    navigate('/');
  };

  const isChallenge = mode === 'challenge';
  const accent = isChallenge ? '#ff8a7e' : '#6fe9cf';

  const subtitle = (
    <>
      <span className="capitalize px-2 py-0.5 rounded-full font-semibold"
            style={isChallenge
              ? { color: '#ff8a7e', background: 'rgba(255,107,94,0.12)', border: '1px solid rgba(255,107,94,0.25)' }
              : { color: '#6fe9cf', background: 'rgba(78,201,176,0.12)', border: '1px solid rgba(78,201,176,0.25)' }}>
        {isChallenge ? 'Ranked' : 'Friendly'}
      </span>
      <span className="capitalize px-2 py-0.5 rounded-full text-[var(--fg-dim)] border border-white/[0.08]">{difficulty}</span>
    </>
  );

  // ── Countdown phase ──
  if (phase === 'countdown') {
    return (
      <>
        {user && <ActiveUserHeartbeat userId={user.id} />}
        <LoadingScreen
          title="Get ready"
          statusText="session starting"
          showProgress={false}
          centerpiece={
            <div className="ct-scene relative mb-10 flex items-center justify-center" style={{ width: 220, height: 150 }}>
              <div className="absolute w-44 h-44 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(78,201,176,0.3), transparent 70%)' }} />
              <div key={countdown} className="font-display font-extrabold text-[7rem] leading-none ct-text-duel" style={{ animation: 'ct-rise 0.4s ease both' }}>
                {countdown}
              </div>
            </div>
          }
        />
      </>
    );
  }

  // ── Matching phase ──
  return (
    <>
      {user && <ActiveUserHeartbeat userId={user.id} />}
      <LoadingScreen
        title={matchFound ? 'Match found!' : 'Matching players'}
        subtitle={subtitle}
        statusText={matchFound ? 'preparing your session' : 'searching the arena'}
        showProgress={false}
      >
        {/* Live queue status — appears after first server tick (~5s) */}
        {queueStatus && !matchFound && (
          <div className="mt-7 w-72 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-xs space-y-2 backdrop-blur-sm">
            <div className="flex justify-between">
              <span className="text-[var(--fg-faint)]">Position</span>
              <span className="font-semibold text-[var(--fg)] tabular-nums">#{queueStatus.position} of {queueStatus.queueSize}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--fg-faint)]">Wait time</span>
              <span className="font-semibold text-[var(--fg)] tabular-nums">
                {queueStatus.waitSeconds < 60
                  ? `${queueStatus.waitSeconds}s`
                  : `${Math.floor(queueStatus.waitSeconds / 60)}m ${queueStatus.waitSeconds % 60}s`}
              </span>
            </div>
            {isChallenge && (
              <div className="flex justify-between">
                <span className="text-[var(--fg-faint)]">Rating window</span>
                <span className="font-semibold tabular-nums" style={{ color: accent }}>±{queueStatus.ratingWindow}</span>
              </div>
            )}
          </div>
        )}

        {matchFound && (
          <div className="mt-6 flex items-center gap-2 text-[#6fe9cf] font-semibold" style={{ animation: 'ct-rise 0.4s ease both' }}>
            <Zap className="w-5 h-5 animate-bounce" />
            Opponent locked in
            <Zap className="w-5 h-5 animate-bounce" />
          </div>
        )}

        {!matchedRoomId && !matchFound && (
          <button
            onClick={handleCancelQueue}
            className="mt-8 px-6 py-2.5 rounded-full text-sm font-semibold text-[#ff8a7e] border border-[#ff6b5e]/30 bg-[#ff6b5e]/[0.08] hover:bg-[#ff6b5e]/[0.16] transition-colors"
          >
            Cancel
          </button>
        )}
      </LoadingScreen>
    </>
  );
};

export default Matchmaking;
