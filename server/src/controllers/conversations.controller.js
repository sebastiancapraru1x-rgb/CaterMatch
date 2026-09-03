// =====================================================
// Conversations — start, inbox, detail (M3)
// A conversation links the listing owner + the interested
// user. One per (listing, participant pair).
// =====================================================
import { query } from '../config/db.js';

const CONVERSATION_FIELDS = `
  c.id, c.listing_id, c.participant_one, c.participant_two,
  c.last_message_at, c.created_at,
  l.title AS listing_title, l.listing_type,
  COALESCE(u_one.full_name, 'User') AS participant_one_name,
  COALESCE(u_two.full_name, 'User') AS participant_two_name`;

/** POST /api/conversations  body: { listing_id } */
export async function startConversation(req, res, next) {
  try {
    const { listing_id } = req.body;
    if (!listing_id) {
      return res.status(400).json({ error: 'listing_id is required' });
    }

    // The listing's owner is participant_one.
    const listingRows = await query(
      `SELECT id, user_id, title, listing_type
       FROM listings
       WHERE id = $1 AND status = 'active'`,
      [listing_id]
    );
    const listing = listingRows[0];
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    if (listing.user_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot start a conversation with yourself' });
    }

    const ownerId = listing.user_id;
    const userId = req.user.id;

    // Reuse an existing conversation (either orientation).
    const existing = await query(
      `SELECT ${CONVERSATION_FIELDS}
       FROM conversations c
       JOIN listings l ON l.id = c.listing_id
       JOIN users u_one ON u_one.id = c.participant_one
       JOIN users u_two ON u_two.id = c.participant_two
       WHERE c.listing_id = $1
         AND ((c.participant_one = $2 AND c.participant_two = $3)
              OR (c.participant_one = $3 AND c.participant_two = $2))
       LIMIT 1`,
      [listing_id, ownerId, userId]
    );
    if (existing.length) {
      return res.json({ conversation: existing[0] });
    }

    const created = await query(
      `INSERT INTO conversations (listing_id, participant_one, participant_two)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [listing_id, ownerId, userId]
    );

    const rows = await query(
      `SELECT ${CONVERSATION_FIELDS}
       FROM conversations c
       JOIN listings l ON l.id = c.listing_id
       JOIN users u_one ON u_one.id = c.participant_one
       JOIN users u_two ON u_two.id = c.participant_two
       WHERE c.id = $1`,
      [created[0].id]
    );

    return res.status(201).json({ conversation: rows[0] });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/conversations — my inbox, with last-message preview. */
export async function listConversations(req, res, next) {
  try {
    const rows = await query(
      `SELECT
         c.id, c.listing_id, c.last_message_at, c.created_at,
         l.title AS listing_title,
         CASE WHEN c.participant_one = $1 THEN u_two.full_name
              ELSE u_one.full_name END AS other_party_name,
         last_msg.message_text AS last_message,
         last_msg.created_at AS last_message_at_exact,
         (SELECT COUNT(*) FROM messages m
           WHERE m.conversation_id = c.id
             AND m.sender_id <> $1
             AND m.is_read = FALSE) AS unread_count
       FROM conversations c
       JOIN listings l ON l.id = c.listing_id
       JOIN users u_one ON u_one.id = c.participant_one
       JOIN users u_two ON u_two.id = c.participant_two
       LEFT JOIN LATERAL (
         SELECT message_text, created_at FROM messages
         WHERE conversation_id = c.id
         ORDER BY created_at DESC LIMIT 1
       ) last_msg ON TRUE
       WHERE c.participant_one = $1 OR c.participant_two = $1
       ORDER BY c.last_message_at DESC`,
      [req.user.id]
    );
    return res.json({ conversations: rows });
  } catch (err) {
    return next(err);
  }
}

/** GET /api/conversations/:id — one conversation (participant only). */
export async function getConversation(req, res, next) {
  try {
    const rows = await query(
      `SELECT ${CONVERSATION_FIELDS}
       FROM conversations c
       JOIN listings l ON l.id = c.listing_id
       JOIN users u_one ON u_one.id = c.participant_one
       JOIN users u_two ON u_two.id = c.participant_two
       WHERE c.id = $1
         AND (c.participant_one = $2 OR c.participant_two = $2)`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    return res.json({ conversation: rows[0] });
  } catch (err) {
    return next(err);
  }
}