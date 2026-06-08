CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS companies (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  slug text UNIQUE,
  industry text,
  created_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pilot', 'active')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS participants (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  name text,
  company_id text REFERENCES companies(id) ON DELETE SET NULL,
  department text,
  email text UNIQUE,
  status text NOT NULL DEFAULT 'Enabled' CHECK (status IN ('Enabled', 'Disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS form_blueprints (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  type text DEFAULT 'Custom Dynamic Form JSON Schema',
  description text,
  question_count integer NOT NULL DEFAULT 0,
  max_possible_score integer NOT NULL DEFAULT 0,
  structure jsonb NOT NULL DEFAULT '{"formName":"","description":"","fields":[]}'::jsonb,
  status text NOT NULL DEFAULT 'Enabled' CHECK (status IN ('Enabled', 'Disabled')),
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assignments (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  form_blueprint_id text NOT NULL REFERENCES form_blueprints(id) ON DELETE CASCADE,
  assigned_to text NOT NULL DEFAULT 'All Participants',
  due_date date,
  completed_count integer NOT NULL DEFAULT 0,
  total_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Enabled' CHECK (status IN ('Enabled', 'Disabled')),
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS form_responses (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  form_blueprint_id text NOT NULL REFERENCES form_blueprints(id) ON DELETE CASCADE,
  assignment_id text NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  participant_id text REFERENCES participants(id) ON DELETE SET NULL,
  participant_name text NOT NULL,
  participant_email text,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_score integer NOT NULL DEFAULT 0,
  max_score integer NOT NULL DEFAULT 0,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS submissions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  assignment_id text REFERENCES assignments(id) ON DELETE CASCADE,
  participant_id text REFERENCES participants(id) ON DELETE CASCADE,
  participant_email text,
  participant_name text NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  score integer,
  status text NOT NULL DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'In Progress', 'Submitted')),
  reviewed_at timestamptz,
  form_response_id text REFERENCES form_responses(id) ON DELETE SET NULL,
  program text,
  assignment_name text,
  progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  admin_remark text NOT NULL DEFAULT 'Not Reviewed',
  admin_comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);


CREATE TABLE IF NOT EXISTS reports (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  type text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  format text NOT NULL,
  size text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collection_folders (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  assignment_ids text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  platform_name text NOT NULL DEFAULT 'Workinspires',
  notifications_enabled boolean NOT NULL DEFAULT true,
  auto_reports boolean NOT NULL DEFAULT false,
  timezone text NOT NULL DEFAULT 'Asia/Kuala_Lumpur',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS form_blueprints_structure_gin_idx ON form_blueprints USING gin (structure);
CREATE INDEX IF NOT EXISTS form_responses_answers_gin_idx ON form_responses USING gin (answers);
CREATE INDEX IF NOT EXISTS assignments_form_blueprint_id_idx ON assignments(form_blueprint_id);
CREATE INDEX IF NOT EXISTS assignments_assigned_to_idx ON assignments(assigned_to);
CREATE INDEX IF NOT EXISTS form_responses_assignment_id_idx ON form_responses(assignment_id);
CREATE INDEX IF NOT EXISTS form_responses_form_blueprint_id_idx ON form_responses(form_blueprint_id);
CREATE INDEX IF NOT EXISTS participants_company_id_idx ON participants(company_id);
CREATE INDEX IF NOT EXISTS submissions_assignment_id_idx ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS submissions_participant_id_idx ON submissions(participant_id);
