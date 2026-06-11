import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSessionAuth } from '@/context/SessionAuthContext';
import { API_ENDPOINTS } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Sword, Loader2, AlertCircle } from 'lucide-react';

interface RoomInfo {
  roomId: string;
  mode: string;
  difficulty: string;
  creatorName: string;
  creatorId: string;
}

/**
 * Landing page for invited friends: /join/:code
 * Fetches room info, lets the user accept the challenge.
 */
const JoinRoom = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, sessionToken } = useSessionAuth();

  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code || !sessionToken) return;

    const fetchRoom = async () => {
      try {
        const res = await fetch(`${API_ENDPOINTS.INVITE_BASE}/${code.toUpperCase()}`, {
          headers: { Authorization: `Bearer ${sessionToken}` },
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Invite not found.');
        } else {
          setRoomInfo(data);
        }
      } catch {
        setError('Could not reach the server.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [code, sessionToken]);

  const handleJoin = async () => {
    if (!roomInfo || !sessionToken) return;
    setJoining(true);
    try {
      const res = await fetch(`${API_ENDPOINTS.INVITE_BASE}/${code!.toUpperCase()}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not join room.');
        setJoining(false);
        return;
      }
      navigate(`/session/${roomInfo.roomId}`, {
        state: { mode: roomInfo.mode, difficulty: roomInfo.difficulty, question: data.question },
      });
    } catch {
      setError('Failed to join room.');
      setJoining(false);
    }
  };

  // Wait for auth to load before fetching
  if (!sessionToken && !loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <p className="text-muted-foreground text-sm">Sign in to join this room.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[50%] rounded-full blur-[120px] bg-accent/10" />
      </div>

      <div className="relative z-10 bg-card/80 border border-border/50 backdrop-blur-xl rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Looking up invite…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <p className="text-foreground font-medium">{error}</p>
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>Go home</Button>
          </div>
        ) : roomInfo ? (
          <>
            <div className="w-16 h-16 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center mx-auto mb-5">
              <Sword className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-1">You've been challenged!</h2>
            <p className="text-muted-foreground text-sm mb-6">
              <span className="text-foreground/80 font-medium">{roomInfo.creatorName}</span> is waiting for you
            </p>

            <div className="flex items-center justify-center gap-3 mb-8 text-sm text-muted-foreground">
              <span className="capitalize font-medium text-foreground/70">{roomInfo.mode}</span>
              <span className="text-border">•</span>
              <span className="capitalize font-medium text-foreground/70">{roomInfo.difficulty}</span>
            </div>

            {roomInfo.creatorId === user?.id ? (
              <p className="text-destructive text-sm">This is your own room — share the link with a friend.</p>
            ) : (
              <Button
                onClick={handleJoin}
                disabled={joining}
                size="lg"
                variant="gradient-alt"
                className="w-full rounded-full gap-2"
              >
                {joining ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Joining…</>
                ) : (
                  <><Sword className="w-4 h-4" /> Accept Challenge</>
                )}
              </Button>
            )}

            <Button variant="ghost" size="sm" className="mt-3 text-muted-foreground" onClick={() => navigate('/')}>
              Decline
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default JoinRoom;
