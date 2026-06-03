import pool from '@/lib/db';
import type { Assignment } from '@/context/DashboardContext';

export const dynamic = 'force-dynamic';

const assignmentSelect = `
  SELECT
    a.id,
    a.name,
    fb.name AS "formName",
    a.form_blueprint_id AS "formBlueprintId",
    a.assigned_to AS "assignedTo",
    CASE WHEN a.due_date IS NULL THEN '' ELSE to_char(a.due_date, 'Mon DD, YYYY') END AS "dueDate",
    CASE WHEN a.due_date IS NULL THEN '' ELSE to_char(a.due_date, 'YYYY-MM-DD') END AS "rawDate",
    concat(a.completed_count, '/', a.total_count) AS "completedText",
    a.status,
    a.published,
    CASE WHEN a.published_at IS NULL THEN NULL ELSE to_char(a.published_at, 'Mon DD, YYYY') END AS "publishedAt"
  FROM assignments a
  JOIN form_blueprints fb ON fb.id = a.form_blueprint_id
`;

async function resolveFormBlueprintId(formBlueprintId?: string, formName?: string) {
  if (formBlueprintId) return formBlueprintId;
  if (!formName) return null;

  const result = await pool.query<{ id: string }>('SELECT id FROM form_blueprints WHERE name = $1 LIMIT 1', [formName]);
  return result.rows[0]?.id ?? null;
}

export async function GET() {
  const result = await pool.query<Assignment>(`${assignmentSelect} ORDER BY a.created_at DESC`);
  return Response.json(result.rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const formBlueprintId = await resolveFormBlueprintId(body.formBlueprintId, body.formName);

  if (!body.name?.trim() || !formBlueprintId) {
    return Response.json({ error: 'Assignment name and form are required.' }, { status: 400 });
  }

  const result = await pool.query<Assignment>(
      `
      WITH saved AS (
        INSERT INTO assignments (
          id, name, form_blueprint_id, assigned_to, due_date,
          completed_count, total_count, status, published, published_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CASE WHEN $9 THEN now() ELSE NULL END)
        RETURNING *
      )
      SELECT
        saved.id,
        saved.name,
        fb.name AS "formName",
        saved.form_blueprint_id AS "formBlueprintId",
        saved.assigned_to AS "assignedTo",
        CASE WHEN saved.due_date IS NULL THEN '' ELSE to_char(saved.due_date, 'Mon DD, YYYY') END AS "dueDate",
        CASE WHEN saved.due_date IS NULL THEN '' ELSE to_char(saved.due_date, 'YYYY-MM-DD') END AS "rawDate",
        concat(saved.completed_count, '/', saved.total_count) AS "completedText",
        saved.status,
        saved.published,
        CASE WHEN saved.published_at IS NULL THEN NULL ELSE to_char(saved.published_at, 'Mon DD, YYYY') END AS "publishedAt"
      FROM saved
      JOIN form_blueprints fb ON fb.id = saved.form_blueprint_id
      `,
      [
        body.id ?? `asg_${Date.now()}`,
        body.name.trim(),
        formBlueprintId,
        body.assignedTo ?? 'All Participants',
        body.rawDate || null,
        body.completedCount ?? 0,
        body.totalCount ?? 0,
        body.status ?? 'Enabled',
        body.published ?? false,
      ]
    );

  return Response.json(result.rows[0], { status: 201 });
}
