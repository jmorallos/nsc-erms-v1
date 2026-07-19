import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { subscribe, unsubscribe } from '../services/liveEvents.js';

export const eventsRouter = Router();

eventsRouter.use(requireAuth);

/**
 * Long-lived Server-Sent Events stream for live UI invalidation.
 * GET /api/v1/events/stream
 */
eventsRouter.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  res.write(': connected\n\n');
  subscribe(res);

  const cleanup = () => {
    unsubscribe(res);
  };

  req.on('close', cleanup);
  req.on('aborted', cleanup);
});
