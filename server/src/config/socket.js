// =====================================================
// Socket.io — real-time chat engine (M3 builds on this)
// Rooms: conv:<conversation_id>
// =====================================================
import { Server } from 'socket.io';

let io = null;

export function setupSocketIo(httpServer) {
  const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  io = new Server(httpServer, {
    cors: { origin: clientOrigin, methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join a conversation room so the user receives its messages live.
    socket.on('conversation:join', (conversationId) => {
      if (conversationId) socket.join(`conv:${conversationId}`);
    });

    // Leave a conversation room.
    socket.on('conversation:leave', (conversationId) => {
      if (conversationId) socket.leave(`conv:${conversationId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

/** Returns the shared Socket.io instance (for controllers to emit). */
export function getIo() {
  return io;
}

/** Emit a `message:new` event to everyone in a conversation room. */
export function emitNewMessage(conversationId, message) {
  if (io) io.to(`conv:${conversationId}`).emit('message:new', message);
}