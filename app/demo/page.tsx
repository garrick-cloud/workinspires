"use client";

import React from 'react';
import Link from 'next/link';
import { useDashboard } from '@/context/DashboardContext';
import { Button } from '@/components/ui/button';
import { ClipboardList, ArrowLeft, ExternalLink, CheckCircle2 } from 'lucide-react';

export default function DemoHubPage() {
  const { assignments, forms, formResponses, hydrated } = useDashboard();

  const published = assignments.filter((a) => a.published && a.status === 'Enabled');

  const getForm = (formBlueprintId: string) =>
    forms.find((f) => f.id === formBlueprintId);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#94a3b8] text-sm">
        Loading demo data…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f1f5f9]">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#475569]/30 pb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#3b82f6] mb-1">Participant demo</p>
            <h1 className="text-2xl font-bold text-white">Fill & submit published forms</h1>
            <p className="text-[#94a3b8] text-sm mt-1">
              An admin creates a template in Form Builder, publishes it, then you complete it here.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/forms">
              <Button variant="outline" className="border-[#475569] bg-[#1e293b] text-[#cbd5e1] hover:bg-[#334155] h-9">
                <ArrowLeft className="h-4 w-4 mr-1.5" /> Admin: Form Builder
              </Button>
            </Link>
            <Link href="/demo/responses">
              <Button className="bg-[#334155] border border-[#475569] text-white h-9 hover:bg-[#475569]">
                View submissions ({formResponses.length})
              </Button>
            </Link>
          </div>
        </div>

        <div className="bg-[#1e293b]/60 border border-[#475569]/40 rounded-xl p-4 text-[11px] text-[#94a3b8] leading-relaxed">
          <strong className="text-white">How to try the demo:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Go to <Link href="/forms" className="text-[#3b82f6] hover:underline">Form Builder</Link> and create a template with at least one field.</li>
            <li>Click <strong className="text-white">Publish to demo</strong> on that template.</li>
            <li>Return here and open the published assignment to fill and submit.</li>
          </ol>
        </div>

        <section className="space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-[#3b82f6]" />
            Published assignments ({published.length})
          </h2>

          {published.length === 0 ? (
            <div className="border border-dashed border-[#475569] rounded-xl p-10 text-center text-[#94a3b8] text-sm">
              No published forms yet. Create and publish a template from Form Builder.
            </div>
          ) : (
            <ul className="space-y-3">
              {published.map((assignment) => {
                const form = getForm(assignment.formBlueprintId);
                const fieldCount = form?.structure?.fields?.length ?? 0;
                const responseCount = formResponses.filter((r) => r.assignmentId === assignment.id).length;

                return (
                  <li
                    key={assignment.id}
                    className="bg-gradient-to-r from-[#1e293b] to-[#334155]/80 border border-[#475569] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-bold text-white truncate">{assignment.name}</h3>
                      <p className="text-[11px] text-[#94a3b8]">
                        Template: {assignment.formName} · {fieldCount} field{fieldCount !== 1 ? 's' : ''}
                        {assignment.publishedAt && ` · Published ${assignment.publishedAt}`}
                      </p>
                      {responseCount > 0 && (
                        <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> {responseCount} submission{responseCount !== 1 ? 's' : ''} received
                        </p>
                      )}
                    </div>
                    <Link href={`/demo/fill/${assignment.id}`}>
                      <Button className="bg-gradient-to-r from-[#3b82f6] to-[#4291f7] text-white border-none shrink-0">
                        <ExternalLink className="h-4 w-4 mr-1.5" /> Fill form
                      </Button>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
