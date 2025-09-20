import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { fetchUserState, UserStateData } from '@/lib/userState';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { useSessionAuth } from '@/context/SessionAuthContext';

interface MatchmakingContextType {
  mode: string;
  difficulty: string;
  phase: 'matching' | 'countdown';
  countdown: number;
  matchFound: boolean;
  joinQueue: () => void;
  leaveQueue: () => void;
}

const MatchmakingContext = createContext<MatchmakingContextType | undefined>(undefined);

export const MatchmakingProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useSessionAuth();
  // Restore mode/difficulty from sessionStorage if present
  const initialMode = window.sessionStorage.getItem('queueMode') || 'friendly';
  const initialDifficulty = window.sessionStorage.getItem('queueDifficulty') || 'easy';
  const [mode, setMode] = useState(initialMode);
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [userState, setUserState] = useState<UserStateData | null>(null);
  const [phase, setPhase] = useState<'matching' | 'countdown'>('matching');
  const [countdown, setCountdown] = useState(3);
  const [matchFound, setMatchFound] = useState(false);
  const socketRef = useRef<any>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Join queue
  const joinQueue = () => {
    setPhase('matching');
    setMatchFound(false);
    window.sessionStorage.setItem('inQueue', '1');
    if (user) {
      user.getIdToken().then(token => {
        const socket = getSocket(token);
        socketRef.current = socket;
        // Use mode as the queue type: 'friendly' or 'challenge'
        socket.emit('joinQueue', { type: mode });
      });
    }
  };

  // Leave queue
  const leaveQueue = () => {
    setPhase('matching');
    setMatchFound(false);
    window.sessionStorage.removeItem('inQueue');
    if (socketRef.current) {
      socketRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  // Effect: handle socket events and rejoin logic
  useEffect(() => {
    if (!user) return;
    let cleanupFns: (() => void)[] = [];
    // On mount, fetch user state from backend API
    fetchUserState(user.uid).then(state => {
      setUserState(state);
      if (state?.state === 'waiting' && state.mode && state.difficulty) {
        setMode(state.mode);
        setDifficulty(state.difficulty);
        setMatchFound(false);
        setPhase('matching');
        window.sessionStorage.setItem('inQueue', '1');
        window.sessionStorage.setItem('queueMode', state.mode);
        window.sessionStorage.setItem('queueDifficulty', state.difficulty);
      } else if (state?.state === 'matched' && state.mode && state.difficulty) {
        setMode(state.mode);
        setDifficulty(state.difficulty);
        setMatchFound(true);
        setPhase('countdown');
        window.sessionStorage.removeItem('inQueue');
      } else {
        // Not in queue, fallback to sessionStorage or default
        setMatchFound(false);
        setPhase('matching');
      }
    });
    user.getIdToken().then(token => {
      const socket = getSocket(token);
      socketRef.current = socket;

      // Listen for match found
      const onMatchFound = () => {
        setMatchFound(true);
        setTimeout(() => setPhase('countdown'), 1000);
        window.sessionStorage.removeItem('inQueue');
      };
      socket.on('matchFound', onMatchFound);
      cleanupFns.push(() => socket.off('matchFound', onMatchFound));

      // Listen for queue rejoin result
      const onQueueRejoined = (data: { waiting: boolean, mode?: string, difficulty?: string }) => {
        if (data.waiting) {
          if (data.mode) setMode(data.mode);
          if (data.difficulty) setDifficulty(data.difficulty);
          setMatchFound(false);
          setPhase('matching');
          window.sessionStorage.setItem('inQueue', '1');
        } else {
          // Not in queue, emit joinQueue
          socket.emit('joinQueue', {});
          window.sessionStorage.setItem('inQueue', '1');
        }
      };
      socket.on('queueRejoined', onQueueRejoined);
      cleanupFns.push(() => socket.off('queueRejoined', onQueueRejoined));

      // On mount, try to rejoin if returning
      if (window.sessionStorage.getItem('inQueue') === '1') {
        // Use mode/difficulty from sessionStorage if present
        const rejoinMode = window.sessionStorage.getItem('queueMode') || mode;
        const rejoinDifficulty = window.sessionStorage.getItem('queueDifficulty') || difficulty;
        setMode(rejoinMode);
        setDifficulty(rejoinDifficulty);
  socket.emit('rejoinQueue');
      } else {
  socket.emit('joinQueue', {});
        window.sessionStorage.setItem('inQueue', '1');
        window.sessionStorage.setItem('queueMode', mode);
        window.sessionStorage.setItem('queueDifficulty', difficulty);
      }
    });
    return () => {
      cleanupFns.forEach(fn => fn());
      if (socketRef.current) {
        socketRef.current = null;
      }
      window.sessionStorage.removeItem('inQueue');
      window.sessionStorage.removeItem('queueMode');
      window.sessionStorage.removeItem('queueDifficulty');
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Effect: handle countdown
  useEffect(() => {
    if (phase === 'countdown') {
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            setPhase('matching');
            return 3;
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
    <MatchmakingContext.Provider value={{ mode, difficulty, phase, countdown, matchFound, joinQueue, leaveQueue }}>
      {children}
    </MatchmakingContext.Provider>
  );
};

export function useMatchmaking() {
  const ctx = useContext(MatchmakingContext);
  if (!ctx) throw new Error('useMatchmaking must be used within a MatchmakingProvider');
  return ctx;
}
