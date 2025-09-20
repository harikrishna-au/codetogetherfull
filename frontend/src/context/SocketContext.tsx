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
  const stableUser = useMemo(() => user, [user?.uid]);
  // Track last user/session to prevent unnecessary disconnects/reconnects
  const lastUserIdRef = useRef<string | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Only connect if user exists and session token is available
    const userId = stableUser?.uid || null;
    if (!stableUser || !sessionToken || lastUserIdRef.current === userId) return;
    
    // Get JWT token from session login instead of Firebase token
    const getJWTToken = async () => {
      try {
        const idToken = await stableUser.getIdToken(true);
        const res = await fetch('http://localhost:4000/api/session/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
          credentials: 'include',
        });
        
        if (res.ok) {
          const data = await res.json();
          return data.token; // JWT token from backend
        }
        throw new Error('Failed to get JWT token');
      } catch (error) {
        console.error('[SocketContext] Failed to get JWT token:', error);
        return null;
      }
    };

    let isMounted = true;
    getJWTToken().then((jwtToken: string | null) => {
      if (!isMounted || !jwtToken) return;
      
      console.log('[SocketContext] Using JWT token for Socket.IO');
      
      // Only create a new socket if user actually changed
      if (lastUserIdRef.current !== userId) {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        const socket = getSocket(jwtToken);
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
    });
    
    return () => {
      isMounted = false;
      console.log('[SocketContext] Cleanup: disconnecting socket');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        lastUserIdRef.current = null;
      }
      setConnected(false);
    };
  }, [stableUser, sessionToken]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export { SocketProvider, useSocket };
