import pool from '@/lib/db';
import type { FormBlueprint } from '@/types/form';

export const dynamic = 'force-dynamic';

const formSelect = `
  SELECT
    id,
    name,
    type,
    description,
    question_count AS "questionCount",
    max_possible_score AS "maxPossibleScore",
    structure,
    status,
    published,
    CASE WHEN published_at IS NULL THEN NULL ELSE to_char(published_at, 'Mon DD, YYYY') END AS "publishedAt",
    to_char(created_at, 'Mon DD, YYYY') AS created
  FROM form_blueprints
`;

export async function GET() {
  const result = await pool.query<FormBlueprint>(`${formSelect} ORDER BY created_at DESC`);
  return Response.json(result.rows);
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.name?.trim()) {
    return Response.json({ error: 'Form name is required.' }, { status: 400 });
  }

  const fields = body.structure?.fields ?? [];
  const structure = body.structure ?? {
    formName: body.name.trim(),
    description: body.description ?? '',
    fields,
  };

  const result = await pool.query<FormBlueprint>(
    `
    INSERT INTO form_blueprints (
      id, name, type, description, question_count, max_possible_score,
      structure, status, published, published_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10)
    RETURNING
      id,
      name,
      type,
      description,
      question_count AS "questionCount",
      max_possible_score AS "maxPossibleScore",
      structure,
      status,
      published,
      CASE WHEN published_at IS NULL THEN NULL ELSE to_char(published_at, 'Mon DD, YYYY') END AS "publishedAt",
      to_char(created_at, 'Mon DD, YYYY') AS created
    `,
    [
      body.id ?? `form_${Date.now()}`,
      body.name.trim(),
      body.type ?? 'Custom Dynamic Form JSON Schema',
      body.description ?? '',
      body.questionCount ?? fields.length,
      body.maxPossibleScore ?? fields.reduce((sum: number, field: { points?: number }) => sum + (Number(field.points) || 0), 0),
      JSON.stringify(structure),
      body.status ?? 'Enabled',
      body.published ?? false,
      body.publishedAt ? new Date(body.publishedAt) : null,
    ]
  );

  return Response.json(result.rows[0], { status: 201 });
}
