import pool from '@/lib/db';
import type { Submission } from '@/context/DashboardContext';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, ctx: Context) {
  try {
    const { id } = await ctx.params;
    const body = await request.json();

    if (!body.participantName?.trim() || !body.program?.trim() || !body.assignmentName?.trim()) {
      return Response.json({ error: 'Participant name, program, and assignment name are required.' }, { status: 400 });
    }

    // Determine reviewedAt time if adminComment changed or was added
    let reviewedAt = body.reviewedAt;
    if (body.adminComment !== undefined) {
      if (body.adminComment && !body.reviewedAt) {
        reviewedAt = new Date().toISOString();
      } else if (!body.adminComment) {
        reviewedAt = null;
      }
    }

    const result = await pool.query<Submission>(
      `
      UPDATE submissions
      SET
        participant_name = $2,
        program = $3,
        assignment_name = $4,
        score = $5,
        status = $6,
        progress = $7,
        admin_comment = $8,
        reviewed_at = COALESCE($9, reviewed_at),
        created_at = COALESCE($10, created_at)
      WHERE id = $1
      RETURNING
        id,
        form_response_id AS "formResponseId",
        participant_name AS "participantName",
        program,
        assignment_name AS "assignmentName",
        score,
        status,
        progress,
        admin_comment AS "adminComment",
        reviewed_at AS "reviewedAt"
      `,
      [
        id,
        body.participantName.trim(),
        body.program.trim(),
        body.assignmentName.trim(),
        body.score !== undefined && body.score !== null ? body.score : null,
        body.status ?? 'Pending',
        body.progress ?? 0,
        body.adminComment || null,
        reviewedAt || null,
        body.createdAt || null,
      ]
    );

    if (result.rowCount === 0) {
      return Response.json({ error: 'Submission not found.' }, { status: 404 });
    }

    return Response.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update submission:', error);
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
