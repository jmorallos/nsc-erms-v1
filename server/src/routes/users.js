import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get('/', requireRole('admin', 'superadmin'), async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.username, u.display_name, u.is_active, u.last_login,
              ur.id AS role_id, ur.code AS role_code, ur.name AS role_name
       FROM users u
       JOIN user_roles ur ON ur.id = u.role_id
       ORDER BY u.username`,
    );
    res.json({
      users: rows.map((u) => ({
        id: u.id,
        username: u.username,
        displayName: u.display_name,
        isActive: u.is_active,
        lastLogin: u.last_login,
        role: { id: u.role_id, code: u.role_code, name: u.role_name },
      })),
    });
  } catch (err) {
    next(err);
  }
});
