import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
// ...existing code...
import ReactTextareaAutosize from 'react-textarea-autosize';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  currentUserName?: string; // pass current user name/email from CodingSession
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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  if (!isChatOpen) return null;
  return (
    <div className="w-80 bg-[#252526] border-l border-[#3e3e42] flex flex-col">
      <div className="h-12 bg-[#2d2d30] border-b border-[#3e3e42] flex items-center justify-between px-4">
        <span className="text-sm font-medium text-[#cccccc]">Chat</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsChatOpen(false)}
          className="h-6 w-6 p-0 hover:bg-gray-700"
        >
          ×
        </Button>
      </div>
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {chatMessages.map((msg) => {
            const isMe = currentUserName && (msg.user === currentUserName);
            return (
              <div
                key={msg.id}
                className="mb-1"
              >
                <div className="w-full rounded-lg px-2 py-1 bg-[#1e1e1e] shadow text-xs flex flex-col items-start">
                  <div className="w-full flex items-center justify-between mb-0.5">
                    <span className={isMe ? 'text-[#4ec9b0] text-[10px] font-semibold' : 'text-[#569cd6] text-[10px] font-medium'}>
                      {isMe ? 'You' : 'Partner'}
                    </span>
                    <span className="text-[9px] text-[#888888] ml-2">{msg.timestamp}</span>
                  </div>
                  <span className="w-full break-words whitespace-pre-line text-[#cccccc] text-xs">{msg.message}</span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="p-2 border-t border-[#3e3e42]">
        <div className="flex space-x-2">
          <ReactTextareaAutosize
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 min-h-[28px] max-h-32 resize-none bg-[#1e1e1e] border border-[#3e3e42] rounded px-2 py-1 text-white text-xs focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button onClick={handleSendMessage} size="sm" className="bg-[#0e639c] hover:bg-[#1177bb] px-2">
            <Send className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
