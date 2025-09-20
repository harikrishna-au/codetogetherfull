// src/lib/socket.ts
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:4000`;


let socket: Socket | null = null;
let lastToken: string | null = null;



// Use a singleton pattern, but only disconnect/reconnect if the token changes
export function getSocket(token: string): Socket {
  if (socket && lastToken === token) {
    return socket;
  }
  if (socket) {
    socket.disconnect();
    socket = null;
    lastToken = null;
  }
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    withCredentials: true,
    autoConnect: true,
  });
  lastToken = token;

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
