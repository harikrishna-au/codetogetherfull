import { useEffect, useState } from 'react';

export interface ChatMessage {
  id: number;
  user: string;
  message: string;
  timestamp: string;
}

interface UseChatProps {
  socket: any;
  roomId: string;
  userName: string;
}


export function useChat({ socket, roomId, userName }: UseChatProps) {
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [joined, setJoined] = useState(false);

  // Join room and fetch chat history
  useEffect(() => {
    if (!socket || !roomId || roomId === 'session-room') return;
    let didJoin = false;
    const tryJoinRoom = () => {
      if (socket.connected && roomId && !didJoin) {
        didJoin = true;
        socket.emit('join', { roomId }, (ack: any) => {
          socket.emit('fetchChatHistory', { roomId }, (res: any) => {
            if (res && res.success && Array.isArray(res.messages)) {
              setChatMessages(
                res.messages.map((msg: any, idx: number) => ({
                  id: idx + 1,
                  user: msg.userId || msg.sender,
                  message: msg.text || msg.message,
                  timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }))
              );
            }
            setJoined(true);
          });
        });
      }
    };
    socket.on('connect', tryJoinRoom);
    tryJoinRoom();
    return () => {
      socket.off('connect', tryJoinRoom);
    };
  }, [socket, roomId]);

  // Listen for new chat messages
  useEffect(() => {
    if (!socket) return;
    const onChatMessage = (data: { message: string; sender: string; timestamp: number }) => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          user: data.sender,
          message: data.message,
          timestamp: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    };
    socket.on('chatMessage', onChatMessage);
    return () => {
      socket.off('chatMessage', onChatMessage);
    };
  }, [socket]);

  // Send a chat message
  const handleSendMessage = () => {
    if (!socket || !roomId || !chatMessage.trim() || !joined) return;
    socket.emit('chatMessage', { roomId, message: chatMessage, sender: userName });
    setChatMessage('');
  };

  return {
    chatMessage,
    setChatMessage,
    chatMessages,
    handleSendMessage,
    joined,
  };
}
