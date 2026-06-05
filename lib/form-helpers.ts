export const formSelectFields = `
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
`;

export function parseFormBody(body: any) {
  const name = body.name.trim();
  const description = body.description ?? '';
  const fields = body.structure?.fields ?? [];
  
  const structure = JSON.stringify(body.structure ?? {
    formName: name,
    description,
    fields,
  });

  const questionCount = body.questionCount ?? fields.length;
  
  const maxPossibleScore = body.maxPossibleScore ?? fields.reduce(
    (sum: number, field: { points?: number }) => sum + (Number(field.points) || 0), 
    0
  );

  return {
    name,
    description,
    type: body.type ?? 'Custom Dynamic Form JSON Schema',
    status: body.status ?? 'Enabled',
    published: body.published ?? false,
    structure,
    questionCount,
    maxPossibleScore
  };
}