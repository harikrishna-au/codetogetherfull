import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API_ENDPOINTS } from '@/lib/api';
import type { ExecuteResult } from '@/components/session/ResultsPanel';
import { toast } from 'sonner';
import { useSocket } from '../context/SocketContext';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import ProblemPanel from '@/components/session/ProblemPanel';
import EditorPanel, { languageTemplates, type SupportedLanguage } from '@/components/session/EditorPanel';
import ResultsPanel from '@/components/session/ResultsPanel';
import ChatSidebar from '@/components/session/ChatSidebar';
import VideoPanel from '@/components/session/VideoPanel';
import { useChat } from '@/hooks/useChat';
import ActiveUserHeartbeat from '@/components/ActiveUserHeartbeat';
import { useYjsCollaboration } from '@/hooks/useYjsCollaboration';
import { Switch } from '@/components/ui/switch';
import { useWebRTC } from '@/hooks/useWebRTC';
import { Users, Trophy, X } from 'lucide-react';
import { UserButton, SignedIn } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

// ─── Win overlay ─────────────────────────────────────────────────────────────

interface WinData {
  winnerId: string;
  passed: number;
  total: number;
  runtime: number;
  language: string;
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className={`relative rounded-2xl p-10 text-center shadow-2xl max-w-sm w-full
        ${iWon ? 'bg-gradient-to-br from-yellow-900 via-yellow-800 to-yellow-900 border border-yellow-500/50'
          : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-600/50'}`}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        <Trophy className={`w-16 h-16 mx-auto mb-4 ${iWon ? 'text-yellow-400' : 'text-slate-500'}`} />
        <h2 className={`text-3xl font-bold mb-2 ${iWon ? 'text-yellow-300' : 'text-slate-300'}`}>
          {iWon ? '🎉 You Won!' : '😔 You Lost'}
        </h2>
        <p className="text-gray-300 text-sm mb-1">
          {iWon ? 'First to solve it!' : 'Your opponent solved it first.'}
        </p>
        <p className="text-gray-400 text-xs">
          {data.passed}/{data.total} tests · {data.runtime.toFixed(1)} ms · {data.language}
        </p>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const CodingSession = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const params = useParams();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const { mode, difficulty, question: locationQuestion } = location.state || { mode: 'friendly', difficulty: 'easy' };
  const roomId = params.roomId;
  const userName = user?.displayName || user?.email || 'You';

  // ── Validate room ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !roomId) {
      sessionStorage.setItem('fromSession', 'true');
      navigate('/', { replace: true });
      return;
    }
    const isValidRoomId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);
    if (!isValidRoomId) {
      sessionStorage.setItem('fromSession', 'true');
      navigate('/', { replace: true });
      return;
    }
    sessionStorage.removeItem('fromSession');
  }, [user, roomId, navigate]);

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

  // Win overlay
  const [winData, setWinData] = useState<WinData | null>(null);
  // Prevent emitting submissionWin more than once per session
  const hasEmittedWin = useRef(false);

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

    // First successful submission — round winner
    const handleRoundWinner = async (data: WinData) => {
      setWinData(data);

      // Only save for the non-winner — the winner's data was already saved
      // correctly by execute.ts during their submission
      if (data.winnerId !== user?.id) {
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
              endReason: 'partner-won',
            }),
          });
        } catch {
          // Don't block navigation if save fails
        }
      }

      // Auto-dismiss after 6 seconds and go to results
      setTimeout(() => {
        navigate(`/session/${roomId}/results`, { replace: true });
      }, 6000);
    };
    socket.on('roundWinner', handleRoundWinner);

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
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: currentCode, language: selectedLanguage, questionId, visibleOnly, roomId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Execution failed');
        return;
      }
      const result: ExecuteResult = data.results;
      setExecuteResult(result);

      if (result.compilationError) {
        toast.error('Compilation error');
      } else if (result.passed === result.totalTests) {
        // Full submit + all tests pass = emit win
        if (execMode === 'submit' && socket && roomId && !hasEmittedWin.current) {
          hasEmittedWin.current = true;
          socket.emit('submissionWin', {
            roomId,
            passed: result.passed,
            total: result.totalTests,
            runtime: result.overallRuntime,
            language: selectedLanguage,
          });
        }
        toast.success(`${execMode === 'run' ? 'Run' : 'Submit'}: ${result.passed}/${result.totalTests} passed!`);
      } else {
        toast.error(`${result.passed}/${result.totalTests} test cases passed`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Execution failed');
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

      <div className="flex flex-col h-screen">
        {/* Top banner: sync button + mode badge */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-black border-b border-white/[0.08] text-xs text-[#4a5057]">
          <div className="flex items-center gap-2">
            <span className="capitalize font-medium text-[#8a9099]">{mode}</span>
            <span className="text-[#2e3338]">·</span>
            <span className="capitalize text-[#6b7075]">{difficulty}</span>
            {isSynced && (
              <span className="flex items-center gap-1 text-[#cfd3d6] ml-2">
                <Users className="w-3 h-3" /> Collaborative
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs ${isSynced ? 'text-[#cfd3d6] font-medium' : 'text-[#2e3338]'}`}>
              {isSynced ? 'Sync ON' : 'Sync OFF'}
            </span>
            <Switch
              checked={isSynced}
              onCheckedChange={(checked) => {
                setIsSynced(checked);
                if (checked) {
                  toast.success('Collaborative editing enabled');
                } else {
                  toast.info('Collaborative editing disabled');
                }
              }}
              className="data-[state=checked]:bg-white/20 data-[state=unchecked]:bg-white/[0.04]"
            />
            {/* User profile controls */}
            <SignedIn>
              <div className="flex items-center gap-2 pl-2 border-l border-[#3e3e42]">
                <Link
                  to="/profile"
                  className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-white/[0.06] transition-colors"
                >
                  Profile
                </Link>
                <div className="ring-1 ring-white/10 rounded-full hover:ring-white/25 transition-all">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </div>
            </SignedIn>
          </div>
        </div>

        <div className="flex h-[calc(100vh-2.25rem)]">
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            {/* Left Panel – Problem */}
            <ResizablePanel defaultSize={35} minSize={25}>
              <ProblemPanel difficulty={difficulty} roomId={roomId} initialQuestion={locationQuestion} />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right Panel – Editor + Results */}
            <ResizablePanel defaultSize={65}>
              <div className="flex flex-col h-full">
              {/* Persistent video panel — visible when camera is on */}
              {isVideoOn && (
                <VideoPanel
                  localStream={localStream}
                  remoteStream={remoteStream}
                  isVideoOn={isVideoOn}
                  isAudioOn={isAudioOn}
                  isConnected={isWebRTCConnected}
                />
              )}
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
          </ResizablePanelGroup>

          {isChatOpen && (
            <ChatSidebar
              isChatOpen={isChatOpen}
              setIsChatOpen={setIsChatOpen}
              chatMessage={chatMessage}
              setChatMessage={setChatMessage}
              chatMessages={chatMessages}
              handleSendMessage={handleSendMessage}
              currentUserName={userName}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default CodingSession;
