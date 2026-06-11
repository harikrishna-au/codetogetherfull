import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useSessionAuth } from '@/context/SessionAuthContext';

export interface QueueStatus {
  position: number;
  waitSeconds: number;
  queueSize: number;
  ratingWindow: number;
}

interface MatchmakingContextType {
  mode: string;
  difficulty: string;
  phase: 'matching' | 'countdown';
  countdown: number;
  matchFound: boolean;
  matchedRoomId: string | null;
  matchedQuestion: any | null;
  queueStatus: QueueStatus | null;
  setMode: (m: string) => void;
  setDifficulty: (d: string) => void;
  joinQueue: (mode: string, difficulty: string) => void;
  leaveQueue: () => void;
}

const MatchmakingContext = createContext<MatchmakingContextType | undefined>(undefined);

export const MatchmakingProvider = ({ children }: { children: ReactNode }) => {
  const { socket, connected } = useSocket();
  const { user } = useSessionAuth();
  const [mode, setMode] = useState(window.sessionStorage.getItem('queueMode') || 'friendly');
  const [difficulty, setDifficulty] = useState(window.sessionStorage.getItem('queueDifficulty') || 'easy');
  const [phase, setPhase] = useState<'matching' | 'countdown'>('matching');
  const [countdown, setCountdown] = useState(3);
  const [matchFound, setMatchFound] = useState(false);
  const [matchedRoomId, setMatchedRoomId] = useState<string | null>(null);
  const [matchedQuestion, setMatchedQuestion] = useState<any | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const joinQueue = (queueMode: string, queueDifficulty: string) => {
    if (!socket || !connected) {
      console.warn('[MatchmakingContext] joinQueue called but socket not connected');
      return;
    }
    setMode(queueMode);
    setDifficulty(queueDifficulty);
    setPhase('matching');
    setMatchFound(false);
    setQueueStatus(null);
    window.sessionStorage.setItem('inQueue', '1');
    window.sessionStorage.setItem('queueMode', queueMode);
    window.sessionStorage.setItem('queueDifficulty', queueDifficulty);
    socket.emit('joinQueue', { type: queueMode, difficulty: queueDifficulty });
  };

  const leaveQueue = () => {
    setPhase('matching');
    setMatchFound(false);
    setMatchedRoomId(null);
    setMatchedQuestion(null);
    setQueueStatus(null);
    window.sessionStorage.removeItem('inQueue');
    window.sessionStorage.removeItem('queueMode');
    window.sessionStorage.removeItem('queueDifficulty');
    if (socket && connected) socket.emit('leaveQueue');
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  useEffect(() => {
    if (!socket) return;

    const onMatchFound = (data: any) => {
      setMatchFound(true);
      setQueueStatus(null);
      if (data?.roomId) setMatchedRoomId(data.roomId);
      if (data?.question) setMatchedQuestion(data.question);
      window.sessionStorage.removeItem('inQueue');
      window.sessionStorage.removeItem('queueMode');
      window.sessionStorage.removeItem('queueDifficulty');
      setTimeout(() => setPhase('countdown'), 500);
    };

    const onQueueStatus = (data: QueueStatus) => {
      setQueueStatus(data);
    };

    socket.on('matchFound', onMatchFound);
    socket.on('queueStatus', onQueueStatus);
    return () => {
      socket.off('matchFound', onMatchFound);
      socket.off('queueStatus', onQueueStatus);
    };
  }, [socket]);

  useEffect(() => {
    if (phase === 'countdown') {
      setCountdown(3);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (countdownRef.current) clearInterval(countdownRef.current);
      };
    }
  }, [phase]);

  return (
    <MatchmakingContext.Provider value={{
      mode, difficulty, phase, countdown, matchFound, matchedRoomId, matchedQuestion,
      queueStatus, setMode, setDifficulty, joinQueue, leaveQueue,
    }}>
      {children}
    </MatchmakingContext.Provider>
  );
};

export function useMatchmaking() {
  const ctx = useContext(MatchmakingContext);
  if (!ctx) throw new Error('useMatchmaking must be used within a MatchmakingProvider');
  return ctx;
}
