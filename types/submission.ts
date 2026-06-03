import type { FormFieldType } from './form';

export type FormAnswerValue = string | number | string[];

export interface FormAnswer {
  fieldId: string;
  fieldType: FormFieldType;
  label: string;
  value: FormAnswerValue;
  pointsEarned?: number;
}

export interface FormResponse {
  id: string;
  formBlueprintId: string;
  formName: string;
  assignmentId: string;
  assignmentName: string;
  participantName: string;
  participantEmail?: string;
  answers: FormAnswer[];
  totalScore: number;
  maxScore: number;
  submittedAt: string;
}
