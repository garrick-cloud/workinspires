"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useDashboard } from '@/context/DashboardContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { apiDelete } from '@/lib/apiClient';

export default function FormResponsesPage() {
  const { formResponses, setFormResponses, hydrated } = useDashboard();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (confirm('Delete this submission?')) {
      await apiDelete(`/api/form-responses/${id}`);
      setFormResponses((prev) => prev.filter((r) => r.id !== id));
    }
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#94a3b8] text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f1f5f9] py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4 border-b border-[#475569]/30 pb-5">
          <div>
            <h1 className="text-xl font-bold text-white">Form submissions</h1>
            <p className="text-[11px] text-[#94a3b8] mt-1">Responses saved when participants submit published forms.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/demo">
              <Button className="bg-[#1e293b] border border-[#475569] text-[#cbd5e1] h-9">
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Demo hub
              </Button>
            </Link>
            <Link href="/forms">
              <Button className="bg-[#334155] border border-[#475569] text-white h-9">Form Builder</Button>
            </Link>
          </div>
        </div>

        <div className="bg-[#1e293b] border border-[#475569] rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-[#475569]">
              <TableRow className="border-[#475569] hover:bg-transparent">
                <TableHead className="text-[#cbd5e1] text-xs">Participant</TableHead>
                <TableHead className="text-[#cbd5e1] text-xs">Assignment</TableHead>
                <TableHead className="text-[#cbd5e1] text-xs">Form</TableHead>
                <TableHead className="text-[#cbd5e1] text-xs">Score</TableHead>
                <TableHead className="text-[#cbd5e1] text-xs">Submitted</TableHead>
                <TableHead className="text-[#cbd5e1] text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formResponses.map((r) => (
                <React.Fragment key={r.id}>
                  <TableRow className="border-[#475569]/30 hover:bg-[#475569]/10">
                    <TableCell className="text-white text-xs font-medium">{r.participantName}</TableCell>
                    <TableCell className="text-[#94a3b8] text-xs">{r.assignmentName}</TableCell>
                    <TableCell className="text-[#94a3b8] text-xs">{r.formName}</TableCell>
                    <TableCell className="text-[#3b82f6] font-mono text-xs font-bold">
                      {r.maxScore > 0 ? `${r.totalScore}/${r.maxScore}` : '—'}
                    </TableCell>
                    <TableCell className="text-[#94a3b8] text-[10px]">
                      {new Date(r.submittedAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                          className="h-8 w-8 p-0 bg-[#334155] border border-[#475569]"
                        >
                          {expandedId === r.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDelete(r.id)}
                          className="h-8 w-8 p-0 bg-rose-950/20 border border-rose-900/40 text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedId === r.id && (
                    <TableRow className="border-[#475569]/30 bg-[#0f172a]/40">
                      <TableCell colSpan={6} className="py-4">
                        <ul className="space-y-2 text-xs">
                          {r.answers.map((a) => (
                            <li key={a.fieldId} className="flex flex-col sm:flex-row sm:gap-4 border-b border-[#475569]/20 pb-2 last:border-0">
                              <span className="text-[#94a3b8] shrink-0 sm:w-48">{a.label}</span>
                              <span className="text-white font-mono">{String(a.value)}</span>
                              {(a.pointsEarned ?? 0) > 0 && (
                                <span className="text-[#3b82f6] text-[10px]">{a.pointsEarned} pts</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
              {formResponses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-[#94a3b8] py-12 text-sm">
                    No submissions yet. Publish a form and fill it from the{' '}
                    <Link href="/demo" className="text-[#3b82f6] hover:underline">demo hub</Link>.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
