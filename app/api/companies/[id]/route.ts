import pool from '@/lib/db';
import type { Company } from '@/context/DashboardContext';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, ctx: Context) {
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
    RETURNING id, name, industry, to_char(created_date, 'Mon DD, YYYY') AS "createdDate", status
    `,
    [id, body.name.trim(), body.industry?.trim() || 'General Enterprise', body.status ?? 'Enabled']
  );

  if (!result.rowCount) {
    return Response.json({ error: 'Company not found.' }, { status: 404 });
  }

  return Response.json(result.rows[0]);
}

export async function DELETE(_request: Request, ctx: Context) {
  const { id } = await ctx.params;
  await pool.query('DELETE FROM companies WHERE id = $1', [id]);
  return new Response(null, { status: 204 });
}
