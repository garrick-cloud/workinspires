import pool from '@/lib/db';
import { ensureTenantSchema } from '@/lib/schema';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

const submissionDetailSelect = `
  SELECT
    s.id,
    s.assignment_id AS "assignmentId",
    s.participant_id AS "participantId",
    s.participant_email AS "participantEmail",
    s.participant_name AS "participantName",
    s.status,
    s.answers,
    s.score,
    s.reviewed_at AS "reviewedAt",
    a.name AS "assignmentName",
    a.due_date AS "dueDate",
    fb.id AS "formBlueprintId",
    fb.name AS "formName",
    fb.description AS "formDescription",
    fb.structure,
    c.slug AS "companySlug",
    c.name AS "companyName"
  FROM submissions s
  JOIN assignments a ON a.id = s.assignment_id
  JOIN form_blueprints fb ON fb.id = a.form_blueprint_id
  JOIN participants p ON p.id = s.participant_id
  JOIN companies c ON c.id = p.company_id
`;

export async function GET(_request: Request, ctx: Context) {
  await ensureTenantSchema();
  const { id } = await ctx.params;
  const result = await pool.query(`${submissionDetailSelect} WHERE s.id = $1 LIMIT 1`, [id]);

  if (result.rowCount === 0) {
    return Response.json({ error: 'Submission not found.' }, { status: 404 });
  }

  return Response.json(result.rows[0]);
}

export async function PATCH(request: Request, ctx: Context) {
  try {
    await ensureTenantSchema();
    const { id } = await ctx.params;
    const body = await request.json();
    const answers = body.answers ?? {};
    const score = body.score !== undefined && body.score !== null ? Number(body.score) : null;

    const result = await pool.query(
      `
      UPDATE submissions
      SET
        answers = $2::jsonb,
        score = $3,
        status = 'Submitted',
        reviewed_at = now(),
        progress = 100,
        updated_at = now()
      WHERE id = $1
      RETURNING id, status, answers, score, reviewed_at AS "reviewedAt"
      `,
      [id, JSON.stringify(answers), score]
    );

    if (result.rowCount === 0) {
      return Response.json({ error: 'Submission not found.' }, { status: 404 });
    }

    await pool.query(
      `
      UPDATE assignments a
      SET completed_count = (
        SELECT COUNT(*)
        FROM submissions s
        WHERE s.assignment_id = a.id AND s.status = 'Submitted'
      )
      WHERE a.id = (
        SELECT assignment_id
        FROM submissions
        WHERE id = $1
      )
      `,
      [id]
    );

    return Response.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to submit evaluation:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, ctx: Context) {
  try {
    const { id } = await ctx.params;
    const result = await pool.query('DELETE FROM submissions WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return Response.json({ error: 'Submission not found.' }, { status: 404 });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete submission:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
