// src/context/DashboardContext.tsx
"use client";

import React, { createContext, useContext, useState, useMemo } from 'react';

export type PageType = 'dashboard' | 'assignments' | 'collections' | 'forms' | 'results' | 'participants' | 'companies' | 'reports' | 'settings';

export interface Participant { id: string; name: string; firstName: string; lastName: string; company: string; department: string; email: string; status: 'Enabled' | 'Disabled'; }
export interface FormBlueprint { id: string; name: string; created: string; status: 'Enabled' | 'Disabled'; description?: string; googleFormUrl?: string; questionCount?: number; type?: string; }
export interface Assignment { id: string; name: string; formName: string; assignedTo: string; dueDate: string; completedText: string; status: 'Enabled' | 'Disabled'; rawDate?: string; published: boolean; publishedAt?: string; }
export interface Submission { id: string; participantName: string; program: string; assignmentName: string; score: number | null; status: 'Completed' | 'In Progress' | 'Pending'; progress: number; }
export interface Report { id: string; name: string; type: string; generated: string; format: string; size: string; }
export interface Company { id: string; name: string; industry?: string; createdDate: string; status: 'Enabled' | 'Disabled'; }
export interface CollectionFolder { id: string; name: string; description: string; createdDate: string; assignmentIds: string[]; }

interface DashboardContextType {
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  programFilter: string;
  setProgramFilter: (filter: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  companyFilter: string;
  setCompanyFilter: (filter: string) => void;
  companiesData: Company[];
  setCompaniesData: React.Dispatch<React.SetStateAction<Company[]>>;
  participants: Participant[];
  setParticipants: React.Dispatch<React.SetStateAction<Participant[]>>;
  forms: FormBlueprint[];
  setForms: React.Dispatch<React.SetStateAction<FormBlueprint[]>>;
  assignments: Assignment[];
  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
  submissions: Submission[];
  setSubmissions: React.Dispatch<React.SetStateAction<Submission[]>>;
  reports: Report[];
  setReports: React.Dispatch<React.SetStateAction<Report[]>>;
  folders: CollectionFolder[];
  setFolders: React.Dispatch<React.SetStateAction<CollectionFolder[]>>;
  platformName: string;
  setPlatformName: React.Dispatch<React.SetStateAction<string>>;
  notificationsEnabled: boolean;
  setNotificationsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  autoReports: boolean;
  setAutoReports: React.Dispatch<React.SetStateAction<boolean>>;
  timezone: string;
  setTimezone: React.Dispatch<React.SetStateAction<string>>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');

  const [companiesData, setCompaniesData] = useState<Company[]>([
    { id: "c1", name: "Company A", industry: "Technology & Software", createdDate: "Jan 10, 2024", status: 'Enabled' },
    { id: "c2", name: "Company B", industry: "Banking & Finance", createdDate: "Feb 05, 2024", status: 'Enabled' },
    { id: "c3", name: "Company C", industry: "Logistics & Supply Chain", createdDate: "Mar 12, 2024", status: 'Enabled' }
  ]);

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

  const [folders, setFolders] = useState<CollectionFolder[]>([
    { id: "fol_1", name: "Q1 Tech Onboarding", description: "Technical competencies initialization bundle.", createdDate: "Jan 05, 2024", assignmentIds: ["a2"] },
    { id: "fol_2", name: "Leadership Development Framework", description: "Management metrics track validation cluster.", createdDate: "Jan 12, 2024", assignmentIds: ["a1", "a3"] }
  ]);

  const [platformName, setPlatformName] = useState('Workinspires');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoReports, setAutoReports] = useState(false);
  const [timezone, setTimezone] = useState('Asia/Kuala_Lumpur');

  return (
    <DashboardContext.Provider value={{
      currentPage, setCurrentPage, globalSearchQuery, setGlobalSearchQuery,
      programFilter, setProgramFilter, statusFilter, setStatusFilter, companyFilter, setCompanyFilter,
      companiesData, setCompaniesData, participants, setParticipants, forms, setForms,
      assignments, setAssignments, submissions, setSubmissions, reports, setReports, folders, setFolders,
      platformName, setPlatformName, notificationsEnabled, setNotificationsEnabled, autoReports, setAutoReports, timezone, setTimezone
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useDashboard must be used within a DashboardProvider');
  return context;
}