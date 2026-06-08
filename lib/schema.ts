import pool from '@/lib/db';

let tenantSchemaReady: Promise<void> | null = null;

export function normalizeCompanyStatus(status?: string) {
  if (status === 'pilot' || status === 'draft' || status === 'active') return status;
  if (status === 'Disabled') return 'draft';
  return 'active';
}

export async function ensureTenantSchema() {
  tenantSchemaReady ??= (async () => {
    await pool.query(`
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS slug text;
      WITH numbered AS (
        SELECT
          id,
          lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) AS base_slug,
          row_number() OVER (
            PARTITION BY lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
            ORDER BY created_at, id
          ) AS slug_index
        FROM companies
        WHERE slug IS NULL OR slug = ''
      )
      UPDATE companies c
      SET slug = CASE
        WHEN numbered.slug_index = 1 THEN numbered.base_slug
        ELSE concat(numbered.base_slug, '-', numbered.slug_index)
      END
      FROM numbered
      WHERE c.id = numbered.id;
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
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS program text;
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS assignment_name text;
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS admin_remark text NOT NULL DEFAULT 'Not Reviewed';
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS admin_comment text;

      ALTER TABLE submissions ALTER COLUMN program DROP NOT NULL;
      ALTER TABLE submissions ALTER COLUMN assignment_name DROP NOT NULL;

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
    `);
  })();

  return tenantSchemaReady;
}
