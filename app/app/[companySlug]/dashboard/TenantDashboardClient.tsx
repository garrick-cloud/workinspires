'use client';

import { useMemo } from 'react';
import { Download, LockKeyhole, ClipboardCheck, Clock, Star, Users } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { TenantCompany } from '@/lib/tenant';

export interface DashboardSubmission {
  id: string;
  participantName: string;
  participantEmail: string;
  program: string;
  assignmentName: string;
  status: 'Not Started' | 'In Progress' | 'Submitted';
  score: number | null;
  reviewedAt: string | null;
}

interface Props {
  company: TenantCompany;
  totalParticipants: number;
  submissions: DashboardSubmission[];
}

function StatusBadge({ status }: { status: DashboardSubmission['status'] }) {
  const styles = {
    Submitted: 'border-emerald-800 bg-emerald-950/40 text-emerald-300',
    'In Progress': 'border-amber-800 bg-amber-950/40 text-amber-300',
    'Not Started': 'border-slate-700 bg-slate-900/50 text-slate-300',
  };

  return <span className={`rounded border px-2 py-1 text-xs ${styles[status]}`}>{status}</span>;
}

export default function TenantDashboardClient({ company, totalParticipants, submissions }: Props) {
  const metrics = useMemo(() => {
    const submitted = submissions.filter((submission) => submission.status === 'Submitted');
    const avgScore =
      submitted.length > 0
        ? Math.round(
            submitted.reduce((sum, submission) => sum + (submission.score ?? 0), 0) / submitted.length
          )
        : 0;

    return {
      submitted: submitted.length,
      pending: submissions.length - submitted.length,
      completionRate: submissions.length > 0 ? Math.round((submitted.length / submissions.length) * 100) : 0,
      avgScore,
    };
  }, [submissions]);

  function downloadReport(submission: DashboardSubmission) {
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 34, 'F');
    doc.setTextColor(248, 250, 252);
    doc.setFontSize(18);
    doc.text('WorkInspire Evaluation Report', 14, 20);
    doc.setFontSize(10);
    doc.text(company.name, 14, 28);

    autoTable(doc, {
      startY: 46,
      theme: 'grid',
      head: [['Field', 'Value']],
      body: [
        ['Name', submission.participantName],
        ['Program', submission.program],
        ['Assignment', submission.assignmentName],
        ['Score', submission.score === null ? 'Pending' : `${submission.score}`],
        ['Date', submission.reviewedAt ?? 'Not reviewed'],
      ],
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [30, 41, 59], textColor: [248, 250, 252] },
      alternateRowStyles: { fillColor: [241, 245, 249] },
    });

    doc.save(`${submission.participantName.replace(/\s+/g, '-')}-${submission.id}.pdf`);
  }

  return (
    <main className="min-h-screen bg-[#0f172a] text-[#f8fafc]">
      <header className="border-b border-slate-800 bg-[#111827] px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-300">{company.slug}</p>
            <h1 className="mt-1 text-2xl font-semibold">WorkInspire Dashboard</h1>
          </div>
          <div className="flex items-center gap-2 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300">
            <LockKeyhole className="h-4 w-4 text-sky-300" />
            Tenant isolated
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            { label: 'Participants', value: totalParticipants, icon: <Users className="h-5 w-5" /> },
            { label: 'Submitted', value: metrics.submitted, icon: <ClipboardCheck className="h-5 w-5" /> },
            { label: 'Completion', value: `${metrics.completionRate}%`, icon: <Clock className="h-5 w-5" /> },
            { label: 'Avg Score', value: metrics.avgScore, icon: <Star className="h-5 w-5" /> },
          ].map((metric) => (
            <div key={metric.label} className="rounded-lg border border-slate-800 bg-[#1e293b] p-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs uppercase tracking-wider">{metric.label}</span>
                {metric.icon}
              </div>
              <p className="mt-3 text-2xl font-semibold text-white">{metric.value}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-800 bg-[#111827]">
          <div className="border-b border-slate-800 px-4 py-3">
            <h2 className="text-sm font-semibold">Submission Tracking Sheet</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-950/70 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Program</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {submissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-slate-900/60">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{submission.participantName}</p>
                      <p className="text-xs text-slate-500">{submission.participantEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{submission.program}</td>
                    <td className="px-4 py-3 text-slate-300">{submission.score ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{submission.reviewedAt ?? '-'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={submission.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => downloadReport(submission)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded border border-slate-700 bg-slate-900 text-sky-300 hover:border-sky-500"
                        title="Download PDF report"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {submissions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                      No submission rows exist for this company yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
