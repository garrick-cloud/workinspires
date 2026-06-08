"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import type { FormBlueprint } from '@/types/form';
import type { FormResponse } from '@/types/submission';
import { apiGet } from '@/lib/apiClient';

export type PageType = 'dashboard' | 'assignments' | 'collections' | 'forms' | 'results' | 'participants' | 'companies' | 'reports' | 'settings';

export interface Participant { id: string; name: string; firstName: string; lastName: string; company: string; department: string; email: string; status: 'Enabled' | 'Disabled'; }
export interface Assignment {
  id: string;
  name: string;
  formName: string;
  formBlueprintId: string;
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
  participantName: string;
  program: string;
  assignmentName: string;
  score: number | null;
  status: 'Completed' | 'In Progress' | 'Pending' | 'Not Started' | 'Submitted';
  progress?: number;
  adminComment?: string | null;
  reviewedAt?: string | null;
  formResponseId?: string | null;
}
export interface Report { id: string; name: string; type: string; generated: string; format: string; size: string; }
export interface Company { id: string; name: string; industry?: string; createdDate: string; status: 'Enabled' | 'Disabled' | 'draft' | 'pilot' | 'active'; }
export interface CollectionFolder { id: string; name: string; description: string; createdDate: string; assignmentIds: string[]; }
export interface PlatformSettings { platformName: string; notificationsEnabled: boolean; autoReports: boolean; timezone: string; }

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
  formResponses: FormResponse[];
  setFormResponses: React.Dispatch<React.SetStateAction<FormResponse[]>>;
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
  hydrated: boolean;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const defaultForms: FormBlueprint[] = [];
const defaultAssignments: Assignment[] = [];
const defaultCompanies: Company[] = [];
const defaultParticipants: Participant[] = [];
const defaultSubmissions: Submission[] = [];
const defaultReports: Report[] = [];

async function safeApiGet<T>(path: string, fallback: T): Promise<T> {
  try {
    return await apiGet<T>(path);
  } catch (error) {
    console.error(`Failed to load ${path}.`, error);
    return fallback;
  }
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');

  const [companiesData, setCompaniesData] = useState<Company[]>(defaultCompanies);

  const [participants, setParticipants] = useState<Participant[]>(defaultParticipants);

  const [forms, setForms] = useState<FormBlueprint[]>(defaultForms);
  const [assignments, setAssignments] = useState<Assignment[]>(defaultAssignments);
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);

  const [submissions, setSubmissions] = useState<Submission[]>(defaultSubmissions);

  const [reports, setReports] = useState<Report[]>(defaultReports);

  const [folders, setFolders] = useState<CollectionFolder[]>([]);

  const [platformName, setPlatformName] = useState('Workinspires');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoReports, setAutoReports] = useState(false);
  const [timezone, setTimezone] = useState('Asia/Kuala_Lumpur');

  useEffect(() => {
    let cancelled = false;
    const tenantMatch = pathname.match(/^\/app\/([^/]+)/);

    if (tenantMatch) {
      setHydrated(true);
      return () => {
        cancelled = true;
      };
    }

    async function loadDashboardData() {
      try {
        const [companies, participantRows, formRows, assignmentRows, submissionRows, responseRows, settings] = await Promise.all([
          safeApiGet<Company[]>('/api/companies', []),
          safeApiGet<Participant[]>('/api/participants', []),
          safeApiGet<FormBlueprint[]>('/api/forms', []),
          safeApiGet<Assignment[]>('/api/assignments', []),
          safeApiGet<Submission[]>('/api/submissions', []),
          safeApiGet<FormResponse[]>('/api/form-responses', []),
          safeApiGet<PlatformSettings>('/api/settings', {
            platformName: 'Workinspires',
            notificationsEnabled: true,
            autoReports: false,
            timezone: 'Asia/Kuala_Lumpur',
          }),
        ]);

        if (cancelled) return;

        setCompaniesData(companies);
        setParticipants(participantRows);
        setForms(formRows);
        setAssignments(assignmentRows);
        setSubmissions(submissionRows);
        setFormResponses(responseRows);
        setPlatformName(settings.platformName);
        setNotificationsEnabled(settings.notificationsEnabled);
        setAutoReports(settings.autoReports);
        setTimezone(settings.timezone);
      } catch (error) {
        console.error('Failed to load dashboard data from API.', error);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <DashboardContext.Provider value={{
      currentPage, setCurrentPage, globalSearchQuery, setGlobalSearchQuery,
      programFilter, setProgramFilter, statusFilter, setStatusFilter, companyFilter, setCompanyFilter,
      companiesData, setCompaniesData, participants, setParticipants, forms, setForms,
      assignments, setAssignments, submissions, setSubmissions, formResponses, setFormResponses,
      reports, setReports, folders, setFolders,
      platformName, setPlatformName, notificationsEnabled, setNotificationsEnabled,
      autoReports, setAutoReports, timezone, setTimezone, hydrated,
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
