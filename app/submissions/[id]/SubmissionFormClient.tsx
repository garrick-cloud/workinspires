'use client';

import { useMemo, useState } from 'react';
import { CheckCircle, ClipboardList } from 'lucide-react';
import FormRenderer from '@/components/FormRenderer';
import type { FormField } from '@/types/form';
import type { FormAnswerValue } from '@/types/submission';
import { buildAnswers, totalFromAnswers } from '@/lib/formScoring';

export interface SubmissionContext {
  id: string;
  participantName: string;
  participantEmail: string;
  status: 'Not Started' | 'In Progress' | 'Submitted';
  answers: Record<string, FormAnswerValue>;
  score: number | null;
  assignmentName: string;
  dueDate: string | null;
  formName: string;
  formDescription: string | null;
  structure: {
    formName?: string;
    description?: string;
    fields?: FormField[];
  };
  companyName: string;
}

interface Props {
  submission: SubmissionContext;
}

function initialValues(submission: SubmissionContext) {
  if (Array.isArray(submission.answers)) {
    return submission.answers.reduce<Record<string, FormAnswerValue>>((acc, answer: any) => {
      if (answer?.fieldId) acc[answer.fieldId] = answer.value ?? '';
      return acc;
    }, {});
  }

  return submission.answers ?? {};
}

export default function SubmissionFormClient({ submission }: Props) {
  const fields = useMemo(() => submission.structure?.fields ?? [], [submission.structure]);
  const [values, setValues] = useState<Record<string, FormAnswerValue>>(() => initialValues(submission));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState(submission.status);
  const [saving, setSaving] = useState(false);
  const [score, setScore] = useState<number | null>(submission.score);

  const submitted = status === 'Submitted';

  function updateValue(fieldId: string, value: FormAnswerValue) {
    setValues((current) => ({ ...current, [fieldId]: value }));
    setStatus((current) => (current === 'Not Started' ? 'In Progress' : current));
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    fields.forEach((field) => {
      const value = values[field.id];
      if (field.required && (value === undefined || value === null || String(value).trim() === '')) {
        nextErrors[field.id] = 'Required';
      }
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const answers = buildAnswers(fields, values);
    const calculatedScore = totalFromAnswers(answers);

    setSaving(true);
    try {
      const response = await fetch(`/api/submissions/${submission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, score: calculatedScore }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const saved = await response.json();
      setScore(saved.score);
      setStatus(saved.status);
    } catch (error) {
      console.error('Failed to submit evaluation.', error);
      alert('Unable to submit this evaluation. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0f172a] px-4 py-8 text-[#f8fafc]">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 rounded-lg border border-slate-800 bg-[#111827] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-300">{submission.companyName}</p>
              <h1 className="mt-1 text-2xl font-semibold">{submission.formName}</h1>
              <p className="mt-2 text-sm text-slate-300">{submission.formDescription || submission.assignmentName}</p>
            </div>
            <ClipboardList className="h-6 w-6 text-sky-300" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div className="rounded border border-slate-800 bg-slate-900 p-3">
              <p className="text-xs text-slate-500">Participant</p>
              <p className="mt-1 font-medium">{submission.participantName}</p>
            </div>
            <div className="rounded border border-slate-800 bg-slate-900 p-3">
              <p className="text-xs text-slate-500">Due Date</p>
              <p className="mt-1 font-medium">{submission.dueDate ?? 'Open'}</p>
            </div>
            <div className="rounded border border-slate-800 bg-slate-900 p-3">
              <p className="text-xs text-slate-500">Status</p>
              <p className="mt-1 font-medium">{status}</p>
            </div>
          </div>
        </header>

        {submitted ? (
          <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-6 text-center">
            <CheckCircle className="mx-auto h-10 w-10 text-emerald-300" />
            <h2 className="mt-3 text-lg font-semibold">Evaluation Submitted</h2>
            <p className="mt-2 text-sm text-emerald-100">Your score has been recorded as {score ?? 0}.</p>
          </div>
        ) : (
          <form onSubmit={submitForm} className="space-y-5 rounded-lg border border-slate-800 bg-[#111827] p-5">
            <FormRenderer fields={fields} values={values} onChange={updateValue} errors={errors} disabled={saving} />
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded bg-sky-500 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Submitting...' : 'Submit Evaluation'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
