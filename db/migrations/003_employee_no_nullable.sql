-- Allow employees without an employee number (blank = NULL; UNIQUE allows many NULLs)

ALTER TABLE employees
  ALTER COLUMN employee_no DROP NOT NULL;
