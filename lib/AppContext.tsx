'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  Participant,
  FormBlueprint,
  Assignment,
  Submission,
  Report,
  Company,
  CollectionFolder,
} from '@/lib/models';
import { apiGet } from '@/lib/apiClient';

interface AppContextType {
  // Data
  participants: Participant[];
  forms: FormBlueprint[];
  assignments: Assignment[];
  submissions: Submission[];
  reports: Report[];
  companies: Company[];
  folders: CollectionFolder[];

  // Setters
  setParticipants: (p: Participant[]) => void;
  setForms: (f: FormBlueprint[]) => void;
  setAssignments: (a: Assignment[]) => void;
  setSubmissions: (s: Submission[]) => void;
  setReports: (r: Report[]) => void;
  setCompanies: (c: Company[]) => void;
  setFolders: (f: CollectionFolder[]) => void;

  // UI State
  globalSearchQuery: string;
  setGlobalSearchQuery: (q: string) => void;
  programFilter: string;
  setProgramFilter: (p: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  companyFilter: string;
  setCompanyFilter: (c: string) => void;

  // Modal States
  isAssignmentOpen: boolean;
  setIsAssignmentOpen: (v: boolean) => void;
  isFormOpen: boolean;
  setIsFormOpen: (v: boolean) => void;
  isParticipantOpen: boolean;
  setIsParticipantOpen: (v: boolean) => void;
  isReportOpen: boolean;
  setIsReportOpen: (v: boolean) => void;
  isCompanyOpen: boolean;
  setIsCompanyOpen: (v: boolean) => void;
  isFolderOpen: boolean;
  setIsFolderOpen: (v: boolean) => void;
  isSubmissionOpen: boolean;
  setIsSubmissionOpen: (v: boolean) => void;

  // View States
  viewingAssignment: Assignment | null;
  setViewingAssignment: (a: Assignment | null) => void;
  viewingForm: FormBlueprint | null;
  setViewingForm: (f: FormBlueprint | null) => void;
  viewingParticipant: Participant | null;
  setViewingParticipant: (p: Participant | null) => void;
  viewingCompany: Company | null;
  setViewingCompany: (c: Company | null) => void;
  viewingSubmission: Submission | null;
  setViewingSubmission: (s: Submission | null) => void;
  activeFolderView: CollectionFolder | null;
  setActiveFolderView: (f: CollectionFolder | null) => void;

  // Edit States
  editingAssignment: Assignment | null;
  setEditingAssignment: (a: Assignment | null) => void;
  editingForm: FormBlueprint | null;
  setEditingForm: (f: FormBlueprint | null) => void;
  editingParticipant: Participant | null;
  setEditingParticipant: (p: Participant | null) => void;
  editingCompany: Company | null;
  setEditingCompany: (c: Company | null) => void;
  editingSubmission: Submission | null;
  setEditingSubmission: (s: Submission | null) => void;
  editingFolder: CollectionFolder | null;
  setEditingFolder: (f: CollectionFolder | null) => void;

  // Settings
  settingsSaved: boolean;
  setSettingsSaved: (v: boolean) => void;
  platformName: string;
  setPlatformName: (n: string) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (v: boolean) => void;
  autoReports: boolean;
  setAutoReports: (v: boolean) => void;
  timezone: string;
  setTimezone: (t: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

async function safeApiGet<T>(path: string, fallback: T): Promise<T> {
  try {
    return await apiGet<T>(path);
  } catch (error) {
    console.error(`Failed to load ${path}.`, error);
    return fallback;
  }
}

export function AppContextProvider({ children }: { children: ReactNode }) {
  // Data
  const [participants, setParticipants] = useState<Participant[]>([
    { id: "p1", name: "Sarah Johnson", firstName: "Sarah", lastName: "Johnson", company: "Company A", department: "Leadership Dev", email: "sarah@example.com", status: 'Enabled' },
    { id: "p2", name: "Michael Chen", firstName: "Michael", lastName: "Chen", company: "Company B", department: "Engineering", email: "michael@example.com", status: 'Enabled' },
    { id: "p3", name: "Emily Rodriguez", firstName: "Emily", lastName: "Rodriguez", company: "Company A", department: "Human Resources", email: "emily@example.com", status: 'Enabled' },
    { id: "p4", name: "David Thompson", firstName: "David", lastName: "Thompson", company: "Company C", department: "Operations", email: "david@example.com", status: 'Enabled' }
  ]);

  const [forms, setForms] = useState<FormBlueprint[]>([
    { id: "f1", name: "Leadership Assessment Q2", created: "Jan 15, 2024", status: "Enabled", description: "Standard management metric evaluation frame targeting core operational values.", googleFormUrl: "" },
    { id: "f2", name: "Technical Skills Evaluation", created: "Dec 28, 2023", status: "Enabled", description: "Backend infrastructure logical competency assessment tool across development divisions.", googleFormUrl: "" },
    { id: "f3", name: "Soft Skills Feedback Form", created: "Dec 15, 2023", status: "Enabled", description: "Interpersonal group dynamics and internal workplace compatibility feedback array.", googleFormUrl: "" }
  ]);

  const [assignments, setAssignments] = useState<Assignment[]>([
    { id: "a1", name: "Q2 Leadership Self-Assessment", formName: "Leadership Assessment Q2", assignedTo: "Company A", dueDate: "Feb 28, 2024", rawDate: "2024-02-28", completedText: "36/50", status: "Enabled", published: true, publishedAt: "Jan 20, 2024" },
    { id: "a2", name: "Technical Skills Evaluation", formName: "Technical Skills Evaluation", assignedTo: "Company B", dueDate: "Feb 15, 2024", rawDate: "2024-02-15", completedText: "32/35", status: "Enabled", published: true, publishedAt: "Jan 25, 2024" },
    { id: "a3", name: "Soft Skills Workshop Feedback", formName: "Soft Skills Feedback Form", assignedTo: "Company A", dueDate: "Mar 10, 2024", rawDate: "2024-03-10", completedText: "15/28", status: "Enabled", published: false }
  ]);

  const [submissions, setSubmissions] = useState<Submission[]>([
    { id: "s1", participantName: "Sarah Johnson", program: "Leadership Training", assignmentName: "Module 1 Assessment", score: 85, status: "Completed", progress: 100 },
    { id: "s2", participantName: "Michael Chen", program: "Technical Skills", assignmentName: "Database Design", score: null, status: "In Progress", progress: 65 },
    { id: "s3", participantName: "Emily Rodriguez", program: "Soft Skills", assignmentName: "Communication Module", score: null, status: "Pending", progress: 0 },
    { id: "s4", participantName: "David Thompson", program: "Leadership Training", assignmentName: "Reflection Assignment", score: 92, status: "Completed", progress: 100 }
  ]);

  const [reports, setReports] = useState<Report[]>([
    { id: "r1", name: "Q1 Training Summary", type: "Comprehensive", generated: "Feb 10, 2024", format: "PDF", size: "2.4 MB" }
  ]);

  const [companies, setCompanies] = useState<Company[]>([
    { id: "c1", name: "Company A", industry: "Technology & Software", createdDate: "Jan 10, 2024", status: 'Enabled' },
    { id: "c2", name: "Company B", industry: "Banking & Finance", createdDate: "Feb 05, 2024", status: 'Enabled' },
    { id: "c3", name: "Company C", industry: "Logistics & Supply Chain", createdDate: "Mar 12, 2024", status: 'Enabled' }
  ]);

  const [folders, setFolders] = useState<CollectionFolder[]>([
    { id: "fol_1", name: "Q1 Tech Onboarding", description: "Technical competencies initialization bundle.", createdDate: "Jan 05, 2024", assignmentIds: ["a2"] },
    { id: "fol_2", name: "Leadership Development Framework", description: "Management metrics track validation cluster.", createdDate: "Jan 12, 2024", assignmentIds: ["a1", "a3"] }
  ]);

  // UI State
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');

  // Modal States
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isParticipantOpen, setIsParticipantOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);

  // View States
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [viewingForm, setViewingForm] = useState<FormBlueprint | null>(null);
  const [viewingParticipant, setViewingParticipant] = useState<Participant | null>(null);
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(null);
  const [activeFolderView, setActiveFolderView] = useState<CollectionFolder | null>(null);

  // Edit States
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [editingForm, setEditingForm] = useState<FormBlueprint | null>(null);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);
  const [editingFolder, setEditingFolder] = useState<CollectionFolder | null>(null);

  // Settings
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [platformName, setPlatformName] = useState('Workinspires');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoReports, setAutoReports] = useState(false);
  const [timezone, setTimezone] = useState('Asia/Kuala_Lumpur');

  useEffect(() => {
    let cancelled = false;

    async function loadDatabaseRecords() {
      const [companyRows, participantRows, formRows, assignmentRows, submissionRows] = await Promise.all([
        safeApiGet<Company[]>('/api/companies', companies),
        safeApiGet<Participant[]>('/api/participants', participants),
        safeApiGet<FormBlueprint[]>('/api/forms', forms),
        safeApiGet<Assignment[]>('/api/assignments', assignments),
        safeApiGet<Submission[]>('/api/submissions', submissions),
      ]);

      if (cancelled) return;

      setCompanies(companyRows);
      setParticipants(participantRows);
      setForms(formRows);
      setAssignments(assignmentRows);
      setSubmissions(submissionRows);
    }

    loadDatabaseRecords();

    return () => {
      cancelled = true;
    };
  }, []);

  const value: AppContextType = {
    participants, setParticipants,
    forms, setForms,
    assignments, setAssignments,
    submissions, setSubmissions,
    reports, setReports,
    companies, setCompanies,
    folders, setFolders,
    globalSearchQuery, setGlobalSearchQuery,
    programFilter, setProgramFilter,
    statusFilter, setStatusFilter,
    companyFilter, setCompanyFilter,
    isAssignmentOpen, setIsAssignmentOpen,
    isFormOpen, setIsFormOpen,
    isParticipantOpen, setIsParticipantOpen,
    isReportOpen, setIsReportOpen,
    isCompanyOpen, setIsCompanyOpen,
    isFolderOpen, setIsFolderOpen,
    isSubmissionOpen, setIsSubmissionOpen,
    viewingAssignment, setViewingAssignment,
    viewingForm, setViewingForm,
    viewingParticipant, setViewingParticipant,
    viewingCompany, setViewingCompany,
    viewingSubmission, setViewingSubmission,
    activeFolderView, setActiveFolderView,
    editingAssignment, setEditingAssignment,
    editingForm, setEditingForm,
    editingParticipant, setEditingParticipant,
    editingCompany, setEditingCompany,
    editingSubmission, setEditingSubmission,
    editingFolder, setEditingFolder,
    settingsSaved, setSettingsSaved,
    platformName, setPlatformName,
    notificationsEnabled, setNotificationsEnabled,
    autoReports, setAutoReports,
    timezone, setTimezone,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }
  return context;
}
