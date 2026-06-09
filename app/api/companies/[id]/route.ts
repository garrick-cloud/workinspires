import pool from '@/lib/db';
import type { Company } from '@/context/DashboardContext';
import { ensureTenantSchema, normalizeCompanyStatus } from '@/lib/schema';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, ctx: Context) {
  await ensureTenantSchema();
  const { id } = await ctx.params;
  const body = await request.json();

  if (!body.name?.trim()) {
    return Response.json({ error: 'Company name is required.' }, { status: 400 });
  }

  const result = await pool.query<Company>(
    `
    UPDATE companies
    SET name = $2, industry = $3, status = $4, updated_at = now()
    WHERE id = $1
    RETURNING
      id,
      name,
      COALESCE(slug, lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))) AS slug,
      industry,
      to_char(created_date, 'Mon DD, YYYY') AS "createdDate",
      status
    `,
    [id, body.name.trim(), body.industry?.trim() || 'General Enterprise', normalizeCompanyStatus(body.status)]
  );

  if (!result.rowCount) {
    return Response.json({ error: 'Company not found.' }, { status: 404 });
  }

  return Response.json(result.rows[0]);
}

export async function DELETE(_request: Request, ctx: Context) {
  await ensureTenantSchema();
  const { id } = await ctx.params;

  const companyResult = await pool.query<{ id: string; name: string; slug: string | null }>(
    'SELECT id, name, slug FROM companies WHERE id = $1',
    [id]
  );

  const company = companyResult.rows[0];
  if (!company) {
    return Response.json({ error: 'Company not found.' }, { status: 404 });
  }

  let confirmationName = '';
  try {
    const body = await _request.json();
    confirmationName = typeof body.confirmationName === 'string' ? body.confirmationName.trim() : '';
  } catch {
    confirmationName = '';
  }

  if (confirmationName !== company.name) {
    return Response.json({ error: 'Type the company name exactly to delete it.' }, { status: 400 });
  }

  const dependencyResult = await pool.query<{
    participants: string;
    assignments: string;
  }>(
    `
    SELECT
      (SELECT count(*) FROM participants WHERE company_id = $1)::text AS participants,
      (SELECT count(*) FROM assignments WHERE assigned_to IN ($2, $3))::text AS assignments
    `,
    [company.id, company.slug, company.name]
  );

  const dependencies = dependencyResult.rows[0];
  const participantCount = Number(dependencies?.participants ?? 0);
  const assignmentCount = Number(dependencies?.assignments ?? 0);

  if (participantCount > 0 || assignmentCount > 0) {
    return Response.json(
      {
        error: `Cannot delete "${company.name}" while ${participantCount} participant(s) or ${assignmentCount} assignment(s) are linked.`,
      },
      { status: 409 }
    );
  }

  await pool.query('DELETE FROM companies WHERE id = $1', [id]);
  return new Response(null, { status: 204 });
}
