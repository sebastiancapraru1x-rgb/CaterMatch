import { Router } from 'express';
import {
  startConversation,
  listConversations,
  getConversation,
} from '../controllers/conversations.controller.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// Conversations/chat land in the M3 milestone. Wire-up ready now.
router.post('/', authRequired, startConversation);
router.get('/', authRequired, listConversations);
router.get('/:id', authRequired, getConversation);

export default router;