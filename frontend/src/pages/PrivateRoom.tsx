import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSessionAuth } from '@/context/SessionAuthContext';
import { useSocket } from '@/context/SocketContext';
import { API_ENDPOINTS } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Copy, Check, Link, Users, Loader2, Lock } from 'lucide-react';

type Difficulty = 'easy' | 'medium' | 'hard';
type Mode = 'friendly' | 'challenge';

interface RoomState {
  code: string;
  roomId: string;
  mode: Mode;
  difficulty: Difficulty;
  question: any;
}

const PrivateRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, sessionToken } = useSessionAuth();
  const { socket } = useSocket();

  // If navigated here with existing room state, go straight to waiting view
  const preloaded = location.state as RoomState | null;

  const [mode, setMode] = useState<Mode>(preloaded?.mode ?? 'friendly');
  const [difficulty, setDifficulty] = useState<Difficulty>(preloaded?.difficulty ?? 'easy');
  const [creating, setCreating] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(preloaded ?? null);
  const [copied, setCopied] = useState(false);
  const [friendJoined, setFriendJoined] = useState(false);
  const hasListened = useRef(false);

  // Listen for matchFound once the room is created
  useEffect(() => {
    if (!socket || !roomState || hasListened.current) return;
    hasListened.current = true;

    const onMatchFound = (data: any) => {
      if (data.roomId !== roomState.roomId) return;
      setFriendJoined(true);
      setTimeout(() => {
        navigate(`/session/${roomState.roomId}`, {
          state: { mode: roomState.mode, difficulty: roomState.difficulty, question: data.question ?? roomState.question },
        });
      }, 1500);
    };

    socket.on('matchFound', onMatchFound);
    return () => { socket.off('matchFound', onMatchFound); hasListened.current = false; };
  }, [socket, roomState, navigate]);

  const handleCreate = async () => {
    if (!sessionToken) { toast.error('Sign in to create a private room.'); return; }
    setCreating(true);
    try {
      const res = await fetch(API_ENDPOINTS.INVITE_CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ mode, difficulty }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed to create room'); setCreating(false); return; }
      setRoomState({ code: data.code, roomId: data.roomId, mode, difficulty, question: data.question });
    } catch {
      toast.error('Network error');
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = async () => {
    if (roomState && sessionToken) {
      try {
        await fetch(`/api/rooms/${roomState.roomId}/terminate`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${sessionToken}` },
        });
      } catch { /* best-effort */ }
    }
    navigate('/');
  };

  const copyCode = () => {
    if (!roomState) return;
    navigator.clipboard.writeText(roomState.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const copyLink = () => {
    if (!roomState) return;
    navigator.clipboard.writeText(`${window.location.origin}/join/${roomState.code}`).then(() => {
      toast.success('Link copied!');
    });
  };

  const difficultyOptions: Difficulty[] = ['easy', 'medium', 'hard'];
  const modeOptions: { value: Mode; label: string }[] = [
    { value: 'friendly', label: 'Collaborative' },
    { value: 'challenge', label: 'Competitive' },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] rounded-full blur-[120px] bg-primary/10" />
      </div>

      <div className="relative z-10 bg-card/80 border border-border/50 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-primary/20 text-center">

        {!roomState ? (
          /* ── Setup: pick mode + difficulty ── */
          <>
            <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-5">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Private Room</h2>
            <p className="text-muted-foreground text-sm mb-7">
              Create a room and send the invite code to a friend.
            </p>

            <div className="space-y-4 text-left mb-7">
              <div>
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Mode</p>
                <div className="flex gap-2">
                  {modeOptions.map(o => (
                    <button
                      key={o.value}
                      onClick={() => setMode(o.value)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-all
                        ${mode === o.value
                          ? 'bg-primary/20 border-primary/50 text-primary'
                          : 'bg-muted/30 border-border/40 text-muted-foreground hover:border-border/70'}`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Difficulty</p>
                <div className="flex gap-2">
                  {difficultyOptions.map(d => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium capitalize border transition-all
                        ${difficulty === d
                          ? 'bg-accent/20 border-accent/50 text-accent'
                          : 'bg-muted/30 border-border/40 text-muted-foreground hover:border-border/70'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={handleCreate}
              disabled={creating}
              size="lg"
              variant="gradient"
              className="w-full rounded-full gap-2"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {creating ? 'Creating…' : 'Create Room'}
            </Button>
            <Button variant="ghost" size="sm" className="mt-3 text-muted-foreground w-full" onClick={() => navigate('/')}>
              Cancel
            </Button>
          </>
        ) : friendJoined ? (
          /* ── Friend joined ── */
          <div className="animate-fade-in space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Friend joined!</h2>
            <p className="text-muted-foreground text-sm">Starting session…</p>
          </div>
        ) : (
          /* ── Waiting for opponent ── */
          <>
            <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-5">
              <Link className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Private Room</h2>
            <p className="text-muted-foreground text-sm mb-6">Share this code with your friend</p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between gap-2 bg-muted/50 border border-border/50 rounded-xl px-4 py-3">
                <span className="font-mono text-3xl font-bold tracking-[0.25em] text-foreground">
                  {roomState.code}
                </span>
                <button
                  onClick={copyCode}
                  className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors text-muted-foreground hover:text-foreground"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={copyLink}>
                <Link className="w-3.5 h-3.5" />
                Copy invite link
              </Button>
            </div>

            <div className="flex items-center justify-center gap-3 mb-6 text-sm text-muted-foreground">
              <span className="capitalize font-medium text-foreground/70">{roomState.mode}</span>
              <span className="text-border">•</span>
              <span className="capitalize font-medium text-foreground/70">{roomState.difficulty}</span>
            </div>

            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="text-xs text-muted-foreground">Waiting for opponent…</span>
            </div>

            <Button variant="destructive" size="sm" onClick={handleCancel}>Cancel</Button>
          </>
        )}
      </div>
    </div>
  );
};

export default PrivateRoom;
