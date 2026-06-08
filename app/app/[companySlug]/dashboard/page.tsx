import pool from '@/lib/db';
import { assertTenantAccess } from '@/lib/tenant';
import TenantDashboardClient, { type DashboardSubmission } from './TenantDashboardClient';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ companySlug: string }>;
};

export default async function CompanyDashboardPage({ params }: PageProps) {
  const { companySlug } = await params;
  const tenant = await assertTenantAccess(companySlug);

  if (!tenant.allowed || !tenant.company) {
    return (
      <main className="min-h-screen bg-[#0f172a] px-6 py-10 text-[#f8fafc]">
        <div className="mx-auto max-w-xl rounded-lg border border-rose-900/50 bg-rose-950/20 p-6">
          <h1 className="text-xl font-semibold">Access Restricted</h1>
          <p className="mt-2 text-sm text-rose-100">{tenant.reason}</p>
        </div>
      </main>
    );
  }

  const [participants, submissions] = await Promise.all([
    pool.query<{ total: string }>(
      `
      SELECT COUNT(*) AS total
      FROM participants
      WHERE company_id = $1 AND status = 'Enabled'
      `,
      [tenant.company.id]
    ),
    pool.query<DashboardSubmission>(
      `
      SELECT
        s.id,
        s.participant_name AS "participantName",
        s.participant_email AS "participantEmail",
        fb.name AS program,
        a.name AS "assignmentName",
        s.status,
        s.score,
        CASE WHEN s.reviewed_at IS NULL THEN NULL ELSE to_char(s.reviewed_at, 'YYYY-MM-DD') END AS "reviewedAt"
      FROM submissions s
      JOIN assignments a ON a.id = s.assignment_id
      JOIN form_blueprints fb ON fb.id = a.form_blueprint_id
      JOIN participants p ON p.id = s.participant_id
      WHERE a.assigned_to = $1 AND p.company_id = $2
      ORDER BY s.created_at DESC
      `,
      [tenant.company.slug, tenant.company.id]
    ),
  ]);

  return (
    <TenantDashboardClient
      company={tenant.company}
      totalParticipants={Number(participants.rows[0]?.total ?? 0)}
      submissions={submissions.rows}
    />
  );
}
