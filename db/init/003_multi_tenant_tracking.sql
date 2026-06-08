CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE companies ADD COLUMN IF NOT EXISTS slug text;
UPDATE companies
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';
CREATE UNIQUE INDEX IF NOT EXISTS companies_slug_unique_idx ON companies(slug);

ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_status_check;
ALTER TABLE companies ALTER COLUMN status SET DEFAULT 'draft';
UPDATE companies
SET status = CASE
  WHEN status IN ('active', 'pilot', 'draft') THEN status
  WHEN status = 'Disabled' THEN 'draft'
  ELSE 'active'
END;
ALTER TABLE companies ADD CONSTRAINT companies_status_check CHECK (status IN ('draft', 'pilot', 'active')) NOT VALID;

ALTER TABLE participants ADD COLUMN IF NOT EXISTS name text;
UPDATE participants
SET name = concat_ws(' ', first_name, last_name)
WHERE name IS NULL OR name = '';

ALTER TABLE submissions ADD COLUMN IF NOT EXISTS assignment_id text REFERENCES assignments(id) ON DELETE CASCADE;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS participant_id text REFERENCES participants(id) ON DELETE CASCADE;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS participant_email text;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS answers jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_status_check;
UPDATE submissions
SET status = CASE
  WHEN status IN ('Submitted', 'In Progress', 'Not Started') THEN status
  WHEN status = 'Completed' THEN 'Submitted'
  WHEN status = 'Pending' THEN 'Not Started'
  ELSE 'Not Started'
END;
ALTER TABLE submissions ALTER COLUMN status SET DEFAULT 'Not Started';
ALTER TABLE submissions ADD CONSTRAINT submissions_status_check CHECK (status IN ('Not Started', 'In Progress', 'Submitted')) NOT VALID;

CREATE INDEX IF NOT EXISTS assignments_assigned_to_idx ON assignments(assigned_to);
CREATE INDEX IF NOT EXISTS participants_company_id_idx ON participants(company_id);
CREATE INDEX IF NOT EXISTS submissions_assignment_id_idx ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS submissions_participant_id_idx ON submissions(participant_id);
