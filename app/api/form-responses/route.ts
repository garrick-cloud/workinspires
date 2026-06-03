import pool from '@/lib/db';
import type { FormResponse } from '@/types/submission';

export const dynamic = 'force-dynamic';

const responseSelect = `
  SELECT
    fr.id,
    fr.form_blueprint_id AS "formBlueprintId",
    fb.name AS "formName",
    fr.assignment_id AS "assignmentId",
    a.name AS "assignmentName",
    fr.participant_name AS "participantName",
    fr.participant_email AS "participantEmail",
    fr.answers,
    fr.total_score AS "totalScore",
    fr.max_score AS "maxScore",
    fr.submitted_at AS "submittedAt"
  FROM form_responses fr
  JOIN form_blueprints fb ON fb.id = fr.form_blueprint_id
  JOIN assignments a ON a.id = fr.assignment_id
`;

export async function GET() {
  const result = await pool.query<FormResponse>(`${responseSelect} ORDER BY fr.submitted_at DESC`);
  return Response.json(result.rows);
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.formBlueprintId || !body.assignmentId || !body.participantName?.trim()) {
    return Response.json({ error: 'Form, assignment, and participant name are required.' }, { status: 400 });
  }

  const result = await pool.query<FormResponse>(
    `
    WITH saved AS (
      INSERT INTO form_responses (
        id, form_blueprint_id, assignment_id, participant_name,
        participant_email, answers, total_score, max_score, submitted_at
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9)
      RETURNING *
    )
    SELECT
      saved.id,
      saved.form_blueprint_id AS "formBlueprintId",
      fb.name AS "formName",
      saved.assignment_id AS "assignmentId",
      a.name AS "assignmentName",
      saved.participant_name AS "participantName",
      saved.participant_email AS "participantEmail",
      saved.answers,
      saved.total_score AS "totalScore",
      saved.max_score AS "maxScore",
      saved.submitted_at AS "submittedAt"
    FROM saved
    JOIN form_blueprints fb ON fb.id = saved.form_blueprint_id
    JOIN assignments a ON a.id = saved.assignment_id
    `,
    [
      body.id ?? `resp_${Date.now()}`,
      body.formBlueprintId,
      body.assignmentId,
      body.participantName.trim(),
      body.participantEmail?.trim() || null,
      JSON.stringify(body.answers ?? []),
      body.totalScore ?? 0,
      body.maxScore ?? 0,
      body.submittedAt ?? new Date().toISOString(),
    ]
  );

  return Response.json(result.rows[0], { status: 201 });
}
