import pool from '@/lib/db';
import type { Submission } from '@/context/DashboardContext';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const queryText = `
      SELECT 
        id,
        form_response_id AS "formResponseId",
        participant_name AS "participantName",
        program,
        assignment_name AS "assignmentName",
        score,
        status,
        progress,
        admin_comment AS "adminComment",
        reviewed_at AS "reviewedAt",
        created_at AS "createdAt"
      FROM submissions
      ORDER BY created_at DESC;
    `;

    const result = await pool.query(queryText);
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching submission report:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.participantName?.trim() || !body.program?.trim() || !body.assignmentName?.trim()) {
      return Response.json({ error: 'Participant name, program, and assignment name are required.' }, { status: 400 });
    }

    const id = body.id ?? `sub_${Date.now()}`;
    const result = await pool.query<Submission>(
      `
      INSERT INTO submissions (
        id, form_response_id, participant_name, program,
        assignment_name, score, status, progress, admin_comment, reviewed_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
        body.formResponseId || null,
        body.participantName.trim(),
        body.program.trim(),
        body.assignmentName.trim(),
        body.score !== undefined ? body.score : null,
        body.status ?? 'Pending',
        body.progress ?? 0,
        body.adminComment || null,
        body.reviewedAt || null,
      ]
    );

    return Response.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create submission:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
