import React, { useEffect, useRef } from 'react';
import ReactTextareaAutosize from 'react-textarea-autosize';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, X } from 'lucide-react';

interface ChatMessage {
  id: number;
  user: string;
  message: string;
  timestamp: string;
}

interface ChatSidebarProps {
  isChatOpen: boolean;
  setIsChatOpen: (v: boolean) => void;
  chatMessage: string;
  setChatMessage: (v: string) => void;
  chatMessages: ChatMessage[];
  handleSendMessage: () => void;
  currentUserName?: string;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
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
  }, [chatMessages]);

  if (!isChatOpen) return null;

  return (
    <div className="w-72 bg-[#0d0d0d] border-l border-white/[0.06] flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="h-10 border-b border-white/[0.06] flex items-center justify-between px-3 flex-shrink-0">
        <span className="text-xs font-medium text-[#8a9099] tracking-wide">Chat</span>
        <button
          onClick={() => setIsChatOpen(false)}
          className="p-1 rounded text-[#4a5057] hover:text-[#8a9099] hover:bg-white/[0.04] transition-colors"
          aria-label="Close chat"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-1.5">
          {chatMessages.length === 0 && (
            <p className="text-[10px] text-[#3a3f45] text-center pt-4">No messages yet</p>
          )}
          {chatMessages.map((msg) => {
            const isMe = currentUserName && msg.user === currentUserName;
            return (
              <div key={msg.id} className={`flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-medium ${isMe ? 'text-[#4ec9b0]' : 'text-[#569cd6]'}`}>
                    {isMe ? 'You' : 'Partner'}
                  </span>
                  <span className="text-[9px] text-[#2e3338]">{msg.timestamp}</span>
                </div>
                <div className={`max-w-[90%] rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed break-words whitespace-pre-line ${
                  isMe
                    ? 'bg-white/[0.07] text-[#cfd3d6] rounded-tr-sm'
                    : 'bg-white/[0.04] text-[#a0a6ad] rounded-tl-sm'
                }`}>
                  {msg.message}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-2 border-t border-white/[0.06] flex-shrink-0">
        <div className="flex items-end gap-1.5">
          <ReactTextareaAutosize
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Message…"
            className="flex-1 min-h-[30px] max-h-28 resize-none bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] text-[#cfd3d6] placeholder:text-[#3a3f45] focus:outline-none focus:border-white/[0.16] focus:bg-white/[0.06] transition-all"
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
            className="p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-[#6b7075] hover:text-[#cfd3d6] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
