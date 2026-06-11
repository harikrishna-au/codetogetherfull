import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Code, Zap, Sparkles } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';
import { useSessionAuth } from '@/context/SessionAuthContext';
import { useMatchmaking } from '@/context/MatchmakingContext';
import ActiveUserHeartbeat from '@/components/ActiveUserHeartbeat';
import { Button } from '@/components/ui/button';
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

  return (
    <>
      {user && <ActiveUserHeartbeat userId={user.id} />}
      <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -right-[10%] w-[70%] h-[70%] rounded-full blur-[120px] bg-primary/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[80px]" />
        </div>

        <Card className="relative z-10 bg-card/80 border border-border/50 backdrop-blur-xl max-w-lg w-full shadow-2xl shadow-primary/20">
          <CardContent className="p-8 text-center">
            {phase === 'matching' ? (
              <>
                <div className="mb-8">
                  <div className="relative mx-auto w-32 h-32">
                    {/* Outer ring — primary */}
                    <div
                      className="absolute inset-0 rounded-full border-3 border-primary/30 border-t-primary/80 animate-spin"
                      style={{ animationDuration: '1.2s' }}
                    />
                    <div
                      className="absolute inset-2 rounded-full border-2 border-accent/20 border-t-accent/60 animate-spin"
                      style={{ animationDuration: '1.8s' }}
                    />
                    <div
                      className="absolute inset-4 rounded-full border-2 border-primary/10 border-t-primary/40 animate-spin"
                      style={{ animationDuration: '2.4s' }}
                    />
                    <div className="absolute inset-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 blur-xl" />
                    <span className="sr-only">Matching players…</span>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <p className="text-base font-semibold text-foreground flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Matching players…
                    <Sparkles className="w-4 h-4 text-accent" />
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                    <span className="capitalize font-medium text-foreground/70">{mode}</span>
                    <span className="text-border">•</span>
                    <span className="capitalize font-medium text-foreground/70">{difficulty}</span>
                  </div>

                  {/* Live queue status — appears after first server tick (~5s) */}
                  {queueStatus && (
                    <div className="mt-3 rounded-xl border border-border/40 bg-muted/30 px-4 py-3 text-xs text-muted-foreground space-y-1.5 backdrop-blur-sm">
                      <div className="flex justify-between">
                        <span>Position</span>
                        <span className="font-semibold text-foreground/80">#{queueStatus.position} of {queueStatus.queueSize}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Wait time</span>
                        <span className="font-semibold text-foreground/80">
                          {queueStatus.waitSeconds < 60
                            ? `${queueStatus.waitSeconds}s`
                            : `${Math.floor(queueStatus.waitSeconds / 60)}m ${queueStatus.waitSeconds % 60}s`}
                        </span>
                      </div>
                      {mode === 'challenge' && (
                        <div className="flex justify-between">
                          <span>Rating window</span>
                          <span className="font-semibold text-foreground/80">±{queueStatus.ratingWindow}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {!queueStatus && <p className="text-xs text-muted-foreground">Queue times vary based on availability.</p>}
                </div>

                {!matchedRoomId && (
                  <Button
                    variant="destructive"
                    onClick={handleCancelQueue}
                    className="mt-4"
                  >
                    Cancel
                  </Button>
                )}

                {matchFound && (
                  <div className="animate-fade-in mt-6">
                    <div className="flex items-center justify-center space-x-2 text-primary mb-3">
                      <Zap className="w-5 h-5 animate-bounce" />
                      <span className="font-bold text-lg">Match Found!</span>
                      <Zap className="w-5 h-5 animate-bounce" />
                    </div>
                    <p className="text-muted-foreground text-sm">Preparing your coding session...</p>
                  </div>
                )}
              </>
            ) : (
              <div className="animate-fade-in">
                <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Code className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-4xl font-black text-foreground mb-6">Get Ready!</h2>
                <div className="text-7xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4 animate-pulse">
                  {countdown}
                </div>
                <p className="text-muted-foreground text-base">Session starting...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Matchmaking;
