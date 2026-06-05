import pool from '@/lib/db';
import type { FormBlueprint } from '@/types/form';
import { parseFormBody, formSelectFields } from '@/lib/form-helpers';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, ctx: Context) {
  try {
    const { id } = await ctx.params;
    const body = await request.json();

    if (!body.name?.trim()) {
      return Response.json({ error: 'Form name is required.' }, { status: 400 });
    }

    const parsed = parseFormBody(body);

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
        -- If published is true, keep old published_at or set to now(). If false, nullify it.
        published_at = CASE WHEN $9::boolean THEN COALESCE(published_at, now()) ELSE NULL END,
        updated_at = now()
      WHERE id = $1
      RETURNING ${formSelectFields}
      `,
      [
        id,
        parsed.name,
        parsed.type,
        parsed.description,
        parsed.questionCount,
        parsed.maxPossibleScore,
        parsed.structure,
        parsed.status,
        parsed.published,
      ]
    );

    if (result.rowCount === 0) {
      return Response.json({ error: 'Form not found.' }, { status: 404 });
    }

    return Response.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update form:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, ctx: Context) {
  try {
    const { id } = await ctx.params;
    const result = await pool.query('DELETE FROM form_blueprints WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return Response.json({ error: 'Form not found.' }, { status: 404 });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete form:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}