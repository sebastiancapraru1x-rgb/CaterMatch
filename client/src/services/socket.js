import { io } from 'socket.io-client';

let socket;

/** Lazily creates one Socket.io connection (proxied through Vite). */
export function getSocket() {
  if (!socket) {
    const token = localStorage.getItem('cm_token');
    socket = io('/', {
      transports: ['websocket', 'polling'],
      auth: { token: token || null },
    });
    socket.on('connect', () => console.log('🔌 socket connected:', socket.id));
    socket.on('connect_error', (err) => console.warn('⚠️ socket connect_error:', err.message));
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}