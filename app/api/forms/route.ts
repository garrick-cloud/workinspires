import pool from '@/lib/db';
import type { FormBlueprint } from '@/types/form';
import { parseFormBody, formSelectFields } from '@/lib/form-helpers'; // Created a helper file below

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await pool.query<FormBlueprint>(
      `SELECT ${formSelectFields} FROM form_blueprints ORDER BY created_at DESC`
    );
    return Response.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch forms:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name?.trim()) {
      return Response.json({ error: 'Form name is required.' }, { status: 400 });
    }

    const parsed = parseFormBody(body);
    const id = body.id ?? `form_${Date.now()}`;

    const result = await pool.query<FormBlueprint>(
      `
      INSERT INTO form_blueprints (
        id, name, type, description, question_count, max_possible_score,
        structure, status, published, published_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10)
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
        parsed.published ? new Date() : null, // Sets current time if creating a published form directly
      ]
    );

    return Response.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create form:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}