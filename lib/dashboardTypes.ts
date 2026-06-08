export type PageType = 'dashboard' | 'assignments' | 'collections' | 'results' | 'participants' | 'companies' | 'reports' | 'settings';

export interface Participant {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  company: string;
  department: string;
  email: string;
  status: 'Enabled' | 'Disabled';
}

export interface FormBlueprint {
  id: string;
  name: string;
  created: string;
  status: 'Enabled' | 'Disabled';
  description?: string;
  googleFormUrl?: string;
  type?: string;
  questionCount?: number;
  maxPossibleScore?: number;
  published?: boolean;
  publishedAt?: string;
  structure?: {
    formName: string;
    description: string;
    fields: unknown[];
  };
}

export interface Assignment {
  id: string;
  name: string;
  formName: string;
  formBlueprintId?: string;
  assignedTo: string;
  dueDate: string;
  completedText: string;
  status: 'Enabled' | 'Disabled';
  rawDate?: string;
  published: boolean;
  publishedAt?: string;
}

export interface Submission {
  id: string;
  assignmentId?: string;
  participantEmail?: string;
  participantName: string;
  program: string;
  assignmentName: string;
  score: number | null;
  status: 'Completed' | 'In Progress' | 'Pending' | 'Not Started' | 'Submitted';
  progress?: number;
  createdAt?: string;
  adminRemark?: string | null;
  adminComment?: string | null;
  reviewedAt?: string | null;
}

export type SubmissionAnswerValue = string | number | string[];

export interface SubmissionAnswer {
  fieldId: string;
  fieldType?: string;
  label: string;
  value: SubmissionAnswerValue;
  pointsEarned?: number;
}

export interface SubmissionDetail extends Submission {
  participantId?: string;
  formBlueprintId: string;
  formName: string;
  formDescription: string | null;
  companySlug: string;
  companyName: string;
  dueDate: string | null;
  answers: SubmissionAnswer[];
  structure?: {
    formName?: string;
    description?: string;
    fields?: unknown[];
  };
}

export interface Company {
  id: string;
  name: string;
  slug?: string;
  industry?: string;
  createdDate: string;
  status: 'Enabled' | 'Disabled' | 'draft' | 'pilot' | 'active';
}

export interface CollectionFolder {
  id: string;
  name: string;
  description: string;
  createdDate: string;
  assignmentIds: string[];
}

export interface PlatformSettings {
  platformName: string;
  notificationsEnabled: boolean;
  autoReports: boolean;
  timezone: string;
}
