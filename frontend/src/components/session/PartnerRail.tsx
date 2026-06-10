import React, { useEffect, useRef } from 'react';
import ReactTextareaAutosize from 'react-textarea-autosize';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, X, MessageSquare } from 'lucide-react';

/**
 * Partner Rail — presence header + chat in one column that sits genuinely
 * side-by-side with the editor. Video lives in FloatingVideo (face bubbles).
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
  // chat
  setIsChatOpen: (v: boolean) => void;
  chatMessage: string;
  setChatMessage: (v: string) => void;
  chatMessages: ChatMessage[];
  handleSendMessage: () => void;
  currentUserName?: string;
}

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
        <button
          onClick={() => setIsChatOpen(false)}
          className="p-1 rounded text-[#4a5057] hover:text-[#8a9099] hover:bg-white/[0.04] transition-colors"
          aria-label="Close chat"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Chat ── */}
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
    </div>
  );
};

export default PartnerRail;
