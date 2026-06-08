import pool from '@/lib/db';
import { assertTenantAccessForRequest, generateSubmissionId, slugifyCompany } from '@/lib/tenant';
import { ensureTenantSchema } from '@/lib/schema';
import { renderEvaluationEmail } from '@/lib/evaluationEmail';

export const dynamic = 'force-dynamic';

const assignmentSelect = `
  SELECT
    a.id,
    a.name,
    fb.name AS "formName",
    a.form_blueprint_id AS "formBlueprintId",
    COALESCE(c.name, a.assigned_to) AS "assignedTo",
    CASE WHEN a.due_date IS NULL THEN '' ELSE to_char(a.due_date, 'Mon DD, YYYY') END AS "dueDate",
    CASE WHEN a.due_date IS NULL THEN '' ELSE to_char(a.due_date, 'YYYY-MM-DD') END AS "rawDate",
    concat(
      COUNT(s.id) FILTER (WHERE s.status = 'Submitted'),
      '/',
      COUNT(s.id)
    ) AS "completedText",
    a.status,
    a.published,
    CASE WHEN a.published_at IS NULL THEN NULL ELSE to_char(a.published_at, 'Mon DD, YYYY') END AS "publishedAt"
  FROM assignments a
  JOIN form_blueprints fb ON fb.id = a.form_blueprint_id
  LEFT JOIN companies c ON c.slug = a.assigned_to
  LEFT JOIN submissions s ON s.assignment_id = a.id
`;

async function resolveFormBlueprintId(formBlueprintId?: string, formName?: string) {
  if (formBlueprintId) return formBlueprintId;
  if (!formName) return null;

  const result = await pool.query<{ id: string }>('SELECT id FROM form_blueprints WHERE name = $1 LIMIT 1', [formName]);
  return result.rows[0]?.id ?? null;
}

async function resolveCompanySlug(value: string) {
  await ensureTenantSchema();
  const normalized = slugifyCompany(value);
  const result = await pool.query<{ slug: string }>(
    `
    SELECT COALESCE(slug, lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))) AS slug
    FROM companies
    WHERE COALESCE(slug, lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))) = $1 OR name = $2
    LIMIT 1
    `,
    [normalized, value]
  );

  return result.rows[0]?.slug ?? normalized;
}

function getAppUrl(request: Request, requestedAppUrl?: string) {
  const envUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  if (requestedAppUrl) return requestedAppUrl.replace(/\/$/, '');

  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost || request.headers.get('host');
  if (host) {
    const protocol = request.headers.get('x-forwarded-proto') || new URL(request.url).protocol.replace(':', '');
    return `${protocol}://${host}`;
  }

  return new URL(request.url).origin;
}

export async function GET(request: Request) {
  await ensureTenantSchema();
  const url = new URL(request.url);
  const companySlug = url.searchParams.get('companySlug');
  if (!companySlug) {
    const result = await pool.query(
      `
      ${assignmentSelect}
      GROUP BY a.id, fb.name, c.name
      ORDER BY a.created_at DESC
      `
    );

    return Response.json(result.rows);
  }

  const tenant = await assertTenantAccessForRequest(companySlug, request);
  if (!tenant.allowed || !tenant.company) {
    return Response.json({ error: tenant.reason }, { status: tenant.company ? 403 : 404 });
  }

  const result = await pool.query(
    `
    ${assignmentSelect}
    WHERE a.assigned_to = $1
    GROUP BY a.id, fb.name, c.name
    ORDER BY a.created_at DESC
    `,
    [tenant.company.slug]
  );

  return Response.json(result.rows);
}

export async function POST(request: Request) {
  await ensureTenantSchema();
  const body = await request.json();
  const targetSlug = await resolveCompanySlug(body.assignedTo ?? body.companySlug ?? '');
  const tenant = await assertTenantAccessForRequest(targetSlug, request);

  if (!tenant.allowed || !tenant.company) {
    return Response.json({ error: tenant.reason }, { status: tenant.company ? 403 : 404 });
  }

  const formBlueprintId = await resolveFormBlueprintId(body.formBlueprintId, body.formName);
  if (!body.name?.trim() || !formBlueprintId) {
    return Response.json({ error: 'Assignment name and form are required.' }, { status: 400 });
  }

  const client = await pool.connect();
  const assignmentId = body.id ?? `asg_${Date.now()}`;

  try {
    await client.query('BEGIN');

    const participants = await client.query<{
      id: string;
      name: string;
      email: string;
    }>(
      `
      SELECT
        p.id,
        COALESCE(NULLIF(p.name, ''), concat_ws(' ', p.first_name, p.last_name)) AS name,
        p.email
      FROM participants p
      WHERE p.company_id = $1 AND p.status = 'Enabled'
      ORDER BY p.created_at ASC
      `,
      [tenant.company.id]
    );

    await client.query(
      `
      INSERT INTO assignments (
        id, name, form_blueprint_id, assigned_to, due_date,
        completed_count, total_count, status, published, published_at
      )
      VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8, CASE WHEN $8 THEN now() ELSE NULL END)
      `,
      [
        assignmentId,
        body.name.trim(),
        formBlueprintId,
        tenant.company.slug,
        body.rawDate || body.dueDate || null,
        participants.rowCount,
        body.status ?? 'Enabled',
        body.published ?? false,
      ]
    );

    const submissionRows = participants.rows.map((participant) => ({
      id: generateSubmissionId(),
      assignmentId,
      participantId: participant.id,
      participantName: participant.name,
      participantEmail: participant.email,
    }));

    if (submissionRows.length > 0) {
      const values: unknown[] = [];
      const placeholders = submissionRows.map((row, index) => {
        const offset = index * 5;
        values.push(row.id, row.assignmentId, row.participantId, row.participantEmail, row.participantName);
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, 'Not Started', '{}'::jsonb)`;
      });

      await client.query(
        `
        INSERT INTO submissions (
          id, assignment_id, participant_id, participant_email, participant_name, status, answers
        )
        VALUES ${placeholders.join(', ')}
        `,
        values
      );
    }

    const saved = await client.query(
      `
      ${assignmentSelect}
      WHERE a.id = $1 AND a.assigned_to = $2
      GROUP BY a.id, fb.name, c.name
      `,
      [assignmentId, tenant.company.slug]
    );

    await client.query('COMMIT');

    if (body.published) {
      const appUrl = getAppUrl(request, body.appUrl);
      await Promise.allSettled(
        submissionRows.map((submission) =>
          fetch(`${appUrl}/api/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: submission.participantEmail,
              subject: `New Assignment: ${body.name.trim()}`,
              html: renderEvaluationEmail({
                assignmentName: body.name.trim(),
                participantName: submission.participantName,
                dueDate: body.rawDate || body.dueDate || 'Open',
                evaluationUrl: `${appUrl}/submissions/${submission.id}`,
              }),
            }),
          })
        )
      );
    }

    return Response.json({ ...saved.rows[0], submissionsCreated: submissionRows.length }, { status: 201 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to create assignment engine records:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    client.release();
  }
}
