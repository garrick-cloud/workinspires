'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Home, ListTodo, Folder, FileSpreadsheet, BarChart3, Users,
  Building2, FileText, Settings, GraduationCap, Search, Plus,
  Folder as FolderIcon, ChevronRight, LogOut
} from 'lucide-react';
import { useAppContext } from '@/lib/AppContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type PageType = 'dashboard' | 'assignments' | 'collections' | 'forms' | 'results' | 'participants' | 'companies' | 'reports' | 'settings';

interface AppLayoutProps {
  currentPage: PageType;
  title: string;
  children: ReactNode;
  actionButton?: ReactNode;
}

const pageConfig: Record<PageType, { label: string; icon: React.ReactNode; href: string }> = {
  dashboard: { label: 'Dashboard', icon: <Home className="h-4 w-4" />, href: '/dashboard' },
  assignments: { label: 'Assignments', icon: <ListTodo className="h-4 w-4" />, href: '/assignments' },
  collections: { label: 'Collections', icon: <FolderIcon className="h-4 w-4" />, href: '/collections' },
  forms: { label: 'Form Builder', icon: <FileSpreadsheet className="h-4 w-4" />, href: '/forms' },
  results: { label: 'Results', icon: <BarChart3 className="h-4 w-4" />, href: '/results' },
  participants: { label: 'Participants', icon: <Users className="h-4 w-4" />, href: '/participants' },
  companies: { label: 'Companies', icon: <Building2 className="h-4 w-4" />, href: '/companies' },
  reports: { label: 'Reports', icon: <FileText className="h-4 w-4" />, href: '/reports' },
  settings: { label: 'Settings', icon: <Settings className="h-4 w-4" />, href: '/settings' },
};

const mainPages: PageType[] = ['dashboard', 'assignments', 'collections'];
const managementPages: PageType[] = ['forms', 'results', 'participants', 'companies'];
const systemPages: PageType[] = ['reports', 'settings'];

export default function AppLayout({
  currentPage,
  title,
  children,
  actionButton,
}: AppLayoutProps) {
  const router = useRouter();
  const { globalSearchQuery, setGlobalSearchQuery } = useAppContext();

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        {/* Sidebar */}
        <Sidebar className="border-r border-sidebar-border">
          <SidebarHeader className="border-b border-sidebar-border">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity">
              <GraduationCap className="h-6 w-6 text-sidebar-primary" />
              <span className="text-sidebar-foreground">Workinspires</span>
            </Link>
          </SidebarHeader>

          <SidebarContent>
            {/* Main Section */}
            <SidebarGroup>
              <SidebarGroupLabel>MAIN</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainPages.map((page) => (
                    <SidebarMenuItem key={page}>
                      <SidebarMenuButton
                        asChild
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        <Link href={pageConfig[page].href} className="flex items-center gap-2">
                          {pageConfig[page].icon}
                          <span>{pageConfig[page].label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Management Section */}
            <SidebarGroup>
              <SidebarGroupLabel>MANAGEMENT</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {managementPages.map((page) => (
                    <SidebarMenuItem key={page}>
                      <SidebarMenuButton
                        asChild
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        <Link href={pageConfig[page].href} className="flex items-center gap-2">
                          {pageConfig[page].icon}
                          <span>{pageConfig[page].label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* System Section */}
            <SidebarGroup>
              <SidebarGroupLabel>SYSTEM</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {systemPages.map((page) => (
                    <SidebarMenuItem key={page}>
                      <SidebarMenuButton
                        asChild
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        <Link href={pageConfig[page].href} className="flex items-center gap-2">
                          {pageConfig[page].icon}
                          <span>{pageConfig[page].label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <div className="flex items-center gap-3 px-2 py-3 rounded-lg bg-sidebar-accent/10 border border-sidebar-border">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-sidebar-primary to-sidebar-primary/60 flex items-center justify-center font-bold text-xs text-sidebar-primary-foreground">
                AD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-sidebar-foreground truncate">Admin</p>
                <p className="text-[11px] text-sidebar-foreground/60 truncate">Platform Admin</p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <SidebarInset>
          {/* Header */}
          <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
            <div className="flex items-center gap-3 flex-1">
              <SidebarTrigger className="-ml-1" />
              <div className="flex items-center gap-2">
                {pageConfig[currentPage].icon}
                <h1 className="text-xl font-semibold text-foreground">{title || pageConfig[currentPage].label}</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 border border-input rounded-lg bg-muted/50 focus-within:border-primary transition-colors">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  placeholder="Search records..."
                  className="bg-transparent border-none text-sm text-foreground placeholder-muted-foreground outline-none w-48"
                />
              </div>
              {actionButton}
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
