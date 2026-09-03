// =====================================================
// Socket.io — real-time chat engine (M3)
// Auth: JWT passed in handshake (auth.token).
// Rooms: conv:<conversation_id> — membership verified.
// =====================================================
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { query } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';

let io = null;

export function setupSocketIo(httpServer) {
  const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  io = new Server(httpServer, {
    cors: { origin: clientOrigin, methods: ['GET', 'POST'] },
  });

  // Middleware: attach req.user from the handshake JWT.
  io.use((socket, next) => {
    const token = socket.handshake?.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      socket.data.user = { id: payload.id, email: payload.email };
      return next();
    } catch {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id} (${socket.data.user.email})`);

    // Join a conversation room — only if the user is a participant.
    socket.on('conversation:join', async (conversationId) => {
      if (!conversationId) return;
      try {
        const rows = await query(
          `SELECT id FROM conversations
           WHERE id = $1 AND (participant_one = $2 OR participant_two = $2)`,
          [conversationId, socket.data.user.id]
        );
        if (rows.length) {
          await socket.join(`conv:${conversationId}`);
        }
      } catch (err) {
        console.warn('⚠️ join failed:', err.message);
      }
    });

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

/** Emit `message:new` to everyone in a conversation room. */
export function emitNewMessage(conversationId, message) {
  if (io) io.to(`conv:${conversationId}`).emit('message:new', message);
}

/** Emit a "typing" indicator (nice-to-have hook). */
export function emitTyping(conversationId, userId) {
  if (io) io.to(`conv:${conversationId}`).emit('typing', { userId });
}