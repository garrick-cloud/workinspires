// types/form.ts
export type FormFieldType = 
  | 'text_short' 
  | 'text_long' 
  | 'multiple_choice' 
  | 'checkbox_group' 
  | 'file_upload' 
  | 'likert_scale'
  | 'rating_scale'
  | 'date_picker'
  | 'time_picker';

export interface FormFieldOption {
  id: string;
  label: string;
  score?: number;
}

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  order: number;
  
  // For multiple choice, checkboxes, likert
  options?: FormFieldOption[];
  
  // For file uploads
  allowedExtensions?: string[];
  
  // For scales
  minScale?: number;
  maxScale?: number;
  minLabel?: string;
  maxLabel?: string;
  
  // For scoring
  maxScore?: number;
  scoreType?: 'points' | 'percentage';
  /** Builder weight per field (demo scoring) */
  points?: number;
}

export interface FormBlueprint {
  id: string;
  name: string;
  type?: string;
  questionCount?: number;
  created: string;
  lastModified?: string;
  status: 'Enabled' | 'Disabled';
  description?: string;
  googleFormUrl?: string;
  maxPossibleScore?: number;
  published?: boolean;
  publishedAt?: string;

  // JSON Schema for DB Storage
  structure?: {
    formName: string;
    description: string;
    fields: FormField[];
    totalMaxScore?: number;
    metadata?: {
      createdBy?: string;
      version?: number;
      tags?: string[];
    };
  };
}