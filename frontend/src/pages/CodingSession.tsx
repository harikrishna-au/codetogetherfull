import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useSessionAuth } from '@/context/SessionAuthContext';
import { API_ENDPOINTS } from '@/lib/api';
import type { ExecuteResult } from '@/components/session/ResultsPanel';
import { toast } from 'sonner';
import { useSocket } from '../context/SocketContext';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import ProblemPanel from '@/components/session/ProblemPanel';
import EditorPanel, { languageTemplates, type SupportedLanguage } from '@/components/session/EditorPanel';
import ResultsPanel from '@/components/session/ResultsPanel';
import PartnerRail from '@/components/session/PartnerRail';
import FloatingVideo from '@/components/session/FloatingVideo';
import { useChat } from '@/hooks/useChat';
import ActiveUserHeartbeat from '@/components/ActiveUserHeartbeat';
import { useYjsCollaboration } from '@/hooks/useYjsCollaboration';
import { Switch } from '@/components/ui/switch';
import { useWebRTC } from '@/hooks/useWebRTC';
import { Users, Trophy, X, Swords } from 'lucide-react';
import { UserButton, SignedIn } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

// ─── Win overlay ─────────────────────────────────────────────────────────────

interface RatingChangeInfo {
  userId: string;
  oldRating: number;
  newRating: number;
  delta: number;
}

interface WinData {
  winnerId: string;
  passed: number;
  total: number;
  runtime: number;
  language: string;
  reason?: 'submission' | 'forfeit' | 'timer';
  /** Present only for rated (challenge) matches */
  ratings?: { winner: RatingChangeInfo; loser: RatingChangeInfo };
}

const WinOverlay = ({
  data,
  myId,
  onClose,
}: {
  data: WinData;
  myId: string;
  onClose: () => void;
}) => {
  const iWon = data.winnerId === myId;
  const isForfeit = data.reason === 'forfeit';
  const accent = iWon ? '#4ec9b0' : '#ff6b5e';
  const accentBright = iWon ? '#6fe9cf' : '#ff8a7e';
  return (
    <div className="arena fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
         style={{ animation: 'ct-rise 0.3s ease both' }}>
      {/* radiating burst */}
      <div className="absolute w-[60vw] h-[60vw] rounded-full blur-[120px] pointer-events-none"
           style={{ background: `radial-gradient(circle, ${accent}33, transparent 65%)` }} />

      <div
        className="relative rounded-3xl p-10 text-center w-full max-w-sm overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #14181c, #0c0e11)',
          border: `1px solid ${accent}55`,
          boxShadow: `0 40px 100px -20px ${accent}66, inset 0 1px 0 rgba(255,255,255,0.05)`,
          animation: 'ct-rise 0.45s cubic-bezier(0.22,1,0.36,1) both',
        }}
      >
        {/* top accent line */}
        <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />

        <button onClick={onClose} className="absolute top-3 right-3 text-[#5c636b] hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        {/* trophy medallion */}
        <div className="relative mx-auto mb-5 w-20 h-20 ct-scene">
          <div className="ct-3d w-full h-full rounded-2xl flex items-center justify-center"
               style={{ background: `linear-gradient(160deg, ${accent}33, ${accent}0d)`, border: `1px solid ${accent}55`, transform: 'rotateX(-12deg) rotateY(14deg)', boxShadow: `0 20px 50px -10px ${accent}66` }}>
            <Trophy className="w-10 h-10" style={{ color: accentBright }} />
          </div>
        </div>

        <h2 className="font-display text-4xl font-extrabold mb-2 tracking-tight" style={{ color: accentBright }}>
          {iWon ? 'Victory' : 'Defeated'}
        </h2>
        <p className="text-sm mb-1 text-[#9aa1a9]">
          {isForfeit
            ? (iWon ? 'Your opponent disconnected — you win by forfeit.' : 'You forfeited by disconnecting.')
            : (iWon ? 'First to pass every test. Clean work.' : 'Your opponent solved it first.')}
        </p>
        {!isForfeit && (
          <p className="font-mono-ct text-xs text-[#5c636b]">
            {data.passed}/{data.total} tests · {data.runtime.toFixed(1)}ms · {data.language}
          </p>
        )}

        {data.ratings && (() => {
          const myChange = iWon ? data.ratings.winner : data.ratings.loser;
          const positive = myChange.delta >= 0;
          return (
            <div className="mt-6 pt-5 border-t border-white/[0.06]">
              <div className="text-5xl font-display font-extrabold tabular-nums"
                   style={{ color: positive ? '#6fe9cf' : '#ff8a7e', animation: 'ct-rise 0.5s ease 0.2s both' }}>
                {positive ? '+' : ''}{myChange.delta}
              </div>
              <p className="text-[#5c636b] text-xs mt-2 font-mono-ct">
                {myChange.oldRating} → <span className="text-[#9aa1a9] font-semibold">{myChange.newRating}</span> rating
              </p>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const SESSION_STORE_KEY = 'arena.activeSession';

const CodingSession = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const { sessionToken } = useSessionAuth();
  const location = useLocation();
  const params = useParams();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const roomId = params.roomId;

  // Recover mode/difficulty from navigation state (first load) or sessionStorage (reload)
  const sessionMeta = (() => {
    if (location.state?.mode) return location.state;
    try { return JSON.parse(sessionStorage.getItem(SESSION_STORE_KEY) ?? '{}'); } catch { return {}; }
  })();
  const { mode = 'friendly', difficulty = 'easy', question: locationQuestion = null } = sessionMeta;

  const userName = user?.displayName || user?.email || 'You';

  // Persist session metadata so a page reload lands back in the session
  useEffect(() => {
    if (!roomId) return;
    try {
      sessionStorage.setItem(SESSION_STORE_KEY, JSON.stringify({ mode, difficulty, roomId }));
    } catch { /* non-fatal */ }
  }, [roomId, mode, difficulty]);

  // ── Validate room ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return; // Wait for Clerk to finish loading — don't redirect prematurely on reload
    if (!user || !roomId) {
      sessionStorage.removeItem(SESSION_STORE_KEY);
      navigate('/', { replace: true });
      return;
    }
    const isValidRoomId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);
    if (!isValidRoomId) {
      sessionStorage.removeItem(SESSION_STORE_KEY);
      navigate('/', { replace: true });
      return;
    }
  }, [user, roomId, navigate, authLoading]);

  // ── Editor state ─────────────────────────────────────────────────────────────
  // Independent editor by default; `isSynced` activates Yjs collaboration
  const [isSynced, setIsSynced] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // React-controlled code (independent mode). Seeded from the question's JS starter code.
  const getInitialCode = () => {
    if (!locationQuestion?.starterCode) return languageTemplates['javascript'];
    const sc = locationQuestion.starterCode;
    if (typeof sc === 'object') return sc['javascript'] || Object.values(sc)[0] as string;
    return String(sc);
  };
  const [code, setCode] = useState<string>(getInitialCode);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('javascript');
  const [questionId, setQuestionId] = useState<string | null>(locationQuestion?.id ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executeResult, setExecuteResult] = useState<ExecuteResult | null>(null);

  // Win overlay (populated by the server-authoritative `roundWinner` event)
  const [winData, setWinData] = useState<WinData | null>(null);

  // Opponent disconnect banner (A4): timestamp when the forfeit triggers, null = opponent present
  const [opponentDeadline, setOpponentDeadline] = useState<number | null>(null);
  const [forfeitSecondsLeft, setForfeitSecondsLeft] = useState(0);

  // Tick the forfeit countdown once per second while the banner is up
  useEffect(() => {
    if (!opponentDeadline) return;
    const tick = () => setForfeitSecondsLeft(Math.max(0, Math.ceil((opponentDeadline - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [opponentDeadline]);

  // Refs to avoid stale closures in socket callbacks
  const executeResultRef = useRef<ExecuteResult | null>(null);
  const codeRef = useRef<string>(code);
  const selectedLanguageRef = useRef<SupportedLanguage>(selectedLanguage);

  // ── WebRTC ───────────────────────────────────────────────────────────────────
  const { localStream, remoteStream, isConnected: isWebRTCConnected } = useWebRTC({
    socket,
    roomId,
    userId: user?.id ?? '',
    isVideoOn,
    isAudioOn,
  });

  // ── Yjs collaboration (active only when isSynced = true) ─────────────────────
  const { bindToMonaco, resetContent, getContent, partnerUsers, partnerTyping, isContentEmpty } =
    useYjsCollaboration({ socket, roomId, userId: user?.id ?? '', userName });

  // Keep refs in sync with latest state for socket callbacks
  useEffect(() => { executeResultRef.current = executeResult; }, [executeResult]);
  useEffect(() => { codeRef.current = code; }, [code]);
  useEffect(() => { selectedLanguageRef.current = selectedLanguage; }, [selectedLanguage]);

  // ── Socket events ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !roomId || roomId === 'session-room') return;
    let joined = false;

    const tryJoinRoom = () => {
      if (socket.connected && roomId && !joined) {
        joined = true;
        socket.emit('join', { roomId }, (ack: any) => {
          socket.emit('fetchChatHistory', { roomId }, () => { });
          socket.emit('getRoomQuestion', { roomId }, (res: any) => {
            if (res?.success && res.question?.id) {
              setQuestionId(prev => prev ?? res.question.id);
              // If still in independent mode and no code set yet, seed the starter code
              if (res.question.starterCode && !isSynced) {
                const sc = res.question.starterCode;
                const starter = typeof sc === 'object'
                  ? sc['javascript'] || Object.values(sc)[0] as string
                  : String(sc);
                setCode(prev => (prev === languageTemplates['javascript'] ? starter : prev));
              }
            }
          });
        });
      }
    };

    socket.on('connect', tryJoinRoom);
    tryJoinRoom();

    // Partner activated sync: we receive their code and activate Yjs
    const handleCodeSynced = (data: { initiatorId: string; code: string }) => {
      const isMe = data.initiatorId === user?.id;
      // Load their code into Yjs doc, then switch to collaborative mode
      resetContent(data.code);
      setCode(data.code); // keep React state in sync too
      setIsSynced(true);
      if (!isMe) {
        toast.success('Your partner synced the code! Collaborative editing is now active.', { duration: 4000 });
      } else {
        toast.success('Collaborative editing activated!', { duration: 3000 });
      }
    };
    socket.on('codeSynced', handleCodeSynced);

    // Round winner (server-authoritative): submission win or forfeit
    const handleRoundWinner = async (data: WinData) => {
      setWinData(data);
      setOpponentDeadline(null);

      const iWon = data.winnerId === user?.id;
      // A submission winner's results were already saved by execute.ts. Everyone else
      // (the loser, or a forfeit winner who never submitted) saves their state here.
      if (!iWon || data.reason === 'forfeit') {
        try {
          const curResult = executeResultRef.current;
          const curCode = isSynced ? (getContent() || codeRef.current) : codeRef.current;
          await fetch(API_ENDPOINTS.SAVE_SESSION_RESULTS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              roomId,
              testCasesPassed: curResult?.passed || 0,
              totalTestCases: curResult?.totalTests || 0,
              runtime: curResult?.overallRuntime || 0,
              language: selectedLanguageRef.current,
              finalCode: curCode,
              endReason: data.reason === 'forfeit'
                ? (iWon ? 'opponent-forfeit' : 'forfeit')
                : 'partner-won',
            }),
          });
        } catch {
          // Don't block navigation if save fails
        }
      }

      // Auto-dismiss after 6 seconds and go to results (rating change rides along)
      setTimeout(() => {
        navigate(`/session/${roomId}/results`, {
          replace: true,
          state: { ratings: data.ratings, winnerId: data.winnerId },
        });
      }, 6000);
    };
    socket.on('roundWinner', handleRoundWinner);

    // Opponent disconnect / reconnect during the match (A4 forfeit grace flow)
    const handleOpponentDisconnected = (data: { roomId: string; userId: string; graceMs: number; deadline: number }) => {
      if (data.userId === user?.id) return; // event is about us, not the opponent
      setOpponentDeadline(data.deadline);
    };
    const handleOpponentReconnected = (data: { roomId: string; userId: string }) => {
      if (data.userId === user?.id) return;
      setOpponentDeadline(null);
      toast.success('Opponent reconnected — match continues!');
    };
    socket.on('opponentDisconnected', handleOpponentDisconnected);
    socket.on('opponentReconnected', handleOpponentReconnected);

    // Room closed / timer expired
    const handleRoomSessionEnd = async (event: 'roomClosed' | 'room-exit', data: any) => {
      if (event === 'roomClosed') {
        toast.error('The other user has exited. Session closed.');
      } else if (data.reason === 'timer-expired') {
        toast.error("⏰ Time's up! Session has ended.");
      } else {
        toast.error('A user has left the session.');
      }
      try {
        const curResult = executeResultRef.current;
        const curCode = isSynced ? (getContent() || codeRef.current) : codeRef.current;
        await fetch(API_ENDPOINTS.SAVE_SESSION_RESULTS, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            roomId: data.roomId || roomId,
            testCasesPassed: curResult?.passed || 0,
            totalTestCases: curResult?.totalTests || 0,
            runtime: curResult?.overallRuntime || 0,
            language: selectedLanguageRef.current,
            finalCode: curCode,
            endReason: data.reason || 'partner-exit',
          }),
        });
      } catch (_e) { /* ignore save errors on room close */ }
      setTimeout(() => {
        navigate(`/session/${data.roomId || roomId}/results`, { replace: true });
      }, 1500);
    };
    socket.on('roomClosed', (data) => handleRoomSessionEnd('roomClosed', data));
    socket.on('room-exit', (data) => handleRoomSessionEnd('room-exit', data));

    // Partner language change (only relevant in synced mode)
    const handlePartnerLanguageChange = (data: { language: SupportedLanguage; template: string }) => {
      setSelectedLanguage(data.language);
      if (isSynced) resetContent(data.template);
      else setCode(data.template);
    };
    socket.on('languageChange', handlePartnerLanguageChange);

    const handleSocketDisconnect = () => {
      toast.error('Lost connection to server. Exiting session.');
      setTimeout(() => { window.location.href = '/'; }, 1000);
    };
    socket.on('disconnect', handleSocketDisconnect);

    return () => {
      socket.off('connect', tryJoinRoom);
      socket.off('codeSynced', handleCodeSynced);
      socket.off('roundWinner', handleRoundWinner);
      socket.off('opponentDisconnected', handleOpponentDisconnected);
      socket.off('opponentReconnected', handleOpponentReconnected);
      socket.off('roomClosed');
      socket.off('room-exit');
      socket.off('disconnect', handleSocketDisconnect);
      socket.off('languageChange', handlePartnerLanguageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, roomId, isSynced]);

  // ── Chat ─────────────────────────────────────────────────────────────────────
  const { chatMessage, setChatMessage, chatMessages, handleSendMessage } = useChat({
    socket, roomId, userName,
  });

  // ── Language change ──────────────────────────────────────────────────────────
  const handleLanguageChange = (lang: SupportedLanguage) => {
    setSelectedLanguage(lang);
    const sc = locationQuestion?.starterCode;
    let template: string;
    if (sc && typeof sc === 'object' && sc[lang]) {
      template = sc[lang];
    } else {
      template = languageTemplates[lang];
    }
    if (isSynced) {
      resetContent(template);
    } else {
      setCode(template);
    }
    if (socket && roomId) {
      socket.emit('languageChange', { roomId, language: lang, template });
    }
  };

  // ── Code execution ───────────────────────────────────────────────────────────
  const handleCodeExecution = async (execMode: 'run' | 'submit') => {
    if (!questionId) {
      toast.error('Question not loaded yet. Please wait.');
      return;
    }
    const currentCode = isSynced ? (getContent() || code) : code;
    const visibleOnly = execMode === 'run';
    setIsSubmitting(true);
    setExecuteResult(null);
    try {
      const res = await fetch(API_ENDPOINTS.EXECUTE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ code: currentCode, language: selectedLanguage, questionId, visibleOnly, roomId }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Surface 429 (per-user rate limit) and other failures in ResultsPanel
        const friendly = data.error
          || (res.status === 429
            ? 'You are running code too quickly — wait a moment and try again.'
            : 'Execution failed. Please try again.');
        setExecuteResult({
          totalTests: 0, passed: 0, failed: 0, results: [],
          compilationError: null, overallRuntime: 0,
          serviceError: friendly,
        });
        toast.error(friendly);
        return;
      }
      const result: ExecuteResult = data.results;
      setExecuteResult(result);

      if (result.compilationError) {
        toast.error('Compilation error');
      } else if (result.passed === result.totalTests) {
        // Win is now decided server-side (A3): when a full submit passes all tests, the
        // backend ends the room and broadcasts `roundWinner`. We just surface progress here.
        toast.success(`${execMode === 'run' ? 'Run' : 'Submit'}: ${result.passed}/${result.totalTests} passed!`);
      } else {
        toast.error(`${result.passed}/${result.totalTests} test cases passed`);
      }
    } catch (err: any) {
      const friendly = 'Could not reach the execution server. Check your connection and try again.';
      setExecuteResult({
        totalTests: 0, passed: 0, failed: 0, results: [],
        compilationError: null, overallRuntime: 0,
        serviceError: friendly,
      });
      toast.error(err.message || friendly);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Exit session ─────────────────────────────────────────────────────────────
  const handleExitSession = async () => {
    if (!roomId) { toast.error('Invalid room ID.'); return; }
    try {
      await fetch(API_ENDPOINTS.SAVE_SESSION_RESULTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          roomId,
          testCasesPassed: executeResult?.passed || 0,
          totalTestCases: executeResult?.totalTests || 0,
          runtime: executeResult?.overallRuntime || 0,
          language: selectedLanguage,
          finalCode: isSynced ? (getContent() || code) : code,
          endReason: 'user-exit',
        }),
      });
      const res = await fetch(API_ENDPOINTS.END_ROOM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ roomId }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to end session');
      }
      navigate(`/session/${roomId}/results`, { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Failed to end session');
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {user && <ActiveUserHeartbeat userId={user.id} />}

      {/* Win / lose overlay */}
      {winData && (
        <WinOverlay
          data={winData}
          myId={user?.id ?? ''}
          onClose={() => setWinData(null)}
        />
      )}

      <div className="flex flex-col h-screen bg-[#08090b]">
        {/* Opponent disconnected banner (A4 forfeit grace countdown) */}
        {opponentDeadline && !winData && (
          <div className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-[#ff8a7e] border-b border-[#ff6b5e]/30"
               style={{ background: 'linear-gradient(180deg, rgba(255,107,94,0.16), rgba(255,107,94,0.05))' }}>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff6b5e] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff6b5e]" />
            </span>
            Opponent disconnected — <span className="font-mono tabular-nums font-semibold">{forfeitSecondsLeft}s</span> to reconnect, or you win by forfeit
          </div>
        )}

        {/* ── Arena top bar ── */}
        <div
          className="relative flex items-center justify-between px-4 h-12 border-b border-white/[0.08]"
          style={{ background: 'linear-gradient(180deg, #0e1114, #0a0c0e)' }}
        >
          {/* Left — brand + match meta */}
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold font-mono"
                    style={{ background: 'linear-gradient(160deg, rgba(78,201,176,0.22), rgba(255,107,94,0.14))', border: '1px solid rgba(78,201,176,0.35)', color: '#6fe9cf' }}>
                &lt;/&gt;
              </span>
            </Link>
            <span className="hidden sm:flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full capitalize font-semibold"
                    style={mode === 'challenge'
                      ? { color: '#ff8a7e', background: 'rgba(255,107,94,0.12)', border: '1px solid rgba(255,107,94,0.25)' }
                      : { color: '#6fe9cf', background: 'rgba(78,201,176,0.12)', border: '1px solid rgba(78,201,176,0.25)' }}>
                {mode === 'challenge' ? 'Ranked duel' : 'Collaborate'}
              </span>
              <span className="px-2 py-0.5 rounded-full capitalize text-[#9aa1a9] border border-white/[0.08]">{difficulty}</span>
            </span>
          </div>

          {/* Center — VS presence */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-[#6fe9cf]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ec9b0] animate-pulse" />
              You
            </span>
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/[0.04] border border-white/[0.1]">
              <Swords className="w-3 h-3 text-[#9aa1a9]" />
            </span>
            <span className={`flex items-center gap-1.5 ${opponentDeadline ? 'text-[#5c636b]' : 'text-[#ff8a7e]'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${opponentDeadline ? 'bg-[#5c636b]' : 'bg-[#ff6b5e] animate-pulse'}`} />
              {opponentDeadline ? 'Reconnecting…' : 'Opponent'}
            </span>
          </div>

          {/* Right — sync + profile */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className={`hidden sm:inline text-[11px] font-medium ${isSynced ? 'text-[#6fe9cf]' : 'text-[#5c636b]'}`}>
                {isSynced ? 'Synced' : 'Solo'}
              </span>
              <Switch
                checked={isSynced}
                onCheckedChange={(checked) => {
                  setIsSynced(checked);
                  checked ? toast.success('Collaborative editing enabled') : toast.info('Collaborative editing disabled');
                }}
                className="data-[state=checked]:bg-[#4ec9b0] data-[state=unchecked]:bg-white/[0.06]"
              />
            </label>
            <SignedIn>
              <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08]">
                <div className="ring-1 ring-white/10 rounded-full hover:ring-[#4ec9b0]/40 transition-all">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </div>
            </SignedIn>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            {/* Left Panel – Problem */}
            <ResizablePanel order={1} defaultSize={30} minSize={22}>
              <ProblemPanel difficulty={difficulty} roomId={roomId} initialQuestion={locationQuestion} />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Center Panel – Editor + Results */}
            <ResizablePanel order={2} defaultSize={isChatOpen ? 48 : 70}>
              <div className="flex flex-col h-full">
              <div className="flex-1 overflow-hidden">
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={70} minSize={50}>
                  <EditorPanel
                    code={code}
                    setCode={setCode}
                    isSubmitting={isSubmitting}
                    onRun={() => handleCodeExecution('run')}
                    onSubmit={() => handleCodeExecution('submit')}
                    onLanguageChange={handleLanguageChange}
                    language={selectedLanguage}
                    // Pass Yjs binding only when collaborative mode is active
                    onEditorMount={isSynced ? bindToMonaco : undefined}
                    partnerUsers={isSynced ? partnerUsers : []}
                    partnerTyping={isSynced ? partnerTyping : false}
                    isVideoOn={isVideoOn}
                    setIsVideoOn={setIsVideoOn}
                    isAudioOn={isAudioOn}
                    setIsAudioOn={setIsAudioOn}
                    isChatOpen={isChatOpen}
                    setIsChatOpen={setIsChatOpen}
                    handleExitSession={handleExitSession}
                    roomId={roomId || ''}
                  />
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={30} minSize={20}>
                  <ResultsPanel isSubmitting={isSubmitting} executeResult={executeResult} />
                </ResizablePanel>
              </ResizablePanelGroup>
              </div>
              </div>
            </ResizablePanel>

            {/* Right Panel – Partner Rail (presence + chat, true side-by-side) */}
            {isChatOpen && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel order={3} defaultSize={22} minSize={16} maxSize={34}>
                  <PartnerRail
                    partnerName={partnerUsers[0]?.name
                      || chatMessages.find(m => m.user !== userName)?.user}
                    partnerTyping={partnerTyping}
                    partnerPresent={isWebRTCConnected || partnerUsers.length > 0
                      || chatMessages.some(m => m.user !== userName)}
                    setIsChatOpen={setIsChatOpen}
                    chatMessage={chatMessage}
                    setChatMessage={setChatMessage}
                    chatMessages={chatMessages}
                    handleSendMessage={handleSendMessage}
                    currentUserName={userName}
                  />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>

        {/* Floating face bubbles — video presence that steals zero layout space */}
        {(isVideoOn || isAudioOn || remoteStream) && !winData && (
          <FloatingVideo
            localStream={localStream}
            remoteStream={remoteStream}
            isVideoOn={isVideoOn}
            isAudioOn={isAudioOn}
            isConnected={isWebRTCConnected}
            partnerName={partnerUsers[0]?.name
              || chatMessages.find(m => m.user !== userName)?.user}
          />
        )}
      </div>
    </>
  );
};

export default CodingSession;
