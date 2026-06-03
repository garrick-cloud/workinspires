"use client";

import type { FormField } from '@/types/form';
import type { FormAnswerValue } from '@/types/submission';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UploadCloud } from 'lucide-react';

interface FormRendererProps {
  fields: FormField[];
  values: Record<string, FormAnswerValue>;
  onChange: (fieldId: string, value: FormAnswerValue) => void;
  disabled?: boolean;
  errors?: Record<string, string>;
}

export default function FormRenderer({
  fields,
  values,
  onChange,
  disabled = false,
  errors = {},
}: FormRendererProps) {
  const sorted = [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="space-y-5">
      {sorted.map((field, idx) => (
        <div key={field.id} className="space-y-2.5 bg-[#0f172a]/20 border border-[#475569]/20 p-4 rounded-xl">
          <div className="flex justify-between items-start gap-4">
            <Label className="text-white font-semibold text-xs block leading-snug">
              {idx + 1}. {field.label}
              {field.required && <span className="text-rose-500 font-bold"> *</span>}
            </Label>
            {(field.points ?? 0) > 0 && (
              <span className="text-[10px] font-bold font-mono text-[#3b82f6] bg-[#3b82f6]/10 px-2 py-0.5 rounded shrink-0">
                {field.points} pts
              </span>
            )}
          </div>

          {field.type === 'text_short' && (
            <Input
              value={String(values[field.id] ?? '')}
              onChange={(e) => onChange(field.id, e.target.value)}
              disabled={disabled}
              placeholder={field.placeholder || 'Your answer'}
              className="bg-[#1e293b] border-[#475569] text-xs h-9 text-white"
            />
          )}

          {field.type === 'text_long' && (
            <Textarea
              value={String(values[field.id] ?? '')}
              onChange={(e) => onChange(field.id, e.target.value)}
              disabled={disabled}
              placeholder={field.placeholder || 'Your detailed answer'}
              className="bg-[#1e293b] border-[#475569] text-xs min-h-20 text-white rounded-lg"
            />
          )}

          {field.type === 'file_upload' && (
            <div className="space-y-2">
              <label className={`flex flex-col items-center justify-center gap-2 border border-dashed border-[#475569] rounded-lg p-4 cursor-pointer hover:border-[#3b82f6]/50 transition-colors ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
                <UploadCloud className="h-5 w-5 text-[#94a3b8]" />
                <span className="text-[10px] text-[#94a3b8]">Choose a file (demo: filename stored only)</span>
                <input
                  type="file"
                  className="hidden"
                  disabled={disabled}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    onChange(field.id, file ? file.name : '');
                  }}
                />
              </label>
              {values[field.id] && (
                <p className="text-[10px] text-[#3b82f6]">Selected: {String(values[field.id])}</p>
              )}
            </div>
          )}

          {field.type === 'likert_scale' && (
            <div className="space-y-2">
              <div className="grid grid-cols-6 gap-1.5">
                {[1, 2, 3, 4, 5, 6].map((num) => {
                  const selected = values[field.id] === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      disabled={disabled}
                      onClick={() => onChange(field.id, num)}
                      className={`py-2 rounded-lg font-bold font-mono text-xs border transition-colors ${
                        selected
                          ? 'bg-[#3b82f6] border-[#3b82f6] text-white'
                          : 'bg-[#1e293b]/40 border-[#475569]/40 text-slate-400 hover:border-[#3b82f6]/50'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between font-bold text-[9px] text-slate-500 px-1">
                <span>1 — Needs improvement</span>
                <span>6 — Excellent</span>
              </div>
            </div>
          )}

          {errors[field.id] && (
            <p className="text-[10px] text-rose-400">{errors[field.id]}</p>
          )}
        </div>
      ))}
    </div>
  );
}
