// src/lib/socket.ts
import { io, Socket } from 'socket.io-client';

// Use http:// — Socket.IO handles the WS upgrade internally
const SOCKET_URL = `${window.location.protocol === 'https:' ? 'https' : 'http'}://${window.location.hostname}:4000`;

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
    transports: ['websocket'],
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });
  lastToken = token;

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.off();
    socket.disconnect();
    socket = null;
    lastToken = null;
  }
}
