import pool from '@/lib/db';
import type { Assignment } from '@/context/DashboardContext';
import { ensureTenantSchema } from '@/lib/schema';
import { slugifyCompany } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

async function resolveFormBlueprintId(formBlueprintId?: string, formName?: string) {
  if (formBlueprintId) return formBlueprintId;
  if (!formName) return null;

  const result = await pool.query<{ id: string }>('SELECT id FROM form_blueprints WHERE name = $1 LIMIT 1', [formName]);
  return result.rows[0]?.id ?? null;
}

async function resolveCompanySlug(value?: string) {
  if (!value?.trim()) return 'all-participants';

  await ensureTenantSchema();
  const normalized = slugifyCompany(value);
  const result = await pool.query<{ slug: string }>(
    `
    SELECT COALESCE(slug, lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))) AS slug
    FROM companies
    WHERE COALESCE(slug, lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))) = $1 OR name = $2
    LIMIT 1
    `,
    [normalized, value.trim()]
  );

  return result.rows[0]?.slug ?? normalized;
}

export async function PUT(request: Request, ctx: Context) {
  await ensureTenantSchema();
  const { id } = await ctx.params;
  const body = await request.json();
  const formBlueprintId = await resolveFormBlueprintId(body.formBlueprintId, body.formName);
  const assignedToSlug = await resolveCompanySlug(body.companySlug ?? body.assignedTo);

  if (!body.name?.trim() || !formBlueprintId) {
    return Response.json({ error: 'Assignment name and form are required.' }, { status: 400 });
  }

  const result = await pool.query<Assignment>(
    `
    WITH saved AS (
      UPDATE assignments
      SET
        name = $2,
        form_blueprint_id = $3,
        assigned_to = $4,
        due_date = $5,
        status = $6,
        published = $7,
        published_at = CASE WHEN $7 THEN COALESCE(published_at, now()) ELSE published_at END,
        updated_at = now()
      WHERE id = $1
      RETURNING *
    )
    SELECT
      saved.id,
      saved.name,
      fb.name AS "formName",
      saved.form_blueprint_id AS "formBlueprintId",
      COALESCE(c.name, saved.assigned_to) AS "assignedTo",
      CASE WHEN saved.due_date IS NULL THEN '' ELSE to_char(saved.due_date, 'Mon DD, YYYY') END AS "dueDate",
      CASE WHEN saved.due_date IS NULL THEN '' ELSE to_char(saved.due_date, 'YYYY-MM-DD') END AS "rawDate",
      concat(saved.completed_count, '/', saved.total_count) AS "completedText",
      saved.status,
      saved.published,
      CASE WHEN saved.published_at IS NULL THEN NULL ELSE to_char(saved.published_at, 'Mon DD, YYYY') END AS "publishedAt"
    FROM saved
    JOIN form_blueprints fb ON fb.id = saved.form_blueprint_id
    LEFT JOIN companies c ON c.slug = saved.assigned_to
    `,
    [
      id,
      body.name.trim(),
      formBlueprintId,
      assignedToSlug,
      body.rawDate || null,
      body.status ?? 'Enabled',
      body.published ?? false,
    ]
  );

  if (!result.rowCount) {
    return Response.json({ error: 'Assignment not found.' }, { status: 404 });
  }

  return Response.json(result.rows[0]);
}

export async function DELETE(_request: Request, ctx: Context) {
  const { id } = await ctx.params;
  await pool.query('DELETE FROM assignments WHERE id = $1', [id]);
  return new Response(null, { status: 204 });
}
