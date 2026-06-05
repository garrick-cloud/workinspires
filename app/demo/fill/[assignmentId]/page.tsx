"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useDashboard } from '@/context/DashboardContext';
import FormRenderer from '@/components/FormRenderer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { buildAnswers, totalFromAnswers } from '@/lib/formScoring';
import type { FormAnswerValue } from '@/types/submission';
import type { FormResponse } from '@/types/submission';
import { ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { apiPost } from '@/lib/apiClient';

export default function FillFormPage() {
  const params = useParams();
  const assignmentId = params.assignmentId as string;
  const { assignments, forms, setFormResponses, setSubmissions, hydrated } = useDashboard();

  const assignment = assignments.find((a) => a.id === assignmentId);
  const form = forms.find((f) => f.id === assignment?.formBlueprintId);
  const fields = form?.structure?.fields ?? [];

  const [participantName, setParticipantName] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [values, setValues] = useState<Record<string, FormAnswerValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const maxScore = useMemo(
    () => fields.reduce((s, f) => s + (Number(f.points) || 0), 0),
    [fields]
  );

  const handleChange = (fieldId: string, value: FormAnswerValue) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!participantName.trim()) next._name = 'Please enter your name';
    fields.forEach((field) => {
      if (!field.required) return;
      const v = values[field.id];
      if (field.type === 'likert_scale') {
        if (typeof v !== 'number') next[field.id] = 'Please select a rating';
      } else if (!String(v ?? '').trim()) {
        next[field.id] = 'This field is required';
      }
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment || !form || !validate()) return;

    setSubmitting(true);
    const answers = buildAnswers(fields, values);
    const totalScore = totalFromAnswers(answers);
    const now = new Date().toISOString();

    const response: FormResponse = {
      id: `resp_${Date.now()}`,
      formBlueprintId: form.id,
      formName: form.name,
      assignmentId: assignment.id,
      assignmentName: assignment.name,
      participantName: participantName.trim(),
      participantEmail: participantEmail.trim() || undefined,
      answers,
      totalScore,
      maxScore,
      submittedAt: now,
    };

    const savedResponse = await apiPost<FormResponse>('/api/form-responses', response);

    setFormResponses((prev) => [savedResponse, ...prev]);
    setSubmissions((prev) => [
      {
        id: savedResponse.id,
        participantName: savedResponse.participantName,
        program: assignment.formName,
        assignmentName: assignment.name,
        score: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : null,
        status: 'Completed',
        progress: 100,
      },
      ...prev,
    ]);

    setSubmitted(true);
    setSubmitting(false);
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#94a3b8] text-sm">
        Loading…
      </div>
    );
  }

  if (!assignment || !form?.structure?.fields?.length) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-[#94a3b8]">This assignment is not available or has no form fields.</p>
        <Link href="/demo">
          <Button className="bg-[#1e293b] border border-[#475569]">Back to demo</Button>
        </Link>
      </div>
    );
  }

  if (submitted) {
    const answers = buildAnswers(fields, values);
    const totalScore = totalFromAnswers(answers);
    return (
      <div className="min-h-screen bg-[#0f172a] text-[#f1f5f9] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#1e293b] border border-[#475569] rounded-xl p-8 text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
          <h1 className="text-xl font-bold text-white">Submission received</h1>
          <p className="text-sm text-[#94a3b8]">
            Thank you, {participantName}. Your responses for <strong className="text-white">{assignment.name}</strong> were saved.
          </p>
          {maxScore > 0 && (
            <p className="text-[#3b82f6] font-mono font-bold">
              Score: {totalScore} / {maxScore} pts
            </p>
          )}
          <div className="flex flex-col gap-2 pt-2">
            <Link href="/demo">
              <Button className="w-full bg-gradient-to-r from-[#3b82f6] to-[#4291f7] text-white border-none">
                Back to demo hub
              </Button>
            </Link>
            <Link href="/demo/responses">
              <Button variant="outline" className="w-full border-[#475569] bg-transparent text-[#cbd5e1]">
                View all submissions (admin)
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f1f5f9] py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* <Link href="/demo" className="inline-flex items-center gap-1.5 text-[#94a3b8] hover:text-white text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to published forms
        </Link> */}

        <div className="space-y-1">
          <h1 className="text-xl font-bold text-white">{form.structure?.formName || form.name}</h1>
          <p className="text-sm text-[#94a3b8]">{form.structure?.description || form.description}</p>
          <p className="text-[10px] text-[#64748b]">Assignment: {assignment.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#1e293b] border border-[#475569] rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#3b82f6]">Your details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-white text-xs">Full name *</Label>
                <Input
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  className="bg-[#334155] border-[#475569] h-9 text-white text-xs"
                  placeholder="e.g. Alex Tan"
                />
                {errors._name && <p className="text-[10px] text-rose-400">{errors._name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-white text-xs">Email (optional)</Label>
                <Input
                  type="email"
                  value={participantEmail}
                  onChange={(e) => setParticipantEmail(e.target.value)}
                  className="bg-[#334155] border-[#475569] h-9 text-white text-xs"
                  placeholder="you@company.com"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#1a1f35] border border-[#3b82f6]/20 rounded-xl p-5 sm:p-6 space-y-6">
            <FormRenderer fields={fields} values={values} onChange={handleChange} errors={errors} />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={submitting}
              className="bg-gradient-to-r from-[#3b82f6] to-[#4291f7] text-white border-none h-11 px-6"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? 'Submitting…' : 'Submit form'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
