import pool from '@/lib/db';
import type { Participant } from '@/context/DashboardContext';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

async function companyIdForName(companyName: string) {
  const result = await pool.query<{ id: string }>('SELECT id FROM companies WHERE name = $1 LIMIT 1', [companyName]);
  return result.rows[0]?.id ?? null;
}

export async function PUT(request: Request, ctx: Context) {
  const { id } = await ctx.params;
  const body = await request.json();

  if (!body.firstName?.trim() || !body.lastName?.trim() || !body.email?.trim() || !body.company?.trim()) {
    return Response.json({ error: 'First name, last name, email, and company are required.' }, { status: 400 });
  }

  const companyId = await companyIdForName(body.company.trim());
  if (!companyId) {
    return Response.json({ error: 'Selected company does not exist.' }, { status: 400 });
  }

  const result = await pool.query<Participant>(
    `
    WITH saved AS (
      UPDATE participants
      SET first_name = $2, last_name = $3, company_id = $4, department = $5, email = $6, status = $7, updated_at = now()
      WHERE id = $1
      RETURNING *
    )
    SELECT
      saved.id,
      concat_ws(' ', saved.first_name, saved.last_name) AS name,
      saved.first_name AS "firstName",
      saved.last_name AS "lastName",
      c.name AS company,
      COALESCE(saved.department, '') AS department,
      COALESCE(saved.email, '') AS email,
      saved.status
    FROM saved
    LEFT JOIN companies c ON c.id = saved.company_id
    `,
    [
      id,
      body.firstName.trim(),
      body.lastName.trim(),
      companyId,
      body.department?.trim() || 'General Operations',
      body.email.trim(),
      body.status ?? 'Enabled',
    ]
  );

  if (!result.rowCount) {
    return Response.json({ error: 'Participant not found.' }, { status: 404 });
  }

  return Response.json(result.rows[0]);
}

export async function DELETE(_request: Request, ctx: Context) {
  const { id } = await ctx.params;
  await pool.query('DELETE FROM participants WHERE id = $1', [id]);
  return new Response(null, { status: 204 });
}
