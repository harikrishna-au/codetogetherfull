import { getSocket, updateSocketToken } from '../lib/socket';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { useSessionAuth } from './SessionAuthContext';

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({ socket: null, connected: false });

const useSocket = () => useContext(SocketContext);

const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useContext(AuthContext);
  const { sessionToken, refreshToken } = useSessionAuth();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const userId = user?.id ?? null;

    // Need both user and token to connect
    if (!userId || !sessionToken) {
      // If we lost the user (sign-out), tear down the socket
      if (!userId && socketRef.current) {
        socketRef.current.off();
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    // If a socket already exists and is alive, just update its auth token
    // (handles token refresh — no reconnect needed)
    if (socketRef.current && (socketRef.current.connected || socketRef.current.active)) {
      updateSocketToken(sessionToken);
      return;
    }

    // Tear down any dead socket before creating a new one
    if (socketRef.current) {
      socketRef.current.off();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    console.log('[SocketContext] Creating socket for user', userId);
    const s = getSocket(sessionToken);
    socketRef.current = s;

    const onConnect = () => {
      console.log('[SocketContext] Connected:', s.id);
      setConnected(true);
    };
    const onDisconnect = (reason: string) => {
      console.log('[SocketContext] Disconnected:', reason);
      setConnected(false);
    };
    const onConnectError = (err: Error) => {
      console.error('[SocketContext] connect_error:', err.message);
      if (err.message === 'Authentication failed') {
        console.log('[SocketContext] Auth error — refreshing token');
        refreshToken();
      }
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', onConnectError);

    // Sync if already connected (singleton reuse)
    if (s.connected) setConnected(true);

    // NO cleanup return — we intentionally keep the socket alive across renders.
    // The socket is only torn down when user signs out (handled above).
  }, [user, sessionToken]); // Re-run when user or token changes

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export { SocketProvider, useSocket };
