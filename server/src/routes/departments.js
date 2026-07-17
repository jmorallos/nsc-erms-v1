import { Router } from 'express';
import { ulid } from 'ulid';
import { query } from '../db/pool.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { HttpError } from '../middleware/errors.js';

export const departmentsRouter = Router();

const writeRoles = requireRole('staff', 'admin', 'superadmin');

departmentsRouter.use(requireAuth);

departmentsRouter.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT d.id, d.name, d.description, d.is_active, d.created_at, d.updated_at,
              COUNT(ea.id) FILTER (
                WHERE ea.is_active = TRUE AND ea.is_primary = TRUE AND ea.end_date IS NULL
              )::int AS employee_count
       FROM departments d
       LEFT JOIN department_positions dp ON dp.department_id = d.id
       LEFT JOIN employee_assignments ea ON ea.department_position_id = dp.id
       WHERE d.is_active = TRUE
       GROUP BY d.id
       ORDER BY d.name`,
    );
    res.json({ departments: rows });
  } catch (err) {
    next(err);
  }
});

departmentsRouter.post('/', writeRoles, async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const description = String(req.body?.description || '').trim();
    if (!name) throw new HttpError(400, 'Name is required', 'VALIDATION');

    const id = ulid();
    const { rows } = await query(
      `INSERT INTO departments (id, name, description)
       VALUES ($1, $2, $3)
       RETURNING id, name, description, is_active, created_at, updated_at`,
      [id, name, description],
    );
    res.status(201).json({ department: { ...rows[0], employee_count: 0 } });
  } catch (err) {
    if (err.code === '23505') {
      return next(new HttpError(409, 'Department name already exists', 'CONFLICT'));
    }
    next(err);
  }
});

departmentsRouter.patch('/:id', writeRoles, async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const description = String(req.body?.description ?? '').trim();
    if (!name) throw new HttpError(400, 'Name is required', 'VALIDATION');

    const { rows } = await query(
      `UPDATE departments
       SET name = $2, description = $3, updated_at = NOW()
       WHERE id = $1 AND is_active = TRUE
       RETURNING id, name, description, is_active, created_at, updated_at`,
      [req.params.id, name, description],
    );
    if (!rows[0]) throw new HttpError(404, 'Department not found', 'NOT_FOUND');
    res.json({ department: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return next(new HttpError(409, 'Department name already exists', 'CONFLICT'));
    }
    next(err);
  }
});

departmentsRouter.delete('/:id', writeRoles, async (req, res, next) => {
  try {
    const { rows: inUse } = await query(
      `SELECT 1
       FROM employee_assignments ea
       JOIN department_positions dp ON dp.id = ea.department_position_id
       WHERE dp.department_id = $1
         AND ea.is_active = TRUE
         AND ea.end_date IS NULL
       LIMIT 1`,
      [req.params.id],
    );
    if (inUse.length) {
      throw new HttpError(
        400,
        'Cannot delete: department still has active employees',
        'IN_USE',
      );
    }

    const { rows } = await query(
      `UPDATE departments
       SET is_active = FALSE, updated_at = NOW()
       WHERE id = $1 AND is_active = TRUE
       RETURNING id`,
      [req.params.id],
    );
    if (!rows[0]) throw new HttpError(404, 'Department not found', 'NOT_FOUND');
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
