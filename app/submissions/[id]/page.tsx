import pool from '@/lib/db';
import SubmissionFormClient, { type SubmissionContext } from './SubmissionFormClient';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function SubmissionPage({ params }: PageProps) {
  const { id } = await params;
  const result = await pool.query<SubmissionContext>(
    `
    SELECT
      s.id,
      s.participant_name AS "participantName",
      s.participant_email AS "participantEmail",
      s.status,
      s.answers,
      s.score,
      a.name AS "assignmentName",
      CASE WHEN a.due_date IS NULL THEN NULL ELSE to_char(a.due_date, 'YYYY-MM-DD') END AS "dueDate",
      fb.name AS "formName",
      fb.description AS "formDescription",
      fb.structure,
      c.name AS "companyName"
    FROM submissions s
    JOIN assignments a ON a.id = s.assignment_id
    JOIN form_blueprints fb ON fb.id = a.form_blueprint_id
    JOIN participants p ON p.id = s.participant_id
    JOIN companies c ON c.id = p.company_id
    WHERE s.id = $1
    LIMIT 1
    `,
    [id]
  );

  if (result.rowCount === 0) {
    return (
      <main className="min-h-screen bg-[#0f172a] px-6 py-10 text-white">
        <div className="mx-auto max-w-xl rounded-lg border border-slate-700 bg-slate-900 p-6">
          <h1 className="text-xl font-semibold">Submission Not Found</h1>
          <p className="mt-2 text-sm text-slate-300">This private evaluation link is invalid or no longer available.</p>
        </div>
      </main>
    );
  }

  return <SubmissionFormClient submission={result.rows[0]} />;
}
