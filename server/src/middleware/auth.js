import { query } from '../db/pool.js';
import { HttpError } from './errors.js';

export async function requireAuth(req, _res, next) {
  if (!req.session?.userId) {
    return next(new HttpError(401, 'Authentication required', 'UNAUTHORIZED'));
  }
  next();
}

export function requireRole(...codes) {
  return async (req, _res, next) => {
    try {
      if (!req.session?.userId) {
        throw new HttpError(401, 'Authentication required', 'UNAUTHORIZED');
      }
      const { rows } = await query(
        `SELECT ur.code
         FROM users u
         JOIN user_roles ur ON ur.id = u.role_id
         WHERE u.id = $1 AND u.is_active = TRUE`,
        [req.session.userId],
      );
      const code = rows[0]?.code;
      if (!code || !codes.includes(code)) {
        throw new HttpError(403, 'Insufficient permissions', 'FORBIDDEN');
      }
      req.userRole = code;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export async function getSetupCompleted() {
  const { rows } = await query(
    `SELECT value FROM app_settings WHERE key = 'setup_completed'`,
  );
  return rows[0]?.value === true;
}
