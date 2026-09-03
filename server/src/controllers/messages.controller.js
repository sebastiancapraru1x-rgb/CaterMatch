// =====================================================
// Messages — history + send (M3)
// Sending also emits a live `message:new` over Socket.io.
// =====================================================
import { query } from '../config/db.js';
import { emitNewMessage } from '../config/socket.js';

/** GET /api/messages/:conversationId — history (marks theirs as read). */
export async function listMessages(req, res, next) {
  try {
    const conv = await query(
      `SELECT id FROM conversations
       WHERE id = $1 AND (participant_one = $2 OR participant_two = $2)`,
      [req.params.conversationId, req.user.id]
    );
    if (!conv.length) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const rows = await query(
      `SELECT id, conversation_id, sender_id, message_text, is_read, created_at
       FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [req.params.conversationId]
    );

    // Mark the other party's messages as read (fire-and-forget).
    await query(
      `UPDATE messages SET is_read = TRUE
       WHERE conversation_id = $1 AND sender_id <> $2 AND is_read = FALSE`,
      [req.params.conversationId, req.user.id]
    ).catch(() => {});

    return res.json({ messages: rows });
  } catch (err) {
    return next(err);
  }
}

/** POST /api/messages/:conversationId  body: { message_text } */
export async function sendMessage(req, res, next) {
  try {
    const { message_text } = req.body;
    if (!message_text || !String(message_text).trim()) {
      return res.status(400).json({ error: 'message_text is required' });
    }

    const conv = await query(
      `SELECT id FROM conversations
       WHERE id = $1 AND (participant_one = $2 OR participant_two = $2)`,
      [req.params.conversationId, req.user.id]
    );
    if (!conv.length) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const rows = await query(
      `INSERT INTO messages (conversation_id, sender_id, message_text)
       VALUES ($1, $2, $3)
       RETURNING id, conversation_id, sender_id, message_text, is_read, created_at`,
      [req.params.conversationId, req.user.id, String(message_text).trim()]
    );

    // Bump the inbox ordering timestamp.
    await query(
      `UPDATE conversations SET last_message_at = NOW()
       WHERE id = $1`,
      [req.params.conversationId]
    );

    const message = rows[0];

    // Real-time push to everyone in the room.
    emitNewMessage(message.conversation_id, {
      ...message,
      sender_name: req.user.full_name,
    });

    return res.status(201).json({ message });
  } catch (err) {
    return next(err);
  }
}