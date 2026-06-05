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

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const formResponseId = body.id ?? `resp_${Date.now()}`;
    const participantName = body.participantName.trim();
    const participantEmail = body.participantEmail?.trim() || null;
    const answers = body.answers ?? [];
    const totalScore = body.totalScore ?? 0;
    const maxScore = body.maxScore ?? 0;
    const submittedAt = body.submittedAt ?? new Date().toISOString();

    // 1. Insert form response
    await client.query(
      `
      INSERT INTO form_responses (
        id, form_blueprint_id, assignment_id, participant_name,
        participant_email, answers, total_score, max_score, submitted_at
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9)
      `,
      [
        formResponseId,
        body.formBlueprintId,
        body.assignmentId,
        participantName,
        participantEmail,
        JSON.stringify(answers),
        totalScore,
        maxScore,
        submittedAt,
      ]
    );

    // 2. Fetch assignment and form blueprint names to construct program/assignment_name for submission
    const lookupRes = await client.query<{ formName: string; assignmentName: string }>(
      `
      SELECT fb.name AS "formName", a.name AS "assignmentName"
      FROM assignments a
      JOIN form_blueprints fb ON fb.id = a.form_blueprint_id
      WHERE a.id = $1
      `,
      [body.assignmentId]
    );

    const formName = lookupRes.rows[0]?.formName || 'Custom Dynamic Form';
    const assignmentName = lookupRes.rows[0]?.assignmentName || 'Manual Task';

    // Calculate score percentage
    const scorePercent = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : null;

    // 3. Insert submission summary
    await client.query(
      `
      INSERT INTO submissions (
        id, form_response_id, participant_name, program,
        assignment_name, score, status, progress, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        `sub_${Date.now()}`,
        formResponseId,
        participantName,
        formName,
        assignmentName,
        scorePercent,
        'Completed',
        100,
        submittedAt,
      ]
    );

    // 4. Update the assignment's completed count
    await client.query(
      `
      UPDATE assignments
      SET completed_count = completed_count + 1
      WHERE id = $1
      `,
      [body.assignmentId]
    );

    await client.query('COMMIT');

    // 5. Select and return response data
    const selectResult = await pool.query<FormResponse>(
      `
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
      WHERE fr.id = $1
      `,
      [formResponseId]
    );

    return Response.json(selectResult.rows[0], { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to create form response and submission:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    client.release();
  }
}

