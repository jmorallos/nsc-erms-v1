-- NSC-ERMS schema v1
-- ULID primary keys stored as CHAR(26)

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Lookups ──────────────────────────────────────────────────────────

CREATE TABLE departments (
  id CHAR(26) PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT departments_name_unique UNIQUE (name)
);

CREATE TABLE positions (
  id CHAR(26) PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT positions_name_unique UNIQUE (name)
);

CREATE TABLE department_positions (
  id CHAR(26) PRIMARY KEY,
  department_id CHAR(26) NOT NULL REFERENCES departments (id),
  position_id CHAR(26) NOT NULL REFERENCES positions (id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT department_positions_unique UNIQUE (department_id, position_id)
);

CREATE INDEX idx_department_positions_dept ON department_positions (department_id);
CREATE INDEX idx_department_positions_pos ON department_positions (position_id);

CREATE TABLE employment_types (
  id CHAR(26) PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT employment_types_name_unique UNIQUE (name)
);

CREATE TABLE employment_statuses (
  id CHAR(26) PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT employment_statuses_name_unique UNIQUE (name)
);

CREATE TABLE document_types (
  id CHAR(26) PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT document_types_name_unique UNIQUE (name)
);

CREATE TABLE user_roles (
  id CHAR(26) PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_roles_code_unique UNIQUE (code),
  CONSTRAINT user_roles_name_unique UNIQUE (name)
);

-- ── Core entities ────────────────────────────────────────────────────

CREATE TABLE employees (
  id CHAR(26) PRIMARY KEY,
  employee_no TEXT NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL,
  name_extension TEXT NOT NULL DEFAULT '',
  sex TEXT CHECK (sex IS NULL OR sex IN ('male', 'female', 'other')),
  birth_date DATE,
  contact_number TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  profile_picture_path TEXT,
  remarks TEXT NOT NULL DEFAULT '',
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by CHAR(26),
  updated_by CHAR(26),
  CONSTRAINT employees_employee_no_unique UNIQUE (employee_no)
);

CREATE INDEX idx_employees_name ON employees (last_name, first_name);
CREATE INDEX idx_employees_archived ON employees (is_archived) WHERE deleted_at IS NULL;

CREATE TABLE users (
  id CHAR(26) PRIMARY KEY,
  employee_id CHAR(26) REFERENCES employees (id) ON DELETE SET NULL,
  role_id CHAR(26) NOT NULL REFERENCES user_roles (id),
  username CITEXT NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_username_unique UNIQUE (username)
);

CREATE INDEX idx_users_role ON users (role_id);
CREATE INDEX idx_users_employee ON users (employee_id);

-- Deferred FKs for employees.created_by / updated_by → users
ALTER TABLE employees
  ADD CONSTRAINT employees_created_by_fk FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL;

ALTER TABLE employees
  ADD CONSTRAINT employees_updated_by_fk FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL;

CREATE TABLE employee_assignments (
  id CHAR(26) PRIMARY KEY,
  employee_id CHAR(26) NOT NULL REFERENCES employees (id),
  department_position_id CHAR(26) NOT NULL REFERENCES department_positions (id),
  employment_type_id CHAR(26) NOT NULL REFERENCES employment_types (id),
  employment_status_id CHAR(26) NOT NULL REFERENCES employment_statuses (id),
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT employee_assignments_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_assignments_employee ON employee_assignments (employee_id);
CREATE INDEX idx_assignments_dept_pos ON employee_assignments (department_position_id);

-- At most one primary active assignment per employee
CREATE UNIQUE INDEX employee_assignments_one_primary
  ON employee_assignments (employee_id)
  WHERE is_primary = TRUE AND is_active = TRUE AND end_date IS NULL;

CREATE TABLE documents (
  id CHAR(26) PRIMARY KEY,
  employee_id CHAR(26) NOT NULL REFERENCES employees (id),
  document_type_id CHAR(26) NOT NULL REFERENCES document_types (id),
  file_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0 AND file_size <= 31457280),
  mime_type TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'upload'
    CHECK (source IN ('upload', 'scan_folder')),
  scan_inbox_filename TEXT,
  issued_date DATE,
  expiry_date DATE,
  remarks TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by CHAR(26) REFERENCES users (id) ON DELETE SET NULL,
  updated_by CHAR(26) REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_documents_employee ON documents (employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_type ON documents (document_type_id);

-- ── System ───────────────────────────────────────────────────────────

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id CHAR(26) PRIMARY KEY,
  actor_user_id CHAR(26) REFERENCES users (id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_created ON audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);

-- express-session store (connect-pg-simple)
CREATE TABLE session (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
) WITH (OIDS = FALSE);

ALTER TABLE session ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX IDX_session_expire ON session (expire);
