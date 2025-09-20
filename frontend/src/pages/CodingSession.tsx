import { useState, useEffect, useRef, useContext } from 'react';
import { Video, VideoOff, Mic, MicOff, MessageSquare, MessageCircle, LogOut } from 'lucide-react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API_ENDPOINTS } from '@/lib/api';
import { toast } from 'sonner';
import { useSocket } from '../context/SocketContext';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import ProblemPanel from '@/components/session/ProblemPanel';
import EditorPanel from '@/components/session/EditorPanel';
import ResultsPanel from '@/components/session/ResultsPanel';
import ChatSidebar from '@/components/session/ChatSidebar';
import { useChat } from '@/hooks/useChat';
import ActiveUserHeartbeat from '@/components/ActiveUserHeartbeat';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          // After joining, fetch chat history and handle ack
          socket.emit('fetchChatHistory', { roomId }, (res: any) => {
            if (res && res.success && Array.isArray(res.messages)) {
              // setChatMessages is now handled in useChat hook
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
    };
  }, [socket, roomId]);

  // Chat logic
  const { chatMessage, setChatMessage, chatMessages, handleSendMessage } = useChat({
    socket,
    roomId,
    userName,
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      // Handle submission result
    }, 2000);
  };

  return (
    <>
      {user && <ActiveUserHeartbeat userId={user.uid} />}
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
                  isSubmitting={isSubmitting}
                  handleSubmit={handleSubmit}
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

              {/* Results Panel */}
              <ResizablePanel defaultSize={30} minSize={20}>
                <ResultsPanel />
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