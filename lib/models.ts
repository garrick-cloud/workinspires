export type Status = 'Enabled' | 'Disabled';
export type SubmissionStatus = 'Completed' | 'In Progress' | 'Pending' | 'Not Started' | 'Submitted';

export interface Participant {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  company: string;
  department: string;
  email: string;
  status: Status;
}

export interface FormBlueprint {
  id: string;
  name: string;
  created: string;
  status: Status;
  description?: string;
  googleFormUrl?: string;
}

export interface Assignment {
  id: string;
  name: string;
  formName: string;
  assignedTo: string;
  dueDate: string;
  completedText: string;
  status: Status;
  rawDate?: string;
  published: boolean;
  publishedAt?: string;
}

export interface Submission {
  id: string;
  participantName: string;
  program: string;
  assignmentName: string;
  score: number | null;
  status: SubmissionStatus;
  progress: number;
  adminRemark?: string | null;
  adminComment?: string | null;
  reviewedAt?: string | null;
  formResponseId?: string | null;
}


export interface Report {
  id: string;
  name: string;
  type: string;
  generated: string;
  format: string;
  size: string;
}

export interface Company {
  id: string;
  name: string;
  industry?: string;
  createdDate: string;
  status: Status;
}

export interface CollectionFolder {
  id: string;
  name: string;
  description: string;
  createdDate: string;
  assignmentIds: string[];
}
