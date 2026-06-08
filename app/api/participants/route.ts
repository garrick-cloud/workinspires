import pool from '@/lib/db';
import type { Participant } from '@/context/DashboardContext';
import { ensureTenantSchema } from '@/lib/schema';
import { slugifyCompany } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

const participantSelect = `
  SELECT
    p.id,
    concat_ws(' ', p.first_name, p.last_name) AS name,
    p.first_name AS "firstName",
    p.last_name AS "lastName",
    COALESCE(c.name, '') AS company,
    COALESCE(p.department, '') AS department,
    COALESCE(p.email, '') AS email,
    p.status
  FROM participants p
  LEFT JOIN companies c ON c.id = p.company_id
`;

async function companyIdForName(companyName: string) {
  await ensureTenantSchema();
  const result = await pool.query<{ id: string }>(
    `
    SELECT id
    FROM companies
    WHERE name = $1 OR slug = $2
    LIMIT 1
    `,
    [companyName, slugifyCompany(companyName)]
  );
  return result.rows[0]?.id ?? null;
}

export async function GET() {
  await ensureTenantSchema();
  const result = await pool.query<Participant>(`${participantSelect} ORDER BY p.created_at DESC`);
  return Response.json(result.rows);
}

export async function POST(request: Request) {
  await ensureTenantSchema();
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
      INSERT INTO participants (id, first_name, last_name, name, company_id, department, email, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
      body.id ?? `part_${Date.now()}`,
      body.firstName.trim(),
      body.lastName.trim(),
      `${body.firstName.trim()} ${body.lastName.trim()}`,
      companyId,
      body.department?.trim() || 'General Operations',
      body.email.trim(),
      body.status ?? 'Enabled',
    ]
  );

  return Response.json(result.rows[0], { status: 201 });
}
