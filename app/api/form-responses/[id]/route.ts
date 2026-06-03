import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, ctx: Context) {
  const { id } = await ctx.params;
  await pool.query('DELETE FROM form_responses WHERE id = $1', [id]);
  return new Response(null, { status: 204 });
}
