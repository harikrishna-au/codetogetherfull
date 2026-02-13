import { useState, useEffect, useRef, useContext } from 'react';
import { Video, VideoOff, Mic, MicOff, MessageSquare, MessageCircle, LogOut } from 'lucide-react';
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
import { useChat } from '@/hooks/useChat';
import ActiveUserHeartbeat from '@/components/ActiveUserHeartbeat';
import { useYjsCollaboration } from '@/hooks/useYjsCollaboration';
import { useWebRTC } from '@/hooks/useWebRTC';

const CodingSession = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const params = useParams();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const { mode, difficulty } = location.state || { mode: 'friendly', difficulty: 'easy' };
  const roomId = params.roomId;
  const userName = user?.displayName || user?.email || 'You';

  // Validate room ID and user session
  useEffect(() => {
    if (!user || !roomId) {
      console.log('[CodingSession] Missing user or roomId, redirecting to home');
      // Set a flag to prevent immediate redirect back from matchmaking
      sessionStorage.setItem('fromSession', 'true');
      navigate('/', { replace: true });
      return;
    }

    // Simple validation - just check if roomId looks valid (UUID format)
    const isValidRoomId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomId);
    if (!isValidRoomId) {
      console.log('[CodingSession] Invalid roomId format, redirecting to home');
      sessionStorage.setItem('fromSession', 'true');
      navigate('/', { replace: true });
      return;
    }

    // Clear the flag if we successfully reached a valid session
    sessionStorage.removeItem('fromSession');
    console.log('[CodingSession] Valid user and roomId, proceeding with session');
  }, [user, roomId, navigate]);

  const [matchState, setMatchState] = useState<'waiting' | 'matched'>('matched');
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const [code, setCode] = useState(`function solution() {
  // Write your JavaScript code here

}`);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('javascript');
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executeResult, setExecuteResult] = useState<ExecuteResult | null>(null);

  // WebRTC video / audio
  const { localStream, remoteStream, isConnected: isWebRTCConnected } = useWebRTC({
    socket,
    roomId,
    userId: user?.id ?? '',
    isVideoOn,
    isAudioOn,
  });

  // Yjs real-time collaboration + awareness (cursors / typing indicator)
  const { bindToMonaco, resetContent, partnerUsers, partnerTyping } = useYjsCollaboration({
    socket,
    roomId,
    userId: user?.id ?? '',
    userName,
  });

  // Exit session handler
  const handleExitSession = async () => {
    if (!roomId || typeof roomId !== 'string' || roomId.trim().length === 0) {
      toast.error('Invalid room ID. Cannot end session.');
      return;
    }
    try {
      const res = await fetch(API_ENDPOINTS.END_ROOM, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ roomId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to end session');
      }
      toast.success('Session ended!');
      setTimeout(() => {
        window.location.href = '/';
      }, 1200);
    } catch (err: any) {
      toast.error(err.message || 'Failed to end session');
    }
  };

  useEffect(() => {
    if (!socket || !roomId || roomId === 'session-room') return;
    let joined = false;
    const tryJoinRoom = () => {
      if (socket.connected && roomId && !joined) {
        joined = true;
        console.log('[Socket] (frontend) Emitting join for roomId:', roomId, 'socketId:', socket.id);
        socket.emit('join', { roomId }, (ack: any) => {
          console.log('[Socket] (frontend) Join ack:', ack);
          socket.emit('fetchChatHistory', { roomId }, (res: any) => {
            if (res && res.success && Array.isArray(res.messages)) {
              // setChatMessages is now handled in useChat hook
            }
          });
          socket.emit('getRoomQuestion', { roomId }, (res: any) => {
            if (res?.success && res.question?.id) {
              setQuestionId(res.question.id);
            }
          });
        });
      }
    };
    // Join on connect
    socket.on('connect', tryJoinRoom);
    // Join if already connected
    tryJoinRoom();

    // Handle both roomClosed and room-exit events to ensure all users are redirected
    const handleRoomSessionEnd = (event: 'roomClosed' | 'room-exit', data: any) => {
      if (event === 'roomClosed') {
        console.log('[Socket] (frontend) Received roomClosed event for roomId:', data.roomId);
        toast.error('The other user has exited. Session closed.');
      } else {
        console.log('[Socket] (frontend) Received room-exit event for roomId:', data.roomId, 'leaver:', data.leaver, 'reason:', data.reason);
        if (data.reason === 'timer-expired') {
          toast.error('⏰ Time\'s up! Session has ended.');
        } else {
          toast.error('A user has left the session. You will be redirected.');
        }
      }
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    };
    socket.on('roomClosed', (data) => handleRoomSessionEnd('roomClosed', data));
    socket.on('room-exit', (data) => handleRoomSessionEnd('room-exit', data));

    // Partner submission notification
    const handlePartnerSubmission = (data: { userId: string; passed: number; total: number }) => {
      if (data.userId !== user?.id) {
        if (data.passed === data.total) {
          toast.success(`Partner passed all ${data.total} test cases!`);
        } else {
          toast(`Partner got ${data.passed}/${data.total} test cases`);
        }
      }
    };
    socket.on('submissionResult', handlePartnerSubmission);

    // Partner language change — update local selector and reset Yjs content
    const handlePartnerLanguageChange = (data: { language: SupportedLanguage; template: string }) => {
      setSelectedLanguage(data.language);
      resetContent(data.template);
    };
    socket.on('languageChange', handlePartnerLanguageChange);

    // Handle socket disconnect: exit session immediately
    const handleSocketDisconnect = () => {
      toast.error('Lost connection to server. Exiting session.');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    };
    socket.on('disconnect', handleSocketDisconnect);

    return () => {
      socket.off('roomClosed');
      socket.off('room-exit');
      socket.off('connect', tryJoinRoom);
      socket.off('disconnect', handleSocketDisconnect);
      socket.off('submissionResult', handlePartnerSubmission);
      socket.off('languageChange', handlePartnerLanguageChange);
    };
  }, [socket, roomId]);

  // Chat logic
  const { chatMessage, setChatMessage, chatMessages, handleSendMessage } = useChat({
    socket,
    roomId,
    userName,
  });

  // Called when local user picks a different language
  const handleLanguageChange = (lang: SupportedLanguage) => {
    setSelectedLanguage(lang);
    const template = languageTemplates[lang];
    // Reset Yjs doc — propagates to partner automatically
    resetContent(template);
    // Notify partner's language selector UI
    if (socket && roomId) {
      socket.emit('languageChange', { roomId, language: lang, template });
    }
  };

  const handleCodeExecution = async (mode: 'run' | 'submit') => {
    if (!questionId) {
      toast.error('Question not loaded yet. Please wait.');
      return;
    }
    const visibleOnly = mode === 'run';
    setIsSubmitting(true);
    setExecuteResult(null);
    try {
      const res = await fetch(API_ENDPOINTS.EXECUTE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code, language: selectedLanguage, questionId, visibleOnly, roomId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Execution failed');
        return;
      }
      const result: ExecuteResult = data.results;
      setExecuteResult(result);
      // Only notify partner on full submit
      if (mode === 'submit' && socket && roomId) {
        socket.emit('submissionResult', {
          roomId,
          userId: user?.id,
          passed: result.passed,
          total: result.totalTests,
        });
      }
      if (result.compilationError) {
        toast.error('Compilation error');
      } else if (result.passed === result.totalTests) {
        toast.success(`${mode === 'run' ? 'Run' : 'Submit'}: ${result.passed}/${result.totalTests} passed!`);
      } else {
        toast.error(`${result.passed}/${result.totalTests} test cases passed`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Execution failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {user && <ActiveUserHeartbeat userId={user.id} />}
      <div className="flex flex-col h-screen">

        <div className="flex h-[calc(100vh-3rem)]">
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            {/* Left Panel - Problem Description */}
            <ResizablePanel defaultSize={35} minSize={25}>
              <ProblemPanel difficulty={difficulty} roomId={roomId} />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right Panel - Code Editor and Results */}
            <ResizablePanel defaultSize={65}>
              <ResizablePanelGroup direction="vertical">
                {/* Code Editor */}

                <ResizablePanel defaultSize={70} minSize={50}>
                  <EditorPanel
                    code={code}
                    setCode={setCode}
                    isSubmitting={isRunning || isSubmitting}
                    onRun={() => handleCodeExecution('run')}
                    onSubmit={() => handleCodeExecution('submit')}
                    onLanguageChange={handleLanguageChange}
                    language={selectedLanguage}
                    onEditorMount={bindToMonaco}
                    partnerUsers={partnerUsers}
                    partnerTyping={partnerTyping}
                    isVideoOn={isVideoOn}
                    setIsVideoOn={setIsVideoOn}
                    isAudioOn={isAudioOn}
                    setIsAudioOn={setIsAudioOn}
                    isChatOpen={isChatOpen}
                    setIsChatOpen={setIsChatOpen}
                    handleExitSession={handleExitSession}
                    roomId={roomId || ''}
                    localStream={localStream}
                    remoteStream={remoteStream}
                    isWebRTCConnected={isWebRTCConnected}
                  />
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Results Panel */}
                <ResizablePanel defaultSize={30} minSize={20}>
                  <ResultsPanel isSubmitting={isRunning || isSubmitting} executeResult={executeResult} />
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>

          {/* Chat Sidebar */}
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