import type { FormField } from '@/types/form';
import type { FormAnswer, FormAnswerValue } from '@/types/submission';

export function scoreAnswer(field: FormField, value: FormAnswerValue): number {
  const weight = Number(field.points) || 0;
  if (weight <= 0) return 0;

  if (field.type === 'likert_scale' && typeof value === 'number') {
    const max = 6;
    return Math.round((value / max) * weight);
  }

  if (field.type === 'text_short' || field.type === 'text_long') {
    const text = String(value ?? '').trim();
    return text.length > 0 ? weight : 0;
  }

  if (field.type === 'file_upload') {
    const text = String(value ?? '').trim();
    return text.length > 0 ? weight : 0;
  }

  return 0;
}

export function buildAnswers(
  fields: FormField[],
  values: Record<string, FormAnswerValue>
): FormAnswer[] {
  return fields.map((field) => {
    const value = values[field.id] ?? '';
    return {
      fieldId: field.id,
      fieldType: field.type,
      label: field.label,
      value,
      pointsEarned: scoreAnswer(field, value),
    };
  });
}

export function totalFromAnswers(answers: FormAnswer[]): number {
  return answers.reduce((sum, a) => sum + (a.pointsEarned ?? 0), 0);
}
