import { Router } from 'express';
import { listMessages, sendMessage } from '../controllers/messages.controller.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// Messages land in the M3 milestone. Wire-up ready now.
router.get('/:conversationId', authRequired, listMessages);
router.post('/:conversationId', authRequired, sendMessage);

export default router;