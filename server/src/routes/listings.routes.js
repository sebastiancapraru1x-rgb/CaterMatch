import { Router } from 'express';
import {
  listListings,
  getListing,
  createListing,
  updateListing,
  removeListing,
} from '../controllers/listings.controller.js';
import { authRequired, authOptional } from '../middleware/auth.js';

const router = Router();

// Public: search feed + detail (optional auth enables `?mine=true`)
router.get('/', authOptional, listListings);
router.get('/:id', getListing);

// Protected: create / edit / delete own listings
router.post('/', authRequired, createListing);
router.put('/:id', authRequired, updateListing);
router.delete('/:id', authRequired, removeListing);

export default router;