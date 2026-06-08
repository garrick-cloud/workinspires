import pool from '@/lib/db';
import type { Company } from '@/context/DashboardContext';
import { slugifyCompany } from '@/lib/tenant';
import { ensureTenantSchema, normalizeCompanyStatus } from '@/lib/schema';

export const dynamic = 'force-dynamic';

const companySelect = `
  SELECT
    id,
    name,
    COALESCE(slug, lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))) AS slug,
    industry,
    to_char(created_date, 'Mon DD, YYYY') AS "createdDate",
    status
  FROM companies
`;

export async function GET() {
  await ensureTenantSchema();
  const result = await pool.query<Company>(`${companySelect} ORDER BY created_at DESC`);
  return Response.json(result.rows);
}

export async function POST(request: Request) {
  await ensureTenantSchema();
  const body = await request.json();

  if (!body.name?.trim()) {
    return Response.json({ error: 'Company name is required.' }, { status: 400 });
  }

  const result = await pool.query<Company>(
    `
    INSERT INTO companies (id, name, slug, industry, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING
      id,
      name,
      slug,
      industry,
      to_char(created_date, 'Mon DD, YYYY') AS "createdDate",
      status
    `,
    [
      body.id ?? `c_${Date.now()}`,
      body.name.trim(),
      body.slug?.trim() ? slugifyCompany(body.slug) : slugifyCompany(body.name),
      body.industry?.trim() || 'General Enterprise',
      normalizeCompanyStatus(body.status),
    ]
  );

  return Response.json(result.rows[0], { status: 201 });
}
