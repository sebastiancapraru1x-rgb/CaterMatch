import { io } from 'socket.io-client';

let socket;

/** Lazily creates one Socket.io connection (proxied through Vite). */
export function getSocket() {
  if (!socket) {
    socket = io('/', { transports: ['websocket', 'polling'] });
    socket.on('connect', () => console.log('🔌 socket connected:', socket.id));
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}