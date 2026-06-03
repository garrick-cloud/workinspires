"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Added for cross-feature path routing
import {
  Users, CheckCircle, Star, Clock, Home, ListTodo,
  FileSpreadsheet, BarChart3, Settings, Plus, Search,
  Download, Trash2, GraduationCap, SlidersHorizontal, Check, X, Edit2, Eye, FileText, Mail, Building2, ArrowRight, EyeOff, Bell, Database, Globe, Save, RefreshCw,
  Folder, FolderPlus, FolderOpen, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/apiClient';

import dynamic from 'next/dynamic';
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });
const LineChart = dynamic(() => import('recharts').then(m => m.LineChart), { ssr: false });
const Line = dynamic(() => import('recharts').then(m => m.Line), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });

// Removed 'forms' option from local page tracking options block list parameters
type PageType = 'dashboard' | 'assignments' | 'collections' | 'results' | 'participants' | 'companies' | 'reports' | 'settings';

interface Participant { id: string; name: string; firstName: string; lastName: string; company: string; department: string; email: string; status: 'Enabled' | 'Disabled'; }
interface FormBlueprint {
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
interface Assignment { id: string; name: string; formName: string; formBlueprintId?: string; assignedTo: string; dueDate: string; completedText: string; status: 'Enabled' | 'Disabled'; rawDate?: string; published: boolean; publishedAt?: string; }
interface Submission { id: string; participantName: string; program: string; assignmentName: string; score: number | null; status: 'Completed' | 'In Progress' | 'Pending'; progress: number; }
interface Report { id: string; name: string; type: string; generated: string; format: string; size: string; }
interface Company { id: string; name: string; industry?: string; createdDate: string; status: 'Enabled' | 'Disabled'; }
interface CollectionFolder { id: string; name: string; description: string; createdDate: string; assignmentIds: string[]; }
interface PlatformSettings { platformName: string; notificationsEnabled: boolean; autoReports: boolean; timezone: string; }

function SubmissionStatusBadge({ status }: { status: Submission['status'] }) {
  const styles: Record<Submission['status'], string> = {
    Completed: 'bg-emerald-950/30 text-emerald-400 border-emerald-900/40',
    'In Progress': 'bg-amber-950/30 text-amber-400 border-amber-900/40',
    Pending: 'bg-slate-900/40 text-slate-400 border-slate-700/50',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold ${styles[status]}`}>
      {status}
    </span>
  );
}

export default function WorkinspiresDashboard() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Filters — used on Results page
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  // Company filter for Participants — reset when navigating away
  const [companyFilter, setCompanyFilter] = useState<string>('all');

  // ==========================================
  // CORE STATE REGISTRIES
  // ==========================================
  const [companiesData, setCompaniesData] = useState<Company[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [forms, setForms] = useState<FormBlueprint[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [folders, setFolders] = useState<CollectionFolder[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadRecords() {
      try {
        const [companyRows, participantRows, formRows, assignmentRows, settings] = await Promise.all([
          apiGet<Company[]>('/api/companies'),
          apiGet<Participant[]>('/api/participants'),
          apiGet<FormBlueprint[]>('/api/forms'),
          apiGet<Assignment[]>('/api/assignments'),
          apiGet<PlatformSettings>('/api/settings'),
        ]);

        if (cancelled) return;

        setCompaniesData(companyRows);
        setParticipants(participantRows);
        setForms(formRows);
        setAssignments(assignmentRows);
        setPlatformName(settings.platformName);
        setNotificationsEnabled(settings.notificationsEnabled);
        setAutoReports(settings.autoReports);
        setTimezone(settings.timezone);
      } catch (error) {
        console.error('Failed to load database records.', error);
      }
    }

    loadRecords();

    return () => {
      cancelled = true;
    };
  }, []);

  // Modal open states
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isParticipantOpen, setIsParticipantOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [isFolderOpen, setIsFolderOpen] = useState(false);

  // View-only overlay states
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [viewingForm, setViewingForm] = useState<FormBlueprint | null>(null);
  const [viewingParticipant, setViewingParticipant] = useState<Participant | null>(null);
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(null);
  const [activeFolderView, setActiveFolderView] = useState<CollectionFolder | null>(null);

  // Edit states
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [editingForm, setEditingForm] = useState<FormBlueprint | null>(null);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);
  const [editingFolder, setEditingFolder] = useState<CollectionFolder | null>(null);
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);

  // Settings state
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [platformName, setPlatformName] = useState('Workinspires');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoReports, setAutoReports] = useState(false);
  const [timezone, setTimezone] = useState('Asia/Kuala_Lumpur');

  // ==========================================
  // COMPUTED VALUES
  // ==========================================
  const activeCompaniesOptions = useMemo(() => companiesData.filter(c => c.status === 'Enabled'), [companiesData]);
  const activeFormsOptions = useMemo(() => forms.filter(f => f.status === 'Enabled'), [forms]);

  const folderCollectedAssignmentIds = useMemo(() => {
    return folders.reduce((acc, folder) => [...acc, ...folder.assignmentIds], [] as string[]);
  }, [folders]);

  const metrics = useMemo(() => {
    const totalParts = participants.length;
    const completedCount = submissions.filter(s => s.status === 'Completed').length;
    const completionRate = submissions.length > 0 ? Math.round((completedCount / submissions.length) * 100) : 0;
    const scores = submissions.filter(s => s.status === 'Completed' && s.score !== null).map(s => s.score as number);
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "0.0";
    const pendingTasks = submissions.filter(s => s.status !== 'Completed').length;
    return { totalParts, completionRate, avgScore, pendingTasks };
  }, [participants, submissions]);

  const companyStats = useMemo(() => {
    return companiesData.map(company => {
      const roster = participants.filter(p => p.company === company.name);
      return { ...company, count: roster.length, completed: Math.round(Math.random() * 10 + 5) };
    });
  }, [companiesData, participants]);

  const uniquePrograms = useMemo(() => ['all', ...Array.from(new Set(submissions.map(s => s.program)))], [submissions]);
  const uniqueStatuses = ['all', 'Completed', 'In Progress', 'Pending'];

  const filteredSubmissions = useMemo(() => {
    return submissions
      .filter(s => programFilter === 'all' || s.program === programFilter)
      .filter(s => statusFilter === 'all' || s.status === statusFilter)
      .filter(s => globalSearchQuery === '' || matchQuery(s.participantName) || matchQuery(s.assignmentName) || matchQuery(s.program));
  }, [submissions, programFilter, statusFilter, globalSearchQuery]);

  const trendData = [
    { name: 'Week 1', rate: 45 }, { name: 'Week 2', rate: 52 }, { name: 'Week 3', rate: 58 }, { name: 'Week 4', rate: 65 },
    { name: 'Week 5', rate: 68 }, { name: 'Week 6', rate: 70 }, { name: 'Week 7', rate: 71 }, { name: 'Week 8', rate: 72 }
  ];

  const distData = [
    { score: '60-70', count: 18 }, { score: '70-80', count: 52 }, { score: '80-90', count: 95 }, { score: '90-100', count: 63 }
  ];

  // ==========================================
  // HELPERS
  // ==========================================
  const formatDate = (dateStr: string) => {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const [year, month, day] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(month) - 1]} ${day}, ${year}`;
  };

  const matchQuery = (text: string) => text.toLowerCase().includes(globalSearchQuery.toLowerCase());

  const navigate = (page: PageType) => {
    if (currentPage === 'participants' && page !== 'participants') setCompanyFilter('all');
    setCurrentPage(page);
  };

  const pageTitle: Record<PageType, string> = {
    dashboard: 'Dashboard', assignments: 'Assignments', collections: 'Collections',
    results: 'Results', participants: 'Participants', companies: 'Companies',
    reports: 'Reports', settings: 'Settings'
  };

  // ==========================================
  // CRUD HANDLERS
  // ==========================================
  const handleSaveFolder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = (data.get('folderName') as string || '').trim();
    const description = (data.get('folderDesc') as string || '').trim();
    const selectedAssignmentIds = Array.from(data.getAll('assignments') as string[]);

    if (!name) { alert("Please provide a folder collection name."); return; }

    if (editingFolder) {
      setFolders(folders.map(f => f.id === editingFolder.id ? { 
        ...f, name, description, assignmentIds: selectedAssignmentIds 
      } : f));
      if (activeFolderView && activeFolderView.id === editingFolder.id) {
        setActiveFolderView({ ...activeFolderView, name, description, assignmentIds: selectedAssignmentIds });
      }
      setEditingFolder(null);
    } else {
      const newFolder: CollectionFolder = {
        id: `fol_${Date.now()}`,
        name, description,
        createdDate: formatDate(new Date().toISOString().split('T')[0]),
        assignmentIds: selectedAssignmentIds
      };
      setFolders([newFolder, ...folders]);
    }
    setIsFolderOpen(false);
  };

  const deleteFolder = (id: string) => {
    if (confirm("Delete this collection folder? Linked assignments inside will return to the root assignments tab.")) {
      setFolders(folders.filter(f => f.id !== id));
      setActiveFolderView(null);
    }
  };

  const handleSaveAssignment = async (e: React.FormEvent<HTMLFormElement>, publish = false) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = (data.get('name') as string || '').trim();
    const formName = data.get('formName') as string;
    const target = data.get('target') as string;
    const date = data.get('date') as string;
    const status = (data.get('status') as 'Enabled' | 'Disabled') || 'Enabled';
    if (!name || !formName || !target || !date) { alert("Please fill in all required fields."); return; }

    const targetParticipants = participants.filter(p => p.company === target && p.status === 'Enabled');
    const selectedForm = forms.find(f => f.name === formName);

    if (editingAssignment) {
      const wasPublished = editingAssignment.published;
      const nowPublishing = publish && !wasPublished;
      const savedAssignment = await apiPut<Assignment>(`/api/assignments/${editingAssignment.id}`, {
        ...editingAssignment, name, formName, formBlueprintId: editingAssignment.formBlueprintId ?? selectedForm?.id, assignedTo: target,
        dueDate: date.includes('-') ? formatDate(date) : date, rawDate: date, status,
        published: publish || wasPublished,
      });
      setAssignments(assignments.map(a => a.id === editingAssignment.id ? savedAssignment : a));
      if (nowPublishing) alert(`Assignment published! Email notifications sent to ${targetParticipants.length} participant(s) at ${target}.`);
      setEditingAssignment(null);
    } else {
      const newAsg = await apiPost<Assignment>('/api/assignments', {
        id: `asg_${Date.now()}`, name, formName, assignedTo: target,
        formBlueprintId: selectedForm?.id,
        rawDate: date,
        totalCount: targetParticipants.length,
        status: "Enabled", published: publish,
      });
      setAssignments([newAsg, ...assignments]);
      if (publish) alert(`Assignment published! Email notifications sent to ${targetParticipants.length} participant(s) at ${target}.`);
    }
    setIsAssignmentOpen(false);
  };

  const handlePublishAssignment = async (id: string) => {
    const asg = assignments.find(a => a.id === id);
    if (!asg) return;
    const targetParticipants = participants.filter(p => p.company === asg.assignedTo && p.status === 'Enabled');
    if (confirm(`Publish "${asg.name}" to ${targetParticipants.length} participant(s) at ${asg.assignedTo}?\n\nThis will send email notifications to:\n${targetParticipants.map(p => `• ${p.name} (${p.email})`).join('\n')}`)) {
      const savedAssignment = await apiPut<Assignment>(`/api/assignments/${id}`, { ...asg, published: true });
      setAssignments(assignments.map(a => a.id === id ? savedAssignment : a));
    }
  };

  const navBtn = (page: PageType, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => navigate(page)}
      className={`w-full text-left flex items-center gap-3.5 px-3.5 py-3 rounded-lg text-[14px] font-medium transition-all ${currentPage === page
        ? 'bg-gradient-to-r from-[#3b82f6] to-transparent bg-[#3b82f6]/20 text-[#3b82f6] border-l-[3px] border-[#3b82f6] shadow-[inset_0_0_15px_rgba(59,130,246,0.1)]'
        : 'text-[#cbd5e1] border-l-[3px] border-transparent hover:bg-[#475569] hover:text-white'}`}
    >
      {icon} {label}
    </button>
  );


  const deleteAssignment = async (id: string) => {
    if (confirm("Remove this assignment?")) {
      await apiDelete(`/api/assignments/${id}`);
      setAssignments(assignments.filter(a => a.id !== id));
      setFolders(folders.map(f => ({ ...f, assignmentIds: f.assignmentIds.filter(aid => aid !== id) })));
    }
  };

  const handleSaveForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = (data.get('name') as string || '').trim();
    const description = data.get('description') as string;
    const googleFormUrl = (data.get('googleFormUrl') as string || '').trim();
    const status = (data.get('status') as 'Enabled' | 'Disabled') || 'Enabled';
    if (!name) { alert("Please fill in the form name."); return; }
    if (editingForm) {
      const savedForm = await apiPut<FormBlueprint>(`/api/forms/${editingForm.id}`, {
        ...editingForm,
        name,
        description,
        googleFormUrl,
        status,
        structure: editingForm.structure ?? { formName: name, description, fields: [] },
      });
      setForms(forms.map(f => f.id === editingForm.id ? savedForm : f));
      setEditingForm(null);
    } else {
      const savedForm = await apiPost<FormBlueprint>('/api/forms', {
        id: `form_${Date.now()}`,
        name,
        description,
        googleFormUrl,
        created: formatDate(new Date().toISOString().split('T')[0]),
        status: "Enabled",
        structure: { formName: name, description, fields: [] },
      });
      setForms([savedForm, ...forms]);
    }
    setIsFormOpen(false);
  };

  const deleteFormBlueprint = async (id: string) => {
    if (confirm("Delete this form blueprint?")) {
      await apiDelete(`/api/forms/${id}`);
      setForms(forms.filter(f => f.id !== id));
    }
  };

  const handleSaveParticipant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const firstName = (data.get('firstName') as string || '').trim();
    const lastName = (data.get('lastName') as string || '').trim();
    const email = (data.get('email') as string || '').trim();
    const department = (data.get('department') as string || '').trim() || 'General Operations';
    const company = data.get('companySelect') as string;
    const status = (data.get('status') as 'Enabled' | 'Disabled') || 'Enabled';
    if (!firstName || !lastName || !email || !company) { alert("Please fill in all required fields."); return; }
    if (editingParticipant) {
      const savedParticipant = await apiPut<Participant>(`/api/participants/${editingParticipant.id}`, {
        ...editingParticipant, firstName, lastName, name: `${firstName} ${lastName}`, email, department, company, status
      });
      setParticipants(participants.map(p => p.id === editingParticipant.id ? savedParticipant : p));
      setEditingParticipant(null);
    } else {
      const savedParticipant = await apiPost<Participant>('/api/participants', { id: `part_${Date.now()}`, firstName, lastName, name: `${firstName} ${lastName}`, email, department, company, status: "Enabled" });
      setParticipants([savedParticipant, ...participants]);
    }
    setIsParticipantOpen(false);
  };

  const deleteParticipant = async (id: string) => {
    if (confirm("Remove this participant?")) {
      await apiDelete(`/api/participants/${id}`);
      setParticipants(participants.filter(p => p.id !== id));
    }
  };

  const handleSaveCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = (data.get('name') as string || '').trim();
    const industry = (data.get('industry') as string || '').trim() || 'General Enterprise';
    const status = (data.get('status') as 'Enabled' | 'Disabled') || 'Enabled';
    if (!name) { alert("Company name is required."); return; }
    if (editingCompany) {
      const savedCompany = await apiPut<Company>(`/api/companies/${editingCompany.id}`, { ...editingCompany, name, industry, status });
      setParticipants(participants.map(p => p.company === editingCompany.name ? { ...p, company: savedCompany.name } : p));
      setCompaniesData(companiesData.map(c => c.id === editingCompany.id ? savedCompany : c));
      setEditingCompany(null);
    } else {
      const savedCompany = await apiPost<Company>('/api/companies', { id: `c_${Date.now()}`, name, industry, createdDate: formatDate(new Date().toISOString().split('T')[0]), status: "Enabled" });
      setCompaniesData([savedCompany, ...companiesData]);
    }
    setIsCompanyOpen(false);
  };

  const deleteCompanyEntity = async (id: string, name: string) => {
    const clusterCount = participants.filter(p => p.company === name).length;
    if (clusterCount > 0) { alert(`Cannot delete "${name}" — ${clusterCount} participants are still linked.`); return; }
    if (confirm(`Delete company "${name}"?`)) {
      await apiDelete(`/api/companies/${id}`);
      setCompaniesData(companiesData.filter(c => c.id !== id));
    }
  };

  const handleSaveSubmission = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const participantName = data.get('participantName') as string;
    const program = (data.get('program') as string || '').trim();
    const assignmentName = (data.get('assignmentName') as string || '').trim();
    const scoreRaw = data.get('score') as string;
    const score = scoreRaw !== '' ? parseInt(scoreRaw) : null;
    const status = data.get('status') as 'Completed' | 'In Progress' | 'Pending';
    const progress = status === 'Completed' ? 100 : status === 'Pending' ? 0 : parseInt(data.get('progress') as string) || 0;
    if (!participantName || !program || !assignmentName) { alert("Please fill in all required fields."); return; }
    if (editingSubmission) {
      setSubmissions(submissions.map(s => s.id === editingSubmission.id ? { ...s, participantName, program, assignmentName, score, status, progress } : s));
      setEditingSubmission(null);
    } else {
      setSubmissions([{ id: `sub_${Date.now()}`, participantName, program, assignmentName, score, status, progress }, ...submissions]);
    }
    setIsSubmissionOpen(false);
  };

  const deleteSubmission = (id: string) => {
    if (confirm("Remove this result entry?")) setSubmissions(submissions.filter(s => s.id !== id));
  };

  const handleGenerateReport = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = (data.get('name') as string || '').trim();
    const type = data.get('type') as string;
    const format = (data.get('format') as string) || 'PDF';
    if (!name || !type) { alert("Please fill in report name and type."); return; }
    const newReport: Report = {
      id: `r_${Date.now()}`,
      name, type,
      generated: formatDate(new Date().toISOString().split('T')[0]),
      format, size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`
    };
    setReports([newReport, ...reports]);
    setIsReportOpen(false);
  };

  const deleteReport = (id: string) => {
    if (confirm("Delete this report?")) setReports(reports.filter(r => r.id !== id));
  };

  const handleSaveSettings = async () => {
    const settings = await apiPut<PlatformSettings>('/api/settings', {
      platformName,
      notificationsEnabled,
      autoReports,
      timezone,
    });

    setPlatformName(settings.platformName);
    setNotificationsEnabled(settings.notificationsEnabled);
    setAutoReports(settings.autoReports);
    setTimezone(settings.timezone);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  // ==========================================
  // PER-PAGE ACTION BUTTON
  // ==========================================
  const PageAction = () => {
    const btnClass = "flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow";
    if (currentPage === 'assignments') return (
      <button className={btnClass} onClick={() => { setEditingAssignment(null); setIsAssignmentOpen(true); }}>
        <Plus className="h-4 w-4" /> New Assignment
      </button>
    );
    if (currentPage === 'collections') return (
      <button className={btnClass} onClick={() => { setEditingFolder(null); setIsFolderOpen(true); }}>
        <FolderPlus className="h-4 w-4" /> New Folder
      </button>
    );
    if (currentPage === 'participants') return (
      <button className={btnClass} onClick={() => { setEditingParticipant(null); setIsParticipantOpen(true); }}>
        <Plus className="h-4 w-4" /> New Participant
      </button>
    );
    if (currentPage === 'companies') return (
      <button className={btnClass} onClick={() => { setEditingCompany(null); setIsCompanyOpen(true); }}>
        <Plus className="h-4 w-4" /> New Company
      </button>
    );
    if (currentPage === 'results') return (
      <button className={btnClass} onClick={() => { setEditingSubmission(null); setIsSubmissionOpen(true); }}>
        <Plus className="h-4 w-4" /> New Result
      </button>
    );
    if (currentPage === 'reports') return (
      <button className={btnClass} onClick={() => setIsReportOpen(true)}>
        <Plus className="h-4 w-4" /> Generate Report
      </button>
    );
    return null;
  };

  return (
    <div className="grid grid-cols-[280px_1fr] h-screen bg-[#0f172a] text-[#f1f5f9] overflow-hidden antialiased select-none font-sans">

      {/* SIDEBAR */}
      <aside className="bg-gradient-to-b from-[#0f172a] to-[#1a1f35] border-r border-[#475569] p-6 flex flex-col justify-between shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
        <div className="space-y-10">
          <div className="flex items-center gap-3 text-xl font-bold tracking-tight pb-6 border-b border-[#475569]">
            <GraduationCap className="h-7 w-7 text-[#3b82f6]" style={{ filter: "drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))" }} />
            <span className="tracking-tight text-white font-bold">Workinspires</span>
          </div>

          <nav className="space-y-6">
            <div className="space-y-1">
              <p className="text-[10px] font-semibold tracking-widest text-[#94a3b8]/50 uppercase px-3 mb-3">MAIN</p>
              {navBtn('dashboard', <Home className="h-[18px] w-[18px]" />, 'Dashboard')}
              {navBtn('assignments', <ListTodo className="h-[18px] w-[18px]" />, 'Assignments')}
              {navBtn('collections', <Folder className="h-[18px] w-[18px]" />, 'Collections')}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-semibold tracking-widest text-[#94a3b8]/50 uppercase px-3 mb-3">MANAGEMENT</p>
              
              {/* 🌐 INTERACTIVE SIDEBAR ROUTING LINK SWITCH */}
              <button
                onClick={() => router.push('/forms')}
                className="w-full text-left flex items-center gap-3.5 px-3.5 py-3 rounded-lg text-[14px] font-medium transition-all text-[#cbd5e1] border-l-[3px] border-transparent hover:bg-[#475569] hover:text-white"
              >
                <FileSpreadsheet className="h-[18px] w-[18px]" /> Form Builder
              </button>

              {navBtn('results', <BarChart3 className="h-[18px] w-[18px]" />, 'Results')}
              {navBtn('participants', <Users className="h-[18px] w-[18px]" />, 'Participants')}
              {navBtn('companies', <Building2 className="h-[18px] w-[18px]" />, 'Companies')}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-semibold tracking-widest text-[#94a3b8]/50 uppercase px-3 mb-3">SYSTEM</p>
              {navBtn('reports', <FileText className="h-[18px] w-[18px]" />, 'Reports')}
              {navBtn('settings', <Settings className="h-[18px] w-[18px]" />, 'Settings')}
            </div>
          </nav>
        </div>

        <div className="bg-[#334155] border border-[#475569] p-3 rounded-lg flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] flex items-center justify-center font-bold text-sm text-white">AD</div>
          <div>
            <p className="text-xs font-semibold text-[#f1f5f9]">Admin</p>
            <p className="text-[11px] text-[#94a3b8]">Platform Admin</p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex flex-col overflow-hidden h-screen w-full">
        <header className="bg-[#1e293b] border-b border-[#475569] px-8 py-6 flex justify-between items-center shadow-md z-50">
          <div className="flex items-center gap-3">
            {currentPage === 'collections' ? <Folder className="h-7 w-7 text-[#3b82f6]" /> : <Home className="h-7 w-7 text-[#3b82f6]" />}
            <h1 className="text-2xl font-bold tracking-tight text-white">{pageTitle[currentPage]}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-4 py-2.5 border border-[#475569] rounded-lg bg-[#334155] focus-within:border-[#3b82f6] transition-colors">
              <Search className="h-3.5 w-3.5 text-[#94a3b8]" />
              <input value={globalSearchQuery} onChange={(e) => setGlobalSearchQuery(e.target.value)} placeholder="Search records..." className="bg-transparent border-none text-xs text-[#f1f5f9] placeholder-[#94a3b8] outline-none w-64" />
            </div>
            <PageAction />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#0f172a]">

          {/* DASHBOARD */}
          {currentPage === 'dashboard' && (
            <div className="space-y-8 duration-300 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Participants', value: metrics.totalParts, icon: <Users className="h-6 w-6 text-[#3b82f6]" />, sub: 'Unified active directory', subColor: '#10b981' },
                  { label: 'Completion Rate', value: `${metrics.completionRate}%`, icon: <CheckCircle className="h-6 w-6 text-[#3b82f6]" />, sub: 'Transacted completion sync', subColor: '#10b981' },
                  { label: 'Average Score', value: metrics.avgScore, icon: <Star className="h-6 w-6 text-[#3b82f6]" />, sub: 'Graded metrics array', subColor: '#10b981' },
                  { label: 'Pending Tasks', value: metrics.pendingTasks, icon: <Clock className="h-6 w-6 text-[#3b82f6]" />, sub: 'Actions awaiting review', subColor: '#ef4444' }
                ].map(m => (
                  <div key={m.label} className="bg-gradient-to-br from-[#1e293b] to-[#334155] border border-[#475569] rounded-xl p-6">
                    <div className="flex justify-between items-start mb-4"><h3 className="text-[12px] font-semibold text-[#94a3b8] uppercase tracking-wider">{m.label}</h3>{m.icon}</div>
                    <p className="text-3xl font-bold text-[#3b82f6] mb-2">{m.value}</p>
                    <p className="text-xs flex items-center gap-1" style={{ color: m.subColor }}><SlidersHorizontal className="h-3 w-3" /> {m.sub}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-[#1e293b] to-[#334155] border border-[#475569] rounded-xl p-6">
                  <h3 className="text-base font-bold text-[#f1f5f9] mb-6 flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> Completion Trend</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.2)" vertical={false} />
                        <XAxis dataKey="name" stroke="#cbd5e1" fontSize={12} />
                        <YAxis stroke="#cbd5e1" fontSize={12} unit="%" />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#475569', borderRadius: '8px' }} />
                        <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#1e293b] to-[#334155] border border-[#475569] rounded-xl p-6">
                  <h3 className="text-base font-bold text-[#f1f5f9] mb-6 flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> Score Distribution</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={distData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.2)" vertical={false} />
                        <XAxis dataKey="score" stroke="#cbd5e1" fontSize={12} />
                        <YAxis stroke="#cbd5e1" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#475569', borderRadius: '8px' }} />
                        <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ASSIGNMENTS */}
          {currentPage === 'assignments' && (
            <div className="bg-gradient-to-br from-[#1e293b] to-[#334155] border border-[#475569] rounded-xl p-6 shadow-md animate-in fade-in duration-200">
              <div className="w-full overflow-x-auto rounded-xl border border-[#475569]/20">
                <Table className="text-xs min-w-[950px]">
                  <TableHeader className="bg-[#475569]">
                    <TableRow className="border-[#475569] hover:bg-[#475569]">
                      <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px]">Assignment Name</TableHead>
                      <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px]">Form Used</TableHead>
                      <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px]">Assigned Company</TableHead>
                      <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px]">Due Date</TableHead>
                      <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px]">Publish Status</TableHead>
                      <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px]">Status</TableHead>
                      <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments
                      .filter(a => !folderCollectedAssignmentIds.includes(a.id))
                      .filter(a => globalSearchQuery === '' || matchQuery(a.name) || matchQuery(a.assignedTo))
                      .map(asg => (
                        <TableRow key={asg.id} className={`border-b border-[#475569]/30 hover:bg-[#475569]/40 ${asg.status === 'Disabled' ? 'opacity-50' : ''}`}>
                          <TableCell className="font-bold text-white py-4">{asg.name}</TableCell>
                          <TableCell className="text-[#f1f5f9] py-4">{asg.formName}</TableCell>
                          <TableCell className="text-[#cbd5e1] py-4">{asg.assignedTo}</TableCell>
                          <TableCell className="text-[#94a3b8] py-4">{asg.dueDate}</TableCell>
                          <TableCell className="py-4">
                            {asg.published ? (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold uppercase border text-[11px] bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30">
                                  <Check className="h-3 w-3" /> Published
                                </span>
                                {asg.publishedAt && <p className="text-[10px] text-[#94a3b8] mt-1 pl-0.5">{asg.publishedAt}</p>}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold uppercase border text-[11px] bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30">
                                <Clock className="h-3 w-3" /> Draft
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold uppercase border text-[11px] ${asg.status === 'Enabled' ? 'bg-[#3b82f6]/15 text-[#3b82f6] border-[#3b82f6]/30' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                              {asg.status === 'Enabled' ? <Check className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />} {asg.status}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {!asg.published && (
                                <Button size="sm" onClick={() => handlePublishAssignment(asg.id)} className="bg-[#10b981]/10 border border-[#10b981]/40 text-[#10b981] hover:bg-[#10b981]/20 h-8 px-2.5 text-[11px] font-bold gap-1">
                                  <Mail className="h-3 w-3" /> Publish
                                </Button>
                              )}
                              <Button size="sm" onClick={() => setViewingAssignment(asg)} className="bg-[#334155] border border-[#475569] text-[#3b82f6] hover:bg-[#475569] h-8 w-8 p-0"><Eye className="h-3.5 w-3.5" /></Button>
                              <Button size="sm" onClick={() => { setEditingAssignment(asg); setIsAssignmentOpen(true); }} className="bg-[#334155] border border-[#475569] text-white hover:bg-[#475569] h-8 w-8 p-0"><Edit2 className="h-3.5 w-3.5" /></Button>
                              <Button size="sm" onClick={() => deleteAssignment(asg.id)} className="bg-rose-950/20 border border-rose-900/50 text-rose-400 hover:bg-rose-900/20 h-8 w-8 p-0"><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    {assignments.filter(a => !folderCollectedAssignmentIds.includes(a.id) && (globalSearchQuery === '' || matchQuery(a.name))).length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-[#94a3b8] py-10">No uncollected root assignments found.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* COLLECTIONS VIEW */}
          {currentPage === 'collections' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {activeFolderView ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Button onClick={() => setActiveFolderView(null)} variant="outline" className="border-[#475569] bg-[#1e293b] text-[#cbd5e1] hover:bg-[#334155] text-xs h-8 px-3">
                      ← Back to Folders
                    </Button>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <FolderOpen className="text-[#3b82f6] h-5 w-5" /> {activeFolderView.name}
                    </h2>
                    <span className="text-xs bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/40 px-2.5 py-0.5 rounded-full font-semibold">
                      {activeFolderView.assignmentIds.length} assignment(s) linked
                    </span>
                  </div>

                  <p className="text-sm text-[#94a3b8] bg-[#1e293b]/40 border border-[#475569]/30 p-4 rounded-xl leading-relaxed">
                    {activeFolderView.description || "No description recorded for this configuration track."}
                  </p>

                  <div className="bg-gradient-to-br from-[#1e293b] to-[#334155] border border-[#475569] rounded-xl p-6 shadow-md">
                    <div className="w-full overflow-x-auto rounded-xl">
                      <Table className="text-xs">
                        <TableHeader className="bg-[#475569]">
                          <TableRow className="border-[#475569] hover:bg-[#475569]">
                            <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px]">Assignment Name</TableHead>
                            <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px]">Form Used</TableHead>
                            <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px]">Assigned Company</TableHead>
                            <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px]">Due Date</TableHead>
                            <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px] text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assignments
                            .filter(a => activeFolderView.assignmentIds.includes(a.id))
                            .filter(a => globalSearchQuery === '' || matchQuery(a.name))
                            .map(asg => (
                              <TableRow key={asg.id} className="border-b border-[#475569]/30 hover:bg-[#475569]/40">
                                <TableCell className="font-bold text-white py-4">{asg.name}</TableCell>
                                <TableCell className="text-[#f1f5f9] py-4">{asg.formName}</TableCell>
                                <TableCell className="text-[#cbd5e1] py-4">{asg.assignedTo}</TableCell>
                                <TableCell className="text-[#94a3b8] py-4">{asg.dueDate}</TableCell>
                                <TableCell className="py-4 text-right">
                                  <Button size="sm" onClick={() => setViewingAssignment(asg)} className="bg-[#334155] border border-[#475569] text-[#3b82f6] hover:bg-[#475569] h-8 w-8 p-0"><Eye className="h-3.5 w-3.5" /></Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          {assignments.filter(a => activeFolderView.assignmentIds.includes(a.id)).length === 0 && (
                            <TableRow><TableCell colSpan={5} className="text-center text-[#94a3b8] py-10">No items map inside this cluster folder context registry.</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {folders
                    .filter(f => globalSearchQuery === '' || matchQuery(f.name))
                    .map(fol => (
                      <Card key={fol.id} className="bg-[#0f172a]/40 border-[#475569] text-[#f1f5f9] relative group hover:border-[#3b82f6]/50 transition-all shadow-lg">
                        <CardHeader className="pb-2 flex flex-row justify-between items-start space-y-0">
                          <CardTitle className="text-base font-bold text-white flex items-center gap-2 truncate pr-16">
                            <Folder className="text-[#3b82f6] h-5 w-5 shrink-0" /> {fol.name}
                          </CardTitle>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 absolute top-4 right-4">
                            <button onClick={() => { setEditingFolder(fol); setIsFolderOpen(true); }} className="text-[#cbd5e1] hover:text-white p-1"><Edit2 className="h-3.5 w-3.5" /></button>
                            <button onClick={() => deleteFolder(fol.id)} className="text-rose-400 hover:text-rose-200 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-2">
                          <p className="text-xs text-[#94a3b8] line-clamp-2 h-8 leading-relaxed">
                            {fol.description || "No supplemental profile documentation recorded."}
                          </p>
                          <div className="flex justify-between items-center text-xs text-[#cbd5e1] bg-[#1e293b]/40 p-2.5 rounded-lg border border-[#475569]/20">
                            <span className="text-[#94a3b8]">Assignments Bundle:</span>
                            <span className="font-bold text-[#3b82f6]">{fol.assignmentIds.length} Items</span>
                          </div>
                          <Button onClick={() => setActiveFolderView(fol)} className="w-full justify-between bg-[#334155] hover:bg-[#475569] border border-[#475569] text-xs h-9">
                            Inspect Active Folder Assignments <ChevronRight className="h-3.5 w-3.5 text-[#3b82f6]" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  {folders.filter(f => globalSearchQuery === '' || matchQuery(f.name)).length === 0 && (
                    <div className="col-span-full text-center text-[#94a3b8] py-16 border border-dashed border-[#475569] rounded-xl bg-[#1e293b]/10">
                      No matching mapping collections data folders discovered.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* RESULTS */}
          {currentPage === 'results' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 flex-wrap">
                <select value={programFilter} onChange={e => setProgramFilter(e.target.value)} className="bg-[#1e293b] border border-[#475569] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] outline-none focus:border-[#3b82f6]">
                  {uniquePrograms.map(p => <option key={p} value={p}>{p === 'all' ? 'All Programs' : p}</option>)}
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-[#1e293b] border border-[#475569] rounded-lg px-3 py-2 text-xs text-[#f1f5f9] outline-none focus:border-[#3b82f6]">
                  {uniqueStatuses.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</option>)}
                </select>
                {(programFilter !== 'all' || statusFilter !== 'all') && (
                  <button onClick={() => { setProgramFilter('all'); setStatusFilter('all'); }} className="text-xs text-[#94a3b8] hover:text-white flex items-center gap-1 px-2 py-1.5 border border-[#475569]/50 rounded-lg">
                    <X className="h-3 w-3" /> Clear filters
                  </button>
                )}
                <span className="text-xs text-[#94a3b8] ml-auto">{filteredSubmissions.length} result{filteredSubmissions.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="bg-gradient-to-br from-[#1e293b] to-[#334155] border border-[#475569] rounded-xl p-6 shadow-md">
                <div className="w-full overflow-x-auto rounded-xl border border-[#475569]/20">
                  <Table className="text-xs min-w-[900px]">
                    <TableHeader className="bg-[#475569]">
                      <TableRow className="border-[#475569] hover:bg-[#475569]">
                        <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px]">Participant</TableHead>
                        <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px]">Program</TableHead>
                        <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px]">Assignment</TableHead>
                        <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px]">Score</TableHead>
                        <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px] w-40">Progress</TableHead>
                        <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px]">Status</TableHead>
                        <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubmissions.map(sub => (
                        <TableRow key={sub.id} className="border-b border-[#475569]/30 hover:bg-[#475569]/40">
                          <TableCell className="font-bold text-white py-4">{sub.participantName}</TableCell>
                          <TableCell className="text-[#cbd5e1] py-4">{sub.program}</TableCell>
                          <TableCell className="text-[#cbd5e1] py-4">{sub.assignmentName}</TableCell>
                          <TableCell className="py-4">
                            {sub.score !== null
                              ? <span className="font-bold text-[#3b82f6]">{sub.score}/100</span>
                              : <span className="text-[#475569]">—</span>}
                          </TableCell>
                          <TableCell className="py-4 w-40">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-[#0f172a] rounded-full h-1.5 overflow-hidden">
                                <div className="h-full rounded-full bg-[#3b82f6] transition-all" style={{ width: `${sub.progress}%` }} />
                              </div>
                              <span className="text-[10px] text-[#94a3b8] w-7 text-right">{sub.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4"><SubmissionStatusBadge status={sub.status} /></TableCell>
                          <TableCell className="py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" onClick={() => setViewingSubmission(sub)} className="bg-[#334155] border border-[#475569] text-[#3b82f6] hover:bg-[#475569] h-8 w-8 p-0"><Eye className="h-3.5 w-3.5" /></Button>
                              <Button size="sm" onClick={() => { setEditingSubmission(sub); setIsSubmissionOpen(true); }} className="bg-[#334155] border border-[#475569] text-white hover:bg-[#475569] h-8 w-8 p-0"><Edit2 className="h-3.5 w-3.5" /></Button>
                              <Button size="sm" onClick={() => deleteSubmission(sub.id)} className="bg-rose-950/20 border border-rose-900/50 text-rose-400 hover:bg-rose-900/20 h-8 w-8 p-0"><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredSubmissions.length === 0 && (
                        <TableRow><TableCell colSpan={7} className="text-center text-[#94a3b8] py-10">No results match the current filters.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* PARTICIPANTS */}
          {currentPage === 'participants' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-[#94a3b8]">Filter by company:</span>
                {['all', ...companiesData.map(c => c.name)].map(c => (
                  <button key={c} onClick={() => setCompanyFilter(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${companyFilter === c ? 'bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]/40' : 'text-[#94a3b8] border-[#475569]/40 hover:border-[#475569]'}`}>
                    {c === 'all' ? 'All' : c}
                  </button>
                ))}
              </div>
              <div className="bg-gradient-to-br from-[#1e293b] to-[#334155] border border-[#475569] rounded-xl p-6 shadow-md">
                <div className="w-full overflow-x-auto rounded-xl border border-[#475569]/20">
                  <Table className="text-xs min-w-[900px]">
                    <TableHeader className="bg-[#475569]">
                      <TableRow className="border-[#475569] hover:bg-[#475569]">
                        <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px]">Name</TableHead>
                        <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px]">Company</TableHead>
                        <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px]">Department</TableHead>
                        <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px]">Email</TableHead>
                        <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px]">Status</TableHead>
                        <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participants
                        .filter(p => companyFilter === 'all' || p.company === companyFilter)
                        .filter(p => globalSearchQuery === '' || matchQuery(p.name) || matchQuery(p.email))
                        .map(part => (
                          <TableRow key={part.id} className={`border-b border-[#475569]/30 hover:bg-[#475569]/40 ${part.status === 'Disabled' ? 'opacity-50' : ''}`}>
                            <TableCell className="font-bold text-white py-4">{part.name}</TableCell>
                            <TableCell className="text-[#cbd5e1] py-4">{part.company}</TableCell>
                            <TableCell className="text-[#cbd5e1] py-4">{part.department}</TableCell>
                            <TableCell className="text-[#cbd5e1] py-4 font-mono text-[11px]">{part.email}</TableCell>
                            <TableCell className="py-4">
                              <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] uppercase border ${part.status === 'Enabled' ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                                {part.status}
                              </span>
                            </TableCell>
                            <TableCell className="py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" onClick={() => setViewingParticipant(part)} className="bg-[#334155] border border-[#475569] text-[#3b82f6] hover:bg-[#475569] h-8 w-8 p-0"><Eye className="h-3.5 w-3.5" /></Button>
                                <Button size="sm" onClick={() => { setEditingParticipant(part); setIsParticipantOpen(true); }} className="bg-[#334155] border border-[#475569] text-white hover:bg-[#475569] h-8 w-8 p-0"><Edit2 className="h-3.5 w-3.5" /></Button>
                                <Button size="sm" onClick={() => deleteParticipant(part.id)} className="bg-rose-950/20 border border-rose-900/50 text-rose-400 hover:bg-rose-900/20 h-8 w-8 p-0"><Trash2 className="h-3.5 w-3.5" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      {participants.filter(p => companyFilter === 'all' || p.company === companyFilter).length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center text-[#94a3b8] py-10">No participants found.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* COMPANIES */}
          {currentPage === 'companies' && (
            <div className="animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {companyStats.map(c => (
                  <Card key={c.id} className={`bg-[#0f172a]/40 border-[#475569] text-[#f1f5f9] relative group ${c.status === 'Disabled' ? 'opacity-50 border-dashed' : ''}`}>
                    <CardHeader className="pb-2 flex flex-row justify-between items-start space-y-0">
                      <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                        <Building2 className="text-[#3b82f6] h-4 w-4" /> {c.name}
                      </CardTitle>
                      <div className="opacity-40 group-hover:opacity-100 transition-opacity flex gap-1 absolute top-4 right-4">
                        <button onClick={() => setViewingCompany(c)} className="text-[#3b82f6] hover:text-white p-1"><Eye className="h-3.5 w-3.5" /></button>
                        <button onClick={() => { setEditingCompany(c); setIsCompanyOpen(true); }} className="text-[#cbd5e1] hover:text-white p-1"><Edit2 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => deleteCompanyEntity(c.id, c.name)} className="text-rose-400 hover:text-rose-200 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-2">
                      <p className="text-[11px] font-medium text-[#94a3b8] italic -mt-1">{c.industry} <span className="text-[10px] font-bold uppercase text-slate-500 ml-1">({c.status})</span></p>
                      <div className="flex justify-between text-xs text-[#cbd5e1] pt-1"><span>Active Members:</span><span className="font-bold text-[#3b82f6]">{c.count} members</span></div>
                      <Button variant="ghost" size="sm" disabled={c.status === 'Disabled'} onClick={() => { setCompanyFilter(c.name); navigate('participants'); }} className="w-full justify-between hover:bg-[#334155] text-xs text-[#3b82f6] p-0 h-auto pt-2 mt-1 border-t border-[#475569]/30 rounded-none disabled:opacity-30">
                        Inspect Directory Personnel <ArrowRight className="h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* REPORTS */}
          {currentPage === 'reports' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-gradient-to-br from-[#1e293b] to-[#334155] border border-[#475569] rounded-xl p-6 shadow-md">
                <div className="w-full overflow-x-auto rounded-xl border border-[#475569]/20">
                  <Table className="text-xs min-w-[800px]">
                    <TableHeader className="bg-[#475569]">
                      <TableRow className="border-[#475569] hover:bg-[#475569]">
                        <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px]">Report Name</TableHead>
                        <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px]">Type</TableHead>
                        <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px]">Generated</TableHead>
                        <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px]">Format</TableHead>
                        <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px]">Size</TableHead>
                        <TableHead className="text-[#cbd5e1] font-semibold uppercase text-[11px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.filter(r => globalSearchQuery === '' || matchQuery(r.name) || matchQuery(r.type)).map(rep => (
                        <TableRow key={rep.id} className="border-b border-[#475569]/30 hover:bg-[#475569]/40">
                          <TableCell className="font-bold text-white py-4">{rep.name}</TableCell>
                          <TableCell className="text-[#cbd5e1] py-4">{rep.type}</TableCell>
                          <TableCell className="text-[#94a3b8] py-4">{rep.generated}</TableCell>
                          <TableCell className="py-4">
                            <span className="px-2.5 py-1 rounded-full font-bold text-[11px] uppercase border bg-[#3b82f6]/15 text-[#3b82f6] border-[#3b82f6]/30">{rep.format}</span>
                          </TableCell>
                          <TableCell className="text-[#94a3b8] py-4">{rep.size}</TableCell>
                          <TableCell className="py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" className="bg-[#334155] border border-[#475569] text-[#10b981] hover:bg-[#475569] h-8 px-3 text-xs gap-1.5">
                                <Download className="h-3.5 w-3.5" /> Download
                              </Button>
                              <Button size="sm" onClick={() => deleteReport(rep.id)} className="bg-rose-950/20 border border-rose-900/50 text-rose-400 hover:bg-rose-900/20 h-8 w-8 p-0"><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {reports.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center text-[#94a3b8] py-10">No reports generated yet. Click "Generate Report" to create one.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {currentPage === 'settings' && (
            <div className="max-w-2xl space-y-6 animate-in fade-in duration-200">
              {settingsSaved && (
                <div className="bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] rounded-xl px-5 py-3 text-sm flex items-center gap-2">
                  <Check className="h-4 w-4" /> Settings saved successfully.
                </div>
              )}

              {/* Platform */}
              <div className="bg-gradient-to-br from-[#1e293b] to-[#334155] border border-[#475569] rounded-xl p-6 space-y-5">
                <div className="flex items-center gap-2 border-b border-[#475569] pb-4">
                  <Globe className="h-4 w-4 text-[#3b82f6]" />
                  <h2 className="text-sm font-bold text-white">Platform Configuration</h2>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-[#94a3b8]">Platform Display Name</Label>
                  <Input value={platformName} onChange={e => setPlatformName(e.target.value)} className="bg-[#334155] border-[#475569] text-white h-10" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-[#94a3b8]">Default Timezone</Label>
                  <select value={timezone} onChange={e => setTimezone(e.target.value)} className="w-full bg-[#334155] border border-[#475569] rounded-lg px-3 py-2.5 text-sm text-[#f1f5f9] outline-none focus:border-[#3b82f6]">
                    <option value="Asia/Kuala_Lumpur">Asia/Kuala_Lumpur (UTC+8)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (UTC-5)</option>
                    <option value="Europe/London">Europe/London (UTC+0)</option>
                    <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                  </select>
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-gradient-to-br from-[#1e293b] to-[#334155] border border-[#475569] rounded-xl p-6 space-y-5">
                <div className="flex items-center gap-2 border-b border-[#475569] pb-4">
                  <Bell className="h-4 w-4 text-[#3b82f6]" />
                  <h2 className="text-sm font-bold text-white">Notifications</h2>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Email Notifications</p>
                    <p className="text-xs text-[#94a3b8] mt-0.5">Receive alerts for new submissions and due dates</p>
                  </div>
                  <button onClick={() => setNotificationsEnabled(!notificationsEnabled)} className={`w-11 h-6 rounded-full transition-colors relative ${notificationsEnabled ? 'bg-[#3b82f6]' : 'bg-[#475569]'}`}>
                    <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${notificationsEnabled ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Automated Reports</p>
                    <p className="text-xs text-[#94a3b8] mt-0.5">Auto-generate weekly summary reports</p>
                  </div>
                  <button onClick={() => setAutoReports(!autoReports)} className={`w-11 h-6 rounded-full transition-colors relative ${autoReports ? 'bg-[#3b82f6]' : 'bg-[#475569]'}`}>
                    <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${autoReports ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              {/* Data */}
              <div className="bg-gradient-to-br from-[#1e293b] to-[#334155] border border-[#475569] rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-[#475569] pb-4">
                  <Database className="h-4 w-4 text-[#3b82f6]" />
                  <h2 className="text-sm font-bold text-white">Data Overview</h2>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    { label: 'Companies', value: companiesData.length },
                    { label: 'Participants', value: participants.length },
                    { label: 'Form Blueprints', value: forms.length },
                    { label: 'Assignments', value: assignments.length },
                    { label: 'Result Entries', value: submissions.length },
                    { label: 'Reports', value: reports.length }
                  ].map(d => (
                    <div key={d.label} className="bg-[#0f172a]/40 border border-[#475569]/30 rounded-lg px-4 py-3 flex justify-between items-center">
                      <span className="text-[#94a3b8]">{d.label}</span>
                      <span className="font-bold text-[#3b82f6]">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] text-white font-bold h-11 w-full flex items-center gap-2">
                <Save className="h-4 w-4" /> Save Settings
              </Button>
            </div>
          )}

        </div>
      </main>

      {/* ==========================================
          MODALS
          ========================================== */}

      {/* CRUD: Collection Folder */}
      <Dialog open={isFolderOpen} onOpenChange={(open) => { setIsFolderOpen(open); if (!open) setEditingFolder(null); }}>
        <DialogContent className="bg-gradient-to-br from-[#1e293b] to-[#334155] border-[#475569] text-[#f1f5f9] rounded-xl max-w-[600px] p-8 shadow-2xl">
          <DialogHeader className="border-b border-[#475569] pb-4 mb-4">
            <DialogTitle className="text-xl font-bold">{editingFolder ? 'Edit Collection Folder' : 'New Collection Folder'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveFolder} className="space-y-5">
            <div className="space-y-2">
              <Label>Folder Name *</Label>
              <Input name="folderName" required placeholder="e.g. Technical Mastery Cohort" defaultValue={editingFolder?.name || ''} className="bg-[#334155] border-[#475569] h-11 text-white" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input name="folderDesc" placeholder="Brief track metadata profile description..." defaultValue={editingFolder?.description || ''} className="bg-[#334155] border-[#475569] h-11 text-white" />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-white block">Map Assignments</Label>
              <p className="text-[11px] text-[#94a3b8] -mt-1">Select assignments to bundle. (Already collected items are hidden or editable here):</p>
              <div className="bg-[#0f172a]/50 border border-[#475569]/40 rounded-xl p-4 max-h-[180px] overflow-y-auto space-y-2.5">
                {assignments
                  .filter(asg => !folderCollectedAssignmentIds.includes(asg.id) || editingFolder?.assignmentIds.includes(asg.id))
                  .map(asg => (
                    <div key={asg.id} className="flex items-start gap-3 text-xs select-none">
                      <input 
                        type="checkbox" 
                        id={`asg_chk_${asg.id}`}
                        name="assignments" 
                        value={asg.id} 
                        defaultChecked={editingFolder?.assignmentIds.includes(asg.id)}
                        className="mt-0.5 rounded border-[#475569] bg-[#334155] text-[#3b82f6] focus:ring-0 h-4 w-4 shrink-0" 
                      />
                      <label htmlFor={`asg_chk_${asg.id}`} className="text-white cursor-pointer leading-tight">
                        <span className="font-bold block text-[#cbd5e1]">{asg.name}</span>
                        <span className="text-[10px] text-[#94a3b8] block">{asg.formName} · {asg.assignedTo}</span>
                      </label>
                    </div>
                  ))}
                {assignments.filter(asg => !folderCollectedAssignmentIds.includes(asg.id) || editingFolder?.assignmentIds.includes(asg.id)).length === 0 && (
                  <p className="text-center text-xs text-[#94a3b8] py-4">No uncollected assignments available to link.</p>
                )}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="submit" className="bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] text-white w-full h-11 font-bold">
                Save Folder Collection
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* VIEW: Assignment */}
      <Dialog open={!!viewingAssignment} onOpenChange={(open) => !open && setViewingAssignment(null)}>
        <DialogContent className="bg-gradient-to-br from-[#1e293b] to-[#334155] border-[#475569] text-[#f1f5f9] rounded-xl max-w-[550px] p-8 shadow-2xl">
          <DialogHeader className="border-b border-[#475569] pb-4 mb-5"><DialogTitle className="text-xl font-bold flex items-center gap-2.5 text-white"><Eye className="text-[#3b82f6] h-5 w-5" /> Assignment Details</DialogTitle></DialogHeader>
          {viewingAssignment && (
            <div className="space-y-4 text-sm">
              <div className="bg-[#0f172a]/40 border border-[#475569]/30 p-4 rounded-xl"><span className="text-[11px] font-bold text-[#94a3b8] block uppercase mb-1">Assignment Title</span><p className="text-base font-bold text-white">{viewingAssignment.name}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0f172a]/20 border border-[#475569]/20 p-3 rounded-lg"><span className="text-[10px] text-[#94a3b8] block uppercase mb-1">Form Used</span><p className="text-xs font-bold text-white">{viewingAssignment.formName}</p></div>
                <div className="bg-[#0f172a]/20 border border-[#475569]/20 p-3 rounded-lg"><span className="text-[10px] text-[#94a3b8] block uppercase mb-1">Assigned To</span><p className="text-xs font-bold text-white">{viewingAssignment.assignedTo}</p></div>
                <div className="bg-[#0f172a]/20 border border-[#475569]/20 p-3 rounded-lg"><span className="text-[10px] text-[#94a3b8] block uppercase mb-1">Due Date</span><p className="text-xs font-bold text-white">{viewingAssignment.dueDate}</p></div>
                <div className="bg-[#0f172a]/20 border border-[#475569]/20 p-3 rounded-lg"><span className="text-[10px] text-[#94a3b8] block uppercase mb-1">Completed</span><p className="text-xs font-bold text-white">{viewingAssignment.completedText}</p></div>
              </div>
              <Button onClick={() => setViewingAssignment(null)} className="w-full bg-[#334155] hover:bg-[#475569]">Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* VIEW: Form */}
      <Dialog open={!!viewingForm} onOpenChange={(open) => !open && setViewingForm(null)}>
        <DialogContent className="bg-gradient-to-br from-[#1e293b] to-[#334155] border-[#475569] text-[#f1f5f9] rounded-xl max-w-[550px] p-8 shadow-2xl">
          <DialogHeader className="border-b border-[#475569] pb-4 mb-5"><DialogTitle className="text-xl font-bold flex items-center gap-2.5 text-white"><Eye className="text-[#3b82f6] h-5 w-5" /> Form Blueprint</DialogTitle></DialogHeader>
          {viewingForm && (
            <div className="space-y-4 text-sm">
              <div className="bg-[#0f172a]/40 border border-[#475569]/30 p-4 rounded-xl"><p className="text-base font-bold text-white">{viewingForm.name}</p><p className="text-xs text-[#94a3b8] mt-1">{viewingForm.type} · {viewingForm.questionCount} fields</p></div>
              {viewingForm.googleFormUrl && (
                <div className="bg-blue-950/20 border border-[#3b82f6]/30 p-3.5 rounded-lg flex justify-between items-center">
                  <span className="text-xs font-semibold text-[#60a5fa]">Linked Google Form:</span>
                  <Button size="sm" onClick={() => window.open(viewingForm.googleFormUrl, '_blank')} className="bg-[#3b82f6] hover:bg-blue-600 text-white text-xs h-8">Open <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button>
                </div>
              )}
              <p className="text-xs text-[#cbd5e1] leading-relaxed p-3 bg-[#0f172a]/10 border border-[#475569]/20 rounded-lg">{viewingForm.description || 'No description provided.'}</p>
              <Button onClick={() => setViewingForm(null)} className="w-full bg-[#334155] hover:bg-[#475569]">Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* VIEW: Participant */}
      <Dialog open={!!viewingParticipant} onOpenChange={(open) => !open && setViewingParticipant(null)}>
        <DialogContent className="bg-gradient-to-br from-[#1e293b] to-[#334155] border-[#475569] text-[#f1f5f9] rounded-xl max-w-[550px] p-8 shadow-2xl">
          <DialogHeader className="border-b border-[#475569] pb-4 mb-5"><DialogTitle className="text-xl font-bold flex items-center gap-2.5 text-white"><Eye className="text-[#3b82f6] h-5 w-5" /> Participant Details</DialogTitle></DialogHeader>
          {viewingParticipant && (
            <div className="space-y-4 text-sm">
              <div className="bg-[#0f172a]/40 border border-[#475569]/30 p-4 rounded-xl"><p className="text-base font-bold text-white">{viewingParticipant.name}</p><p className="text-xs text-[#94a3b8] mt-1">{viewingParticipant.department}</p></div>
              <div className="bg-[#0f172a]/20 border border-[#475569]/20 p-4 rounded-xl space-y-3">
                {[
                  { icon: <Building2 className="text-[#3b82f6] h-4 w-4" />, label: 'Company', value: viewingParticipant.company },
                  { icon: <Mail className="text-[#3b82f6] h-4 w-4" />, label: 'Email', value: viewingParticipant.email },
                  { icon: <Check className="text-[#3b82f6] h-4 w-4" />, label: 'Status', value: viewingParticipant.status }
                ].map((row, i) => (
                  <div key={i} className={`flex items-center gap-3 ${i > 0 ? 'border-t border-[#475569]/20 pt-3' : ''}`}>
                    {row.icon}
                    <div><span className="text-[10px] text-[#94a3b8] block uppercase">{row.label}</span><p className="text-xs font-bold text-white">{row.value}</p></div>
                  </div>
                ))}
              </div>
              <Button onClick={() => setViewingParticipant(null)} className="w-full bg-[#334155] hover:bg-[#475569]">Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* VIEW: Company */}
      <Dialog open={!!viewingCompany} onOpenChange={(open) => !open && setViewingCompany(null)}>
        <DialogContent className="bg-gradient-to-br from-[#1e293b] to-[#334155] border-[#475569] text-[#f1f5f9] rounded-xl max-w-[500px] p-8 shadow-2xl">
          <DialogHeader className="border-b border-[#475569] pb-4 mb-5"><DialogTitle className="text-xl font-bold flex items-center gap-2.5 text-white"><Eye className="text-[#3b82f6] h-5 w-5" /> Company Overview</DialogTitle></DialogHeader>
          {viewingCompany && (
            <div className="space-y-4 text-sm">
              <div className="bg-[#0f172a]/40 border border-[#475569]/30 p-4 rounded-xl"><p className="text-base font-bold text-white">{viewingCompany.name}</p></div>
              <div className="bg-[#0f172a]/20 border border-[#475569]/20 p-4 rounded-xl space-y-2">
                <div className="flex justify-between"><span className="text-[#94a3b8]">Industry</span><span className="font-bold text-[#3b82f6]">{viewingCompany.industry}</span></div>
                <div className="flex justify-between pt-2 border-t border-[#475569]/10"><span className="text-[#94a3b8]">Status</span><span className="font-bold text-white">{viewingCompany.status}</span></div>
                <div className="flex justify-between pt-2 border-t border-[#475569]/10"><span className="text-[#94a3b8]">Created</span><span className="font-bold text-white">{viewingCompany.createdDate}</span></div>
              </div>
              <Button onClick={() => setViewingCompany(null)} className="bg-[#334155] text-white hover:bg-[#475569] w-full">Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* VIEW: Submission */}
      <Dialog open={!!viewingSubmission} onOpenChange={(open) => !open && setViewingSubmission(null)}>
        <DialogContent className="bg-gradient-to-br from-[#1e293b] to-[#334155] border-[#475569] text-[#f1f5f9] rounded-xl max-w-[500px] p-8 shadow-2xl">
          <DialogHeader className="border-b border-[#475569] pb-4 mb-5"><DialogTitle className="text-xl font-bold flex items-center gap-2.5 text-white"><Eye className="text-[#3b82f6] h-5 w-5" /> Result Details</DialogTitle></DialogHeader>
          {viewingSubmission && (
            <div className="space-y-4 text-sm">
              <div className="bg-[#0f172a]/40 border border-[#475569]/30 p-4 rounded-xl"><p className="text-base font-bold text-white">{viewingSubmission.participantName}</p><p className="text-xs text-[#94a3b8] mt-1">{viewingSubmission.program}</p></div>
              <div className="bg-[#0f172a]/20 border border-[#475569]/20 p-4 rounded-xl space-y-3">
                <div className="flex justify-between"><span className="text-[#94a3b8]">Assignment</span><span className="font-bold text-white">{viewingSubmission.assignmentName}</span></div>
                <div className="flex justify-between pt-2 border-t border-[#475569]/10"><span className="text-[#94a3b8]">Score</span><span className="font-bold text-[#3b82f6]">{viewingSubmission.score !== null ? `${viewingSubmission.score}/100` : '—'}</span></div>
                <div className="pt-2 border-t border-[#475569]/10 space-y-2">
                  <div className="flex justify-between"><span className="text-[#94a3b8]">Progress</span><span className="font-bold text-white">{viewingSubmission.progress}%</span></div>
                  <div className="bg-[#0f172a] rounded-full h-2 overflow-hidden"><div className="h-full rounded-full bg-[#3b82f6]" style={{ width: `${viewingSubmission.progress}%` }} /></div>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#475569]/10"><span className="text-[#94a3b8]">Status</span><SubmissionStatusBadge status={viewingSubmission.status} /></div>
              </div>
              <Button onClick={() => setViewingSubmission(null)} className="w-full bg-[#334155] hover:bg-[#475569]">Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CRUD: Assignment */}
      <Dialog open={isAssignmentOpen} onOpenChange={(open) => { setIsAssignmentOpen(open); if (!open) setEditingAssignment(null); }}>
        <DialogContent className="bg-gradient-to-br from-[#1e293b] to-[#334155] border-[#475569] text-[#f1f5f9] rounded-xl max-w-[600px] p-8 shadow-2xl">
          <DialogHeader className="border-b border-[#475569] pb-4 mb-4"><DialogTitle className="text-xl font-bold">{editingAssignment ? 'Edit Assignment' : 'New Assignment'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveAssignment} className="space-y-5">
            <div className="space-y-2"><Label>Assignment Name *</Label><Input name="name" required defaultValue={editingAssignment?.name || ''} className="bg-[#334155] border-[#475569] h-11 text-white" /></div>
            <div className="space-y-2">
              <Label>Form Template *</Label>
              <select name="formName" required defaultValue={editingAssignment?.formName || ""} className="w-full bg-[#334155] border border-[#475569] rounded-lg p-3 text-sm text-[#f1f5f9] outline-none">
                <option value="" disabled>-- Select Template --</option>
                {activeFormsOptions.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                {editingAssignment && forms.find(f => f.name === editingAssignment.formName)?.status === 'Disabled' && (
                  <option value={editingAssignment.formName}>{editingAssignment.formName} (Disabled)</option>
                )}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Assign To Company *</Label>
                <select name="target" required defaultValue={editingAssignment?.assignedTo || ""} className="w-full bg-[#334155] border border-[#475569] rounded-lg p-3 text-sm text-[#f1f5f9] outline-none">
                  <option value="" disabled>-- Select Company --</option>
                  {activeCompaniesOptions.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  {editingAssignment && companiesData.find(c => c.name === editingAssignment.assignedTo)?.status === 'Disabled' && (
                    <option value={editingAssignment.assignedTo}>{editingAssignment.assignedTo} (Disabled)</option>
                  )}
                </select>
              </div>
              <div className="space-y-2"><Label>Due Date *</Label><Input type="date" name="date" required defaultValue={editingAssignment?.rawDate || ''} className="bg-[#334155] border-[#475569] h-11 px-3 text-white" /></div>
            </div>
            <div className="space-y-2">
              <Label>Status *</Label>
              <select name="status" required defaultValue={editingAssignment?.status || "Enabled"} className="w-full bg-[#334155] border border-[#475569] rounded-lg p-3 text-sm text-[#f1f5f9] outline-none">
                <option value="Enabled">Enabled</option>
                <option value="Disabled">Disabled</option>
              </select>
            </div>
            <DialogFooter><Button type="submit" className="bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] text-white w-full">Save Assignment</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CRUD: Form Blueprint */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setEditingForm(null); }}>
        <DialogContent className="bg-gradient-to-br from-[#1e293b] to-[#334155] border-[#475569] text-[#f1f5f9] p-8 rounded-xl max-w-[600px]">
          <DialogHeader className="border-b border-[#475569] pb-4 mb-4"><DialogTitle className="text-xl font-bold">{editingForm ? 'Edit Form Blueprint' : 'New Form Blueprint'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveForm} className="space-y-5">
            <div className="space-y-2"><Label>Form Name *</Label><Input name="name" required defaultValue={editingForm?.name || ''} className="bg-[#334155] border-[#475569] h-11 text-white" /></div>
            <div className="bg-[#0f172a]/40 border border-[#475569]/40 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold text-[#3b82f6] uppercase tracking-wider">Google Forms Link</Label>
                <Button type="button" onClick={() => window.open('https://forms.new', '_blank')} className="bg-[#334155] text-[#3b82f6] text-xs border border-[#3b82f6] h-8 px-3"><Plus className="h-3.5 w-3.5 mr-1" /> Create New Form</Button>
              </div>
              <Input name="googleFormUrl" placeholder="https://docs.google.com/forms/d/e/.../viewform" defaultValue={editingForm?.googleFormUrl || ''} className="bg-[#334155] border-[#475569] text-xs h-10 text-[#60a5fa]" />
            </div>
            <div className="space-y-2"><Label>Description</Label><textarea name="description" defaultValue={editingForm?.description || ''} className="w-full bg-[#334155] border border-[#475569] rounded-lg p-3 text-sm text-white min-h-[80px] outline-none" /></div>
            <div className="space-y-2">
              <Label>Status *</Label>
              <select name="status" required defaultValue={editingForm?.status || "Enabled"} className="w-full bg-[#334155] border border-[#475569] rounded-lg p-3 text-sm text-[#f1f5f9] outline-none">
                <option value="Enabled">Enabled</option>
                <option value="Disabled">Disabled</option>
              </select>
            </div>
            <DialogFooter><Button type="submit" className="bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] text-white w-full">Save Form</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CRUD: Participant */}
      <Dialog open={isParticipantOpen} onOpenChange={(open) => { setIsParticipantOpen(open); if (!open) setEditingParticipant(null); }}>
        <DialogContent className="bg-gradient-to-br from-[#1e293b] to-[#334155] border-[#475569] text-[#f1f5f9] p-8 rounded-2xl max-w-[650px]">
          <DialogHeader className="border-b border-[#475569]/40 pb-4 mb-5"><DialogTitle className="text-xl font-bold">{editingParticipant ? 'Edit Participant' : 'New Participant'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveParticipant} className="space-y-5">
            <div className="bg-[#0f172a]/30 border border-[#475569]/30 rounded-xl p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>First Name *</Label><Input name="firstName" required defaultValue={editingParticipant?.firstName || ''} className="bg-[#334155] border-[#475569] h-10" /></div>
                <div className="space-y-1.5"><Label>Last Name *</Label><Input name="lastName" required defaultValue={editingParticipant?.lastName || ''} className="bg-[#334155] border-[#475569] h-10" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Email *</Label><Input type="email" name="email" required defaultValue={editingParticipant?.email || ''} className="bg-[#334155] border-[#475569] h-10" /></div>
                <div className="space-y-1.5"><Label>Department</Label><Input name="department" defaultValue={editingParticipant?.department || ''} className="bg-[#334155] border-[#475569] h-10" /></div>
              </div>
            </div>
            <div className="bg-[#0f172a]/30 border border-[#475569]/30 rounded-xl p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Company *</Label>
                  <select name="companySelect" required defaultValue={editingParticipant?.company || ""} className="w-full bg-[#334155] border border-[#475569] rounded-lg p-2.5 text-xs text-[#f1f5f9] outline-none">
                    <option value="" disabled>-- Select Company --</option>
                    {activeCompaniesOptions.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    {editingParticipant && companiesData.find(c => c.name === editingParticipant.company)?.status === 'Disabled' && (
                      <option value={editingParticipant.company}>{editingParticipant.company} (Disabled)</option>
                    )}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status *</Label>
                  <select name="status" required defaultValue={editingParticipant?.status || "Enabled"} className="w-full bg-[#334155] border border-[#475569] rounded-lg p-2.5 text-xs text-[#f1f5f9] outline-none">
                    <option value="Enabled">Enabled</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter><Button type="submit" className="bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] text-white w-full h-11 font-bold">Save Participant</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CRUD: Company */}
      <Dialog open={isCompanyOpen} onOpenChange={(open) => { setIsCompanyOpen(open); if (!open) setEditingCompany(null); }}>
        <DialogContent className="bg-gradient-to-br from-[#1e293b] to-[#334155] border-[#475569] text-[#f1f5f9] p-8 rounded-xl max-w-[500px] shadow-2xl">
          <DialogHeader className="border-b border-[#475569] pb-4 mb-4"><DialogTitle className="text-xl font-bold">{editingCompany ? 'Edit Company' : 'New Company'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveCompany} className="space-y-5">
            <div className="space-y-2"><Label>Company Name *</Label><Input name="name" required placeholder="e.g. Initech Logistics" defaultValue={editingCompany?.name || ''} className="bg-[#334155] border-[#475569] h-11 text-white" /></div>
            <div className="space-y-2"><Label>Industry</Label><Input name="industry" placeholder="e.g. Heavy Supply Logistics" defaultValue={editingCompany?.industry || ''} className="bg-[#334155] border-[#475569] h-11 text-white" /></div>
            <div className="space-y-2">
              <Label>Status *</Label>
              <select name="status" required defaultValue={editingCompany?.status || "Enabled"} className="w-full bg-[#334155] border border-[#475569] rounded-lg p-3 text-sm text-[#f1f5f9] outline-none">
                <option value="Enabled">Enabled</option>
                <option value="Disabled">Disabled</option>
              </select>
            </div>
            <DialogFooter><Button type="submit" className="bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] text-white w-full h-11 font-bold">Save Company</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CRUD: Submission / Result */}
      <Dialog open={isSubmissionOpen} onOpenChange={(open) => { setIsSubmissionOpen(open); if (!open) setEditingSubmission(null); }}>
        <DialogContent className="bg-gradient-to-br from-[#1e293b] to-[#334155] border-[#475569] text-[#f1f5f9] p-8 rounded-xl max-w-[580px] shadow-2xl">
          <DialogHeader className="border-b border-[#475569] pb-4 mb-4"><DialogTitle className="text-xl font-bold">{editingSubmission ? 'Edit Result' : 'New Result Entry'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveSubmission} className="space-y-5">
            <div className="space-y-2">
              <Label>Participant *</Label>
              <select name="participantName" required defaultValue={editingSubmission?.participantName || ""} className="w-full bg-[#334155] border border-[#475569] rounded-lg p-3 text-sm text-[#f1f5f9] outline-none">
                <option value="" disabled>-- Select Participant --</option>
                {participants.filter(p => p.status === 'Enabled').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                {editingSubmission && !participants.find(p => p.name === editingSubmission.participantName && p.status === 'Enabled') && (
                  <option value={editingSubmission.participantName}>{editingSubmission.participantName}</option>
                )}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Program *</Label><Input name="program" required placeholder="e.g. Leadership Training" defaultValue={editingSubmission?.program || ''} className="bg-[#334155] border-[#475569] h-11 text-white" /></div>
              <div className="space-y-2"><Label>Assignment Name *</Label><Input name="assignmentName" required placeholder="e.g. Module 1" defaultValue={editingSubmission?.assignmentName || ''} className="bg-[#334155] border-[#475569] h-11 text-white" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Score (0–100)</Label><Input type="number" name="score" min={0} max={100} placeholder="Leave blank if not scored" defaultValue={editingSubmission?.score ?? ''} className="bg-[#334155] border-[#475569] h-11 text-white" /></div>
              <div className="space-y-2"><Label>Progress %</Label><Input type="number" name="progress" min={0} max={100} defaultValue={editingSubmission?.progress ?? 0} className="bg-[#334155] border-[#475569] h-11 text-white" /></div>
            </div>
            <div className="space-y-2">
              <Label>Status *</Label>
              <select name="status" required defaultValue={editingSubmission?.status || "Pending"} className="w-full bg-[#334155] border border-[#475569] rounded-lg p-3 text-sm text-[#f1f5f9] outline-none">
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <DialogFooter><Button type="submit" className="bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] text-white w-full h-11 font-bold">Save Result</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CRUD: Generate Report */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="bg-gradient-to-br from-[#1e293b] to-[#334155] border-[#475569] text-[#f1f5f9] p-8 rounded-xl max-w-[560px] shadow-2xl">
          <DialogHeader className="border-b border-[#475569] pb-4 mb-4"><DialogTitle className="text-xl font-bold flex items-center gap-2"><Download className="text-[#3b82f6]" /> Generate Report</DialogTitle></DialogHeader>
          <form onSubmit={handleGenerateReport} className="space-y-5">
            <div className="space-y-2"><Label>Report Name *</Label><Input name="name" required placeholder="e.g. Q2 Training Summary" className="bg-[#334155] border-[#475569] h-11 text-white" /></div>
            <div className="space-y-2">
              <Label>Report Type *</Label>
              <select name="type" required defaultValue="" className="w-full bg-[#334155] border border-[#475569] rounded-lg p-3 text-sm text-[#f1f5f9] outline-none">
                <option value="" disabled>-- Select Type --</option>
                <option value="Comprehensive">Comprehensive Summary</option>
                <option value="Progress">Progress Report</option>
                <option value="Score Analysis">Score Analysis</option>
                <option value="Participation">Participation Report</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <select name="format" defaultValue="PDF" className="w-full bg-[#334155] border border-[#475569] rounded-lg p-3 text-sm text-[#f1f5f9] outline-none">
                <option value="PDF">PDF</option>
                <option value="XLSX">Excel (XLSX)</option>
                <option value="CSV">CSV</option>
              </select>
            </div>
            <Button type="submit" className="bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] text-white w-full h-11 font-bold flex items-center gap-2 justify-center">
              <RefreshCw className="h-4 w-4" /> Generate Report
            </Button>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
