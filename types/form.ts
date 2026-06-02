// types/form.ts
export type FormFieldType = 'text_short' | 'text_long' | 'file_upload' | 'likert_scale';

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  allowedExtensions?: string[];
  minScale?: number;
  maxScale?: number;
}

export interface FormBlueprint {
  id: string;
  name: string;
  type: string;
  questionCount: number;
  created: string;
  status: 'Enabled' | 'Disabled';
  description?: string;
  structure?: {
    formName: string;
    description: string;
    fields: FormField[];
  };
}