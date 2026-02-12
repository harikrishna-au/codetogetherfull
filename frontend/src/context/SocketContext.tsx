import { getSocket } from '../lib/socket';
import React, { createContext, useContext, useEffect, useRef, useState, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { useSessionAuth } from './SessionAuthContext';

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({ socket: null, connected: false });

const useSocket = () => useContext(SocketContext);

const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const { sessionToken } = useSessionAuth();
  // Memoize user by UID to avoid new object reference on every render
  // const stableUser = useMemo(() => user, [user?.uid]); // Not needed with Clerk user object stability or just relying on context updates
  // Track last user/session to prevent unnecessary disconnects/reconnects
  const lastUserIdRef = useRef<string | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Only connect if user exists and session token is available
    const userId = user?.id || null;
    if (!user || !sessionToken) return; // Wait for token

    console.log('[SocketContext] Using Clerk token for Socket.IO');

    // Only create a new socket if user actually changed or socket is null
    if (lastUserIdRef.current !== userId || !socketRef.current) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      const socket = getSocket(sessionToken);
      socketRef.current = socket;
      lastUserIdRef.current = userId;

      socket.on('connect', () => {
        console.log('[SocketContext] Socket connected:', socket.id);
        setConnected(true);
      });
      socket.on('disconnect', () => {
        console.log('[SocketContext] Socket disconnected');
        setConnected(false);
      });
      socket.on('connect_error', (err) => {
        console.error('[SocketContext] Socket connect_error:', err);
      });
    }

    return () => {
      // Don't disconnect on unmount immediately if we want to keep connection alive during nav?
      // But usually we do want to cleanup.
      // For now, let's keep it simple and clean up.
      console.log('[SocketContext] Cleanup: disconnecting socket');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        lastUserIdRef.current = null;
      }
      setConnected(false);
    };
  }, [user, sessionToken]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export { SocketProvider, useSocket };
