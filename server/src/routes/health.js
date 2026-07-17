import { Router } from 'express';
import { checkConnection } from '../db/pool.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res, next) => {
  try {
    const dbOk = await checkConnection();
    res.json({
      status: dbOk ? 'ok' : 'degraded',
      service: 'nsc-erms',
      time: new Date().toISOString(),
      database: dbOk ? 'up' : 'down',
    });
  } catch (err) {
    next(err);
  }
});
