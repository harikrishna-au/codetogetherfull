import React, { useEffect, useRef } from 'react';
import ReactTextareaAutosize from 'react-textarea-autosize';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, X, VideoOff, MicOff, MessageSquare } from 'lucide-react';

/**
 * Partner Rail — the single place where your partner "lives" during a session:
 * presence header, video (partner large, you as PiP), and chat, stacked in one
 * persistent column that sits side-by-side with the editor.
 */

interface ChatMessage {
  id: number;
  user: string;
  message: string;
  timestamp: string;
}

interface PartnerRailProps {
  // presence
  partnerName?: string;
  partnerTyping: boolean;
  /** Partner is in the room (sockets/chat/yjs) — drives the header status */
  partnerPresent: boolean;
  /** WebRTC call is connected — drives the video LIVE chip */
  isConnected: boolean;
  // video
  isVideoOn: boolean;
  isAudioOn: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  // chat
  isChatOpen: boolean;
  setIsChatOpen: (v: boolean) => void;
  chatMessage: string;
  setChatMessage: (v: string) => void;
  chatMessages: ChatMessage[];
  handleSendMessage: () => void;
  currentUserName?: string;
}

const VideoSurface: React.FC<{
  stream: MediaStream | null;
  muted?: boolean;
  className?: string;
}> = ({ stream, muted = false, className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);
  return (
    <video ref={videoRef} autoPlay playsInline muted={muted} className={className} />
  );
};

const TypingDots = () => (
  <span className="inline-flex items-center gap-0.5 ml-1">
    {[0, 1, 2].map(i => (
      <span
        key={i}
        className="w-1 h-1 rounded-full bg-[#4ec9b0] animate-bounce"
        style={{ animationDelay: `${i * 150}ms`, animationDuration: '900ms' }}
      />
    ))}
  </span>
);

const PartnerRail: React.FC<PartnerRailProps> = ({
  partnerName,
  partnerTyping,
  partnerPresent,
  isConnected,
  isVideoOn,
  isAudioOn,
  localStream,
  remoteStream,
  isChatOpen,
  setIsChatOpen,
  chatMessage,
  setChatMessage,
  chatMessages,
  handleSendMessage,
  currentUserName,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, partnerTyping]);

  const displayName = partnerName || 'Partner';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="h-full bg-[#0a0a0a] border-l border-white/[0.06] flex flex-col">

      {/* ── Presence header ── */}
      <div className="flex items-center gap-2.5 px-3 h-11 border-b border-white/[0.06] shrink-0">
        <div className="relative">
          <div className="w-6 h-6 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-[10px] font-semibold text-[#cfd3d6]">
            {initial}
          </div>
          {/* live status dot */}
          <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-[#0a0a0a]
            ${partnerPresent ? 'bg-[#4ec9b0]' : 'bg-[#4a5057]'}`} />
        </div>
        <div className="flex-1 min-w-0 leading-tight">
          <p className="text-xs font-medium text-[#e2e5e8] truncate">{displayName}</p>
          <p className="text-[9px] text-[#5a6068] truncate">
            {partnerTyping
              ? <>typing<TypingDots /></>
              : partnerPresent ? 'pairing with you' : 'connecting…'}
          </p>
        </div>
        {isChatOpen && (
          <button
            onClick={() => setIsChatOpen(false)}
            className="p-1 rounded text-[#4a5057] hover:text-[#8a9099] hover:bg-white/[0.04] transition-colors"
            aria-label="Close chat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Video stack: partner large, you as PiP ── */}
      {isVideoOn && (
        <div className="relative shrink-0 m-2 rounded-xl overflow-hidden bg-black border border-white/[0.08] aspect-video group">
          {remoteStream && isConnected ? (
            <VideoSurface stream={remoteStream} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
              {/* pulse rings while waiting */}
              <div className="relative flex items-center justify-center">
                <span className="absolute w-14 h-14 rounded-full border border-white/[0.07] animate-ping" />
                <div className="w-11 h-11 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-base font-semibold text-[#8a9099]">
                  {initial}
                </div>
              </div>
              <span className="text-[10px] text-[#5a6068]">
                {isConnected ? `${displayName}'s camera is off` : 'Waiting for partner…'}
              </span>
            </div>
          )}

          {/* your PiP feed */}
          <div className="absolute bottom-2 right-2 w-[30%] aspect-video rounded-lg overflow-hidden border border-white/[0.18] shadow-[0_4px_16px_rgba(0,0,0,0.6)] bg-[#111]">
            {localStream ? (
              <VideoSurface stream={localStream} muted className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <VideoOff className="w-3.5 h-3.5 text-[#4a5057]" />
              </div>
            )}
            <span className="absolute bottom-0.5 left-1 text-[8px] font-medium text-white/80">You</span>
          </div>

          {/* status chips */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <span className={`flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full backdrop-blur
              ${isConnected
                ? 'bg-[#4ec9b0]/15 text-[#4ec9b0] border border-[#4ec9b0]/25'
                : 'bg-black/60 text-[#8a9099] border border-white/[0.1]'}`}>
              <span className={`w-1 h-1 rounded-full ${isConnected ? 'bg-[#4ec9b0]' : 'bg-[#8a9099] animate-pulse'}`} />
              {isConnected ? 'LIVE' : 'CONNECTING'}
            </span>
            {!isAudioOn && (
              <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-black/60 text-[#8a9099] border border-white/[0.1] backdrop-blur">
                <MicOff className="w-2.5 h-2.5" /> muted
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Chat ── */}
      {isChatOpen ? (
        <>
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-2.5 space-y-2">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center gap-1.5 pt-8 text-center">
                  <MessageSquare className="w-4 h-4 text-[#2e3338]" />
                  <p className="text-[10px] text-[#3a3f45] leading-relaxed">
                    Talk through your approach —<br />pairing works better out loud.
                  </p>
                </div>
              )}
              {chatMessages.map((msg) => {
                const isMe = currentUserName && msg.user === currentUserName;
                return (
                  <div key={msg.id} className={`flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 px-0.5">
                      <span className={`text-[9px] font-medium ${isMe ? 'text-[#4ec9b0]' : 'text-[#569cd6]'}`}>
                        {isMe ? 'You' : displayName}
                      </span>
                      <span className="text-[9px] text-[#2e3338]">{msg.timestamp}</span>
                    </div>
                    <div className={`max-w-[88%] rounded-xl px-3 py-1.5 text-xs leading-relaxed break-words whitespace-pre-line ${
                      isMe
                        ? 'bg-[#4ec9b0]/[0.10] text-[#d6dadd] border border-[#4ec9b0]/[0.14] rounded-tr-sm'
                        : 'bg-white/[0.05] text-[#b7bdc3] border border-white/[0.06] rounded-tl-sm'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                );
              })}
              {partnerTyping && (
                <div className="flex items-center gap-1.5 px-0.5">
                  <span className="text-[9px] font-medium text-[#569cd6]">{displayName}</span>
                  <span className="rounded-xl rounded-tl-sm bg-white/[0.05] border border-white/[0.06] px-3 py-2">
                    <TypingDots />
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-2 border-t border-white/[0.06] shrink-0">
            <div className="flex items-end gap-1.5">
              <ReactTextareaAutosize
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder={`Message ${displayName}…`}
                className="flex-1 min-h-[32px] max-h-28 resize-none bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-[#cfd3d6] placeholder:text-[#3a3f45] focus:outline-none focus:border-[#4ec9b0]/30 focus:bg-white/[0.06] transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatMessage.trim()}
                className="p-2 rounded-lg bg-[#4ec9b0]/[0.12] hover:bg-[#4ec9b0]/[0.2] text-[#4ec9b0] disabled:opacity-25 disabled:cursor-not-allowed transition-all shrink-0"
                aria-label="Send message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      ) : (
        /* chat closed but video keeps the rail alive — quick reopen */
        <button
          onClick={() => setIsChatOpen(true)}
          className="mx-2 mb-2 mt-auto flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] text-[10px] text-[#6b7075] hover:text-[#cfd3d6] transition-all"
        >
          <MessageSquare className="w-3 h-3" /> Open chat
        </button>
      )}
    </div>
  );
};

export default PartnerRail;
