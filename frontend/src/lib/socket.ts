// src/lib/socket.ts
import { io, Socket } from 'socket.io-client';

// Use http:// — Socket.IO handles the WS upgrade internally
// Use relative URL in production (Nginx proxy), or localhost:4000 in dev
const SOCKET_URL = import.meta.env.PROD ? '/' : 'http://localhost:4000';

let socket: Socket | null = null;
let lastToken: string | null = null;

/**
 * Returns a connected Socket.IO socket.
 * Creates a new socket if:
 *  - no socket exists
 *  - token has changed
 *  - existing socket is disconnected and not reconnecting
 */
export function getSocket(token: string): Socket {
  const socketIsAlive = socket && (socket.connected || socket.active);

  if (socketIsAlive && lastToken === token) {
    return socket!;
  }

  // Tear down old socket if token changed or it is dead
  if (socket) {
    socket.off(); // remove all listeners to prevent leaks
    socket.disconnect();
    socket = null;
    lastToken = null;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });
  lastToken = token;

  // Keep the auth token current across reconnect attempts.
  // socket.io uses socket.auth at reconnect time, so we expose a way to update it.
  socket.on('reconnect_attempt', () => {
    if (lastToken) {
      (socket as any).auth = { token: lastToken };
    }
  });

  return socket;
}

/** Call this whenever a fresh Clerk token is obtained — keeps reconnect auth current. */
export function updateSocketToken(token: string) {
  lastToken = token;
  if (socket) {
    (socket as any).auth = { token };
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.off();
    socket.disconnect();
    socket = null;
    lastToken = null;
  }
}
