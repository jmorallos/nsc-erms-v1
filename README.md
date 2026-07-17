# NSC-ERMS

Northern Samar Colleges — Employee Records Management System.

**Stack:** Vanilla JS SPA (`renderer/`) · Node.js + Express (`server/`) · PostgreSQL (`db/migrations/`)

## Phase 0 (current)

- Postgres schema from the improved Electron mock model (ULIDs, assignments, document types, roles)
- Migrations + seed (lookups + superadmin)
- API: health, setup status/complete, auth (login / logout / me / change-password)
- Session cookies via `connect-pg-simple`
- HTTPS-ready (cert paths in `.env`); HTTP allowed in local dev

## Prerequisites

- Node.js 20+
- PostgreSQL 14+ on the LAN host
- (Production) TLS certificate for the LAN hostname

## Quick start (development)

```bash
# 1. Create database (psql)
CREATE USER nsc_erms WITH PASSWORD 'change_me';
CREATE DATABASE nsc_erms OWNER nsc_erms;

# 2. Configure env
copy .env.example .env
# edit DATABASE_URL, SESSION_SECRET, FILES_ROOT, SEED_SUPERADMIN_*

# 3. Install
npm install

# 4. Migrate + seed
npm run db:setup

# 5. Run API
npm run dev:server
```

Health check: `http://localhost:3443/api/v1/health`

### Seeded superadmin

Defaults (override in `.env`):

- Username: `superadmin`
- Password: `ChangeMeNow!`
- `must_change_password = true` — call `POST /api/v1/auth/change-password` after login

### First-run setup

1. `GET /api/v1/setup/status` → `{ setupCompleted: false, hasSuperadmin: true }`
2. `POST /api/v1/auth/login` with superadmin credentials
3. `POST /api/v1/auth/change-password`
4. `POST /api/v1/setup/complete` with body:

```json
{
  "orgName": "Northern Samar Colleges",
  "filesRoot": "C:\\nsc-erms-files",
  "scanInboxPath": "C:\\nsc-erms-files\\inbox",
  "maxUploadBytes": 31457280
}
```

## API (Phase 0)

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/health` | public |
| GET | `/api/v1/setup/status` | public |
| POST | `/api/v1/setup/complete` | superadmin session |
| POST | `/api/v1/auth/login` | public |
| POST | `/api/v1/auth/logout` | session |
| GET | `/api/v1/auth/me` | session |
| POST | `/api/v1/auth/change-password` | session |

## Schema highlights

Preserves mock ULIDs for departments, positions, department_positions, employment types/statuses, and document types.

Improvements over the mock JS file:

- `password_hash`, role `code`, `must_change_password`
- Roles: superadmin, admin, staff, viewer
- `employees` ↔ `employee_assignments` (dept+position junction)
- Documents: disk path, `source` (`upload` \| `scan_folder`), 30 MB cap
- `app_settings`, `audit_logs`, soft-delete columns
- Audit FKs use `users.id` (not usernames)
- Selective `document_types.is_required`

## LAN HTTPS

Set in `.env`:

```
TLS_CERT_PATH=C:\certs\erms.crt
TLS_KEY_PATH=C:\certs\erms.key
ALLOW_HTTP_DEV=false
```

Install the CA on staff PCs (e.g. mkcert) so browsers trust the LAN cert.

## Next phases

1. Wire SPA login to `/api/v1/auth`
2. Employees / departments / assignments CRUD
3. Document upload + scan-inbox assign
4. RBAC on all routes + audit log writes
