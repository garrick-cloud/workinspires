import pool from '@/lib/db';
import type { Company } from '@/context/DashboardContext';

export const dynamic = 'force-dynamic';

const companySelect = `
  SELECT
    id,
    name,
    industry,
    to_char(created_date, 'Mon DD, YYYY') AS "createdDate",
    status
  FROM companies
`;

export async function GET() {
  const result = await pool.query<Company>(`${companySelect} ORDER BY created_at DESC`);
  return Response.json(result.rows);
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.name?.trim()) {
    return Response.json({ error: 'Company name is required.' }, { status: 400 });
  }

  const result = await pool.query<Company>(
    `
    INSERT INTO companies (id, name, industry, status)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, industry, to_char(created_date, 'Mon DD, YYYY') AS "createdDate", status
    `,
    [
      body.id ?? `c_${Date.now()}`,
      body.name.trim(),
      body.industry?.trim() || 'General Enterprise',
      body.status ?? 'Enabled',
    ]
  );

  return Response.json(result.rows[0], { status: 201 });
}
