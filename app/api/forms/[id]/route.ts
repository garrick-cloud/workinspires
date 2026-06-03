import pool from '@/lib/db';
import type { FormBlueprint } from '@/types/form';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, ctx: Context) {
  const { id } = await ctx.params;
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
    UPDATE form_blueprints
    SET
      name = $2,
      type = $3,
      description = $4,
      question_count = $5,
      max_possible_score = $6,
      structure = $7::jsonb,
      status = $8,
      published = $9,
      published_at = CASE WHEN $10::boolean THEN COALESCE(published_at, now()) ELSE published_at END,
      updated_at = now()
    WHERE id = $1
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
      id,
      body.name.trim(),
      body.type ?? 'Custom Dynamic Form JSON Schema',
      body.description ?? '',
      body.questionCount ?? fields.length,
      body.maxPossibleScore ?? fields.reduce((sum: number, field: { points?: number }) => sum + (Number(field.points) || 0), 0),
      JSON.stringify(structure),
      body.status ?? 'Enabled',
      body.published ?? false,
      Boolean(body.published),
    ]
  );

  if (!result.rowCount) {
    return Response.json({ error: 'Form not found.' }, { status: 404 });
  }

  return Response.json(result.rows[0]);
}

export async function DELETE(_request: Request, ctx: Context) {
  const { id } = await ctx.params;
  await pool.query('DELETE FROM form_blueprints WHERE id = $1', [id]);
  return new Response(null, { status: 204 });
}
