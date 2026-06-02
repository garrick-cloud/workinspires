'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Home, ListTodo, Folder, FileSpreadsheet, BarChart3, Users,
  Building2, FileText, Settings, GraduationCap, Search, Plus,
  Folder as FolderIcon, FolderPlus, FolderOpen, ChevronRight
} from 'lucide-react';
import { useAppContext } from '@/lib/AppContext';

type PageType = 'dashboard' | 'assignments' | 'collections' | 'forms' | 'results' | 'participants' | 'companies' | 'reports' | 'settings';

interface NavigationLayoutProps {
  currentPage: PageType;
  title: string;
  children: ReactNode;
  actionButton?: ReactNode;
}

export default function NavigationLayout({
  currentPage,
  title,
  children,
  actionButton,
}: NavigationLayoutProps) {
  const router = useRouter();
  const { globalSearchQuery, setGlobalSearchQuery, setCompanyFilter } = useAppContext();

  const pageTitle: Record<PageType, string> = {
    dashboard: 'Dashboard',
    assignments: 'Assignments',
    collections: 'Collections',
    forms: 'Form Builder',
    results: 'Results',
    participants: 'Participants',
    companies: 'Companies',
    reports: 'Reports',
    settings: 'Settings'
  };

  const navBtn = (page: PageType, href: string, icon: React.ReactNode, label: string) => (
    <Link
      href={href}
      className={`w-full text-left flex items-center gap-3.5 px-3.5 py-3 rounded-lg text-[14px] font-medium transition-all ${currentPage === page
        ? 'bg-gradient-to-r from-[#3b82f6] to-transparent bg-[#3b82f6]/20 text-[#3b82f6] border-l-[3px] border-[#3b82f6] shadow-[inset_0_0_15px_rgba(59,130,246,0.1)]'
        : 'text-[#cbd5e1] border-l-[3px] border-transparent hover:bg-[#475569] hover:text-white'}`}
    >
      {icon} {label}
    </Link>
  );

  const pageIcon: Record<PageType, React.ReactNode> = {
    dashboard: <Home className="h-7 w-7 text-[#3b82f6]" />,
    assignments: <ListTodo className="h-7 w-7 text-[#3b82f6]" />,
    collections: <FolderIcon className="h-7 w-7 text-[#3b82f6]" />,
    forms: <FileSpreadsheet className="h-7 w-7 text-[#3b82f6]" />,
    results: <BarChart3 className="h-7 w-7 text-[#3b82f6]" />,
    participants: <Users className="h-7 w-7 text-[#3b82f6]" />,
    companies: <Building2 className="h-7 w-7 text-[#3b82f6]" />,
    reports: <FileText className="h-7 w-7 text-[#3b82f6]" />,
    settings: <Settings className="h-7 w-7 text-[#3b82f6]" />,
  };

  return (
    <div className="grid grid-cols-[280px_1fr] h-screen bg-[#0f172a] text-[#f1f5f9] overflow-hidden antialiased select-none font-sans">
      {/* SIDEBAR */}
      <aside className="bg-gradient-to-b from-[#0f172a] to-[#1a1f35] border-r border-[#475569] p-6 flex flex-col justify-between shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
        <div className="space-y-10">
          <Link href="/" className="flex items-center gap-3 text-xl font-bold tracking-tight pb-6 border-b border-[#475569] hover:opacity-80 transition-opacity">
            <GraduationCap className="h-7 w-7 text-[#3b82f6]" style={{ filter: "drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))" }} />
            <span className="tracking-tight text-white font-bold">Workinspires</span>
          </Link>

          <nav className="space-y-6">
            <div className="space-y-1">
              <p className="text-[10px] font-semibold tracking-widest text-[#94a3b8]/50 uppercase px-3 mb-3">MAIN</p>
              {navBtn('dashboard', '/dashboard', <Home className="h-[18px] w-[18px]" />, 'Dashboard')}
              {navBtn('assignments', '/assignments', <ListTodo className="h-[18px] w-[18px]" />, 'Assignments')}
              {navBtn('collections', '/collections', <FolderIcon className="h-[18px] w-[18px]" />, 'Collections')}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-semibold tracking-widest text-[#94a3b8]/50 uppercase px-3 mb-3">MANAGEMENT</p>
              {navBtn('forms', '/forms', <FileSpreadsheet className="h-[18px] w-[18px]" />, 'Form Builder')}
              {navBtn('results', '/results', <BarChart3 className="h-[18px] w-[18px]" />, 'Results')}
              {navBtn('participants', '/participants', <Users className="h-[18px] w-[18px]" />, 'Participants')}
              {navBtn('companies', '/companies', <Building2 className="h-[18px] w-[18px]" />, 'Companies')}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-semibold tracking-widest text-[#94a3b8]/50 uppercase px-3 mb-3">SYSTEM</p>
              {navBtn('reports', '/reports', <FileText className="h-[18px] w-[18px]" />, 'Reports')}
              {navBtn('settings', '/settings', <Settings className="h-[18px] w-[18px]" />, 'Settings')}
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
            {pageIcon[currentPage]}
            <h1 className="text-2xl font-bold tracking-tight text-white">{pageTitle[currentPage]}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-4 py-2.5 border border-[#475569] rounded-lg bg-[#334155] focus-within:border-[#3b82f6] transition-colors">
              <Search className="h-3.5 w-3.5 text-[#94a3b8]" />
              <input
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                placeholder="Search records..."
                className="bg-transparent border-none text-xs text-[#f1f5f9] placeholder-[#94a3b8] outline-none w-64"
              />
            </div>
            {actionButton}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#0f172a]">
          {children}
        </div>
      </main>
    </div>
  );
}
