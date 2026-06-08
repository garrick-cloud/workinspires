import { randomUUID } from 'crypto';
import pool from '@/lib/db';
import { ensureTenantSchema } from '@/lib/schema';

export type TenantCompany = {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  status: string;
};

export type TenantAccessResult = {
  allowed: boolean;
  company: TenantCompany | null;
  reason: string;
};

export function slugifyCompany(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'company'
  );
}

export function generateSubmissionId() {
  return `sub_${randomUUID()}`;
}

async function findCompany(value: string) {
  await ensureTenantSchema();

  const normalized = slugifyCompany(value);
  const result = await pool.query<TenantCompany>(
    `
    SELECT
      id,
      name,
      COALESCE(slug, lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))) AS slug,
      industry,
      status
    FROM companies
    WHERE
      slug = $1
      OR lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) = $1
      OR name = $2
    LIMIT 1
    `,
    [normalized, value.trim()]
  );

  return result.rows[0] ?? null;
}

export async function assertTenantAccess(companySlug?: string | null): Promise<TenantAccessResult> {
  if (!companySlug?.trim()) {
    return {
      allowed: false,
      company: null,
      reason: 'Company tenant is required.',
    };
  }

  const company = await findCompany(companySlug);
  if (!company) {
    return {
      allowed: false,
      company: null,
      reason: 'Company tenant was not found.',
    };
  }

  if (!['active', 'pilot', 'Enabled'].includes(company.status)) {
    return {
      allowed: false,
      company,
      reason: 'This company tenant is not active.',
    };
  }

  return {
    allowed: true,
    company,
    reason: '',
  };
}

export async function assertTenantAccessForRequest(companySlug: string, _request: Request) {
  return assertTenantAccess(companySlug);
}
