import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';

import { checkDb, shutdownDb, getDriver } from './config/db.js';
import { syncStaffFromEnv } from './services/staff.service.js';
import { setupSocketIo } from './config/socket.js';

import authRoutes from './routes/auth.routes.js';
import listingRoutes from './routes/listings.routes.js';
import conversationRoutes from './routes/conversations.routes.js';
import messageRoutes from './routes/messages.routes.js';
import boostRoutes from './routes/boosts.routes.js';
import adminRoutes from './routes/admin.routes.js';

import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();
const httpServer = createServer(app);

// ---- Global middleware ----
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));

// Stripe webhook needs the RAW body for signature verification,
// so it's handled before express.json() parses everything else.
app.post('/api/boosts/stripe/webhook', express.raw({ type: '*/*' }), async (req, res, next) => {
  try {
    const { handleStripeWebhook } = await import('./controllers/boosts.controller.js');
    await handleStripeWebhook(req, res);
  } catch (err) {
    next(err);
  }
});

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ---- Health check ----
app.get('/api/health', async (_req, res) => {
  const dbOk = await checkDb();
  const driver = dbOk ? await getDriver() : 'down';
  res.json({
    status: 'ok',
    db: dbOk ? driver : 'unavailable',
    time: new Date().toISOString(),
  });
});

// ---- API routes ----
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/boosts', boostRoutes);
app.use('/api/admin', adminRoutes);

// ---- 404 + error handling ----
app.use(notFound);
app.use(errorHandler);

// ---- Real-time engine ----
const io = setupSocketIo(httpServer);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, async () => {
  console.log(`🚚 CaterMatch API listening on http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready for real-time chat`);
  try {
    await getDriver();
    await syncStaffFromEnv();
  } catch (err) {
    console.warn('⚠️ Could not init database:', err.message);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await shutdownDb().catch(() => {});
  process.exit(0);
});