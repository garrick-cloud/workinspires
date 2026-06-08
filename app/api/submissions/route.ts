import pool from '@/lib/db';
import { assertTenantAccessForRequest } from '@/lib/tenant';
import { ensureTenantSchema } from '@/lib/schema';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const submissionSelect = `
  SELECT
    s.id,
    s.assignment_id AS "assignmentId",
    s.participant_id AS "participantId",
    s.participant_email AS "participantEmail",
    s.participant_name AS "participantName",
    fb.name AS program,
    a.name AS "assignmentName",
    s.status,
    s.answers,
    s.score,
    s.reviewed_at AS "reviewedAt",
    s.created_at AS "createdAt"
  FROM submissions s
  JOIN assignments a ON a.id = s.assignment_id
  JOIN form_blueprints fb ON fb.id = a.form_blueprint_id
  JOIN participants p ON p.id = s.participant_id
`;

export async function GET(request: Request) {
  try {
    await ensureTenantSchema();
    const url = new URL(request.url);
    const companySlug = url.searchParams.get('companySlug');
    if (!companySlug) {
      const result = await pool.query(
        `
        ${submissionSelect}
        ORDER BY s.created_at DESC
        `
      );

      return NextResponse.json(result.rows, { status: 200 });
    }

    const tenant = await assertTenantAccessForRequest(companySlug, request);
    if (!tenant.allowed || !tenant.company) {
      return NextResponse.json({ error: tenant.reason }, { status: tenant.company ? 403 : 404 });
    }

    const result = await pool.query(
      `
      ${submissionSelect}
      WHERE a.assigned_to = $1 AND p.company_id = $2
      ORDER BY s.created_at DESC
      `,
      [tenant.company.slug, tenant.company.id]
    );

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching tenant submissions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
