// src/features/forms/components/FormBuilderPage.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { FormField, FormFieldType, FormBlueprint } from '@/types/form';
import type { FormAnswerValue } from '@/types/submission';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, Trash2, Move, Type, AlignLeft, UploadCloud, SlidersHorizontal, Award, ShieldAlert, ArrowLeft, Eye, Edit2, CheckCircle2, FlaskConical
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiDelete, apiPost, apiPut } from '@/lib/apiClient';
import FormRenderer from '@/components/FormRenderer';
import { buildAnswers, totalFromAnswers } from '@/lib/formScoring';

type StudioViewState = 'listings' | 'builder' | 'viewer' | 'demo';

export default function FormBuilderPage() {
  const { forms, setForms, setCurrentPage } = useDashboard();
  const router = useRouter();
  
  // Workspace UI Layout View Controller state
  const [viewState, setViewState] = useState<StudioViewState>('listings');
  const [currentEditingId, setCurrentEditingId] = useState<string | null>(null);

  // Builder Canvas Configuration states (Completely scrubbed and empty)
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [canvasFields, setCanvasFields] = useState<FormField[]>([]);

  // Selected JSON Inspector viewer target placeholder state
  const [viewingFormBlueprint, setViewingFormBlueprint] = useState<FormBlueprint | null>(null);
  const [demoFormBlueprint, setDemoFormBlueprint] = useState<FormBlueprint | null>(null);
  const [demoValues, setDemoValues] = useState<Record<string, FormAnswerValue>>({});
  const [demoErrors, setDemoErrors] = useState<Record<string, string>>({});
  const [demoResultJson, setDemoResultJson] = useState<string | null>(null);

  // Available toolbox drag items palette configuration definition
  const toolBoxItems = [
    { type: 'text_short', label: 'Short Text Input', icon: Type, desc: 'Single line text string entries' },
    { type: 'text_long', label: 'Long Textarea', icon: AlignLeft, desc: 'Qualitative details paragraphs' },
    { type: 'file_upload', label: 'File Upload Tray', icon: UploadCloud, desc: 'Upload documents (.pdf, .pptx)' },
    { type: 'likert_scale', label: 'Likert Evaluation Matrix', icon: SlidersHorizontal, desc: 'Weighted score tracker metric gauge (1-6)' },
  ];

  // ==========================================
  // DRAG & DROP PIPELINES (INLINE CANVAS ENGINE)
  // ==========================================
  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData("text/plain", type);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("text/plain") as FormFieldType;
    if (type) addFieldToCanvas(type);
  };

  const addFieldToCanvas = (type: FormFieldType) => {
    const defaultLabels: Partial<Record<FormFieldType, string>> = {
      text_short: "New Short Text Question Prompt",
      text_long: "New Long Form Reflection Prompt",
      file_upload: "Please upload your practical execution materials asset:",
      likert_scale: "Rate the candidate's core group performance parameter capabilities:"
    };

    const newField: FormField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      label: defaultLabels[type] ?? 'New question',
      required: true,
      order: canvasFields.length + 1,
      points: 1,
    };

    setCanvasFields(prev => [...prev, newField]);
  };

  const updateFieldProperty = (id: string, property: keyof FormField, value: any) => {
    setCanvasFields(prev => prev.map(f => f.id === id ? { ...f, [property]: value } : f));
  };

  const removeFieldFromCanvas = (id: string) => {
    setCanvasFields(prev => prev.filter(f => f.id !== id));
  };

  const totalMaxScoreCalculated = useMemo(() => {
    return canvasFields.reduce((sum, f) => sum + (Number(f.points) || 0), 0);
  }, [canvasFields]);

  // ==========================================
  // DIRECTORY CRUD MANAGEMENT PIPELINES
  // ==========================================
  const handleLaunchCreateNewForm = () => {
    setCurrentEditingId(null);
    setFormName('');
    setFormDesc('');
    setCanvasFields([]);
    setViewState('builder');
  };

  const handleLaunchEditForm = (blueprint: FormBlueprint) => {
    setCurrentEditingId(blueprint.id);
    setFormName(blueprint.name);
    setFormDesc(blueprint.description || '');
    setCanvasFields(blueprint.structure?.fields || []);
    setViewState('builder');
  };

  const handleLaunchInspectorViewer = (blueprint: FormBlueprint) => {
    setViewingFormBlueprint(blueprint);
    setViewState('viewer');
  };

  const handleLaunchDemoTester = (blueprint: FormBlueprint) => {
    setDemoFormBlueprint(blueprint);
    setDemoValues({});
    setDemoErrors({});
    setDemoResultJson(null);
    setViewState('demo');
  };

  const handleDemoValueChange = (fieldId: string, value: FormAnswerValue) => {
    setDemoValues((prev) => ({ ...prev, [fieldId]: value }));
    setDemoErrors((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  const handleRunDemoSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoFormBlueprint) return;

    const fields = demoFormBlueprint.structure?.fields ?? [];
    const nextErrors: Record<string, string> = {};

    fields.forEach((field) => {
      if (!field.required) return;

      const value = demoValues[field.id];
      if (field.type === 'likert_scale') {
        if (typeof value !== 'number') nextErrors[field.id] = 'Select a rating to test validation.';
      } else if (!String(value ?? '').trim()) {
        nextErrors[field.id] = 'Enter a sample value to test validation.';
      }
    });

    setDemoErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setDemoResultJson(null);
      return;
    }

    const answers = buildAnswers(fields, demoValues);
    const totalScore = totalFromAnswers(answers);
    const maxScore = fields.reduce((sum, field) => sum + (Number(field.points) || 0), 0);

    setDemoResultJson(JSON.stringify({
      mode: 'admin_template_test',
      persisted: false,
      formBlueprintId: demoFormBlueprint.id,
      formName: demoFormBlueprint.name,
      answers,
      totalScore,
      maxScore,
      testedAt: new Date().toISOString(),
    }, null, 2));
  };

  const handleDeleteFormBlueprintRecord = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this form template schema specification blueprint?")) {
      await apiDelete(`/api/forms/${id}`);
      setForms(forms.filter(f => f.id !== id));
    }
  };

  const handleExitToMainDashboard = () => {
    setViewState('listings'); 
    setCurrentPage('dashboard'); // Updates the layout state at context layer smoothly
    router.push('/'); // absolute redirection strategy push
  };

  const handleCompileAndSaveSchema = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || canvasFields.length === 0) {
      alert("Validation Error: Please specify a Title Configuration and arrange structural components on the layout canvas space.");
      return;
    }

    if (currentEditingId) {
      // Execute UPDATE CRUD mutations
      const currentForm = forms.find((f) => f.id === currentEditingId);
      if (!currentForm) return;

      const savedForm = await apiPut<FormBlueprint>(`/api/forms/${currentEditingId}`, {
        ...currentForm,
        name: formName,
        description: formDesc,
        questionCount: canvasFields.length,
        maxPossibleScore: totalMaxScoreCalculated,
        structure: { formName, description: formDesc, fields: canvasFields }
      });

      setForms(forms.map(f => f.id === currentEditingId ? savedForm : f));
    } else {
      // Execute CREATE template registration
      const completedBlueprint: FormBlueprint = {
        id: `form_${Date.now()}`,
        name: formName,
        type: "Custom Dynamic Form JSON Schema",
        questionCount: canvasFields.length,
        maxPossibleScore: totalMaxScoreCalculated,
        created: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        status: 'Enabled',
        description: formDesc,
        structure: { formName, description: formDesc, fields: canvasFields }
      };
      const savedForm = await apiPost<FormBlueprint>('/api/forms', completedBlueprint);
      setForms([savedForm, ...forms]);
    }

    setViewState('listings');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 duration-200 animate-in fade-in text-xs text-[#f1f5f9] min-w-0">
      
      {/* ==========================================
          VIEW STATE CONTROLLER 1: DIRECTORY LOOKUP TABLE INDEX
          ========================================== */}
      {viewState === 'listings' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-[#475569]/30 pb-5">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white tracking-tight">Form Evaluation Template Engine</h2>
              <p className="text-[#94a3b8] text-[11px]">Compile dynamic input schemas containing custom points matrix profiles.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
              <Button type="button" onClick={handleExitToMainDashboard} className="bg-[#1e293b] border border-[#475569] text-[#cbd5e1] hover:bg-[#334155] hover:text-white h-10 px-4 flex items-center gap-2 font-medium transition-colors">
                <ArrowLeft className="h-4 w-4" /> Exit to Dashboard
              </Button>
              <Button onClick={handleLaunchCreateNewForm} className="bg-gradient-to-r from-[#3b82f6] to-[#4291f7] text-white font-semibold shadow-md border-none h-10 px-4 transition-opacity hover:opacity-90">
                <Plus className="h-4 w-4 mr-1.5" /> Create New Form Template
              </Button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1e293b] to-[#334155] border border-[#475569] rounded-xl p-5 sm:p-6 shadow-md overflow-hidden">
            <div className="w-full overflow-x-auto rounded-xl border border-[#475569]/20">
              <Table className="text-xs min-w-[850px]">
                <TableHeader className="bg-[#475569]">
                  <TableRow className="hover:bg-transparent border-[#475569]">
                    <TableHead className="text-[#cbd5e1] font-semibold py-3.5 pl-4">Blueprint Spec Name</TableHead>
                    <TableHead className="text-[#cbd5e1] font-semibold">Logical Data Schema</TableHead>
                    <TableHead className="text-[#cbd5e1] font-semibold">Active Elements</TableHead>
                    <TableHead className="text-[#cbd5e1] font-semibold">Max Evaluation Points</TableHead>
                    <TableHead className="text-[#cbd5e1] font-semibold">Date Initialized</TableHead>
                    <TableHead className="text-[#cbd5e1] font-semibold">Status</TableHead>
                    <TableHead className="text-[#cbd5e1] font-semibold text-right pr-6">Directory Actions (CRUD)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forms.map(form => (
                    <TableRow key={form.id} className="border-b border-[#475569]/30 hover:bg-[#475569]/20 transition-colors">
                      <TableCell className="font-bold text-white py-4 pl-4 max-w-[220px] truncate">{form.name}</TableCell>
                      <TableCell className="text-[#94a3b8] font-mono text-[10px]">{form.type}</TableCell>
                      <TableCell className="text-[#cbd5e1]">{form.questionCount || (form.structure?.fields?.length || 0)} elements</TableCell>
                      <TableCell className="text-[#3b82f6] font-bold">
                        {form.maxPossibleScore || form.structure?.fields?.reduce((s, f) => s + (f.points || 0), 0) || 0} Max Pts
                      </TableCell>
                      <TableCell className="text-[#94a3b8]">{form.created}</TableCell>
                      <TableCell>
                        {form.status === 'Enabled' ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded">Enabled</span>
                        ) : (
                          <span className="text-[10px] text-[#64748b]">Disabled</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 text-right pr-4">
                        <div className="flex justify-end gap-2 flex-wrap">
                          <Button size="sm" onClick={() => handleLaunchInspectorViewer(form)} className="bg-[#334155] border border-[#475569] h-8 w-8 p-0 text-[#3b82f6] hover:bg-[#475569] transition-colors"><Eye className="h-4 w-4" /></Button>
                          <Button
                            size="sm"
                            onClick={() => handleLaunchDemoTester(form)}
                            disabled={!form.structure?.fields?.length}
                            className="bg-[#334155] border border-[#475569] h-8 w-8 p-0 text-emerald-400 hover:bg-[#475569] transition-colors disabled:opacity-40"
                            title="Test template"
                          >
                            <FlaskConical className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" onClick={() => handleLaunchEditForm(form)} className="bg-[#334155] border border-[#475569] h-8 w-8 p-0 text-white hover:bg-[#475569] transition-colors"><Edit2 className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" onClick={() => handleDeleteFormBlueprintRecord(form.id)} className="bg-rose-950/20 border border-rose-900/40 text-rose-400 hover:bg-rose-900/30 h-8 w-8 p-0 transition-colors"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {forms.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-[#94a3b8] py-16 bg-[#0f172a]/20 font-medium">
                        No customized configurations discovered in local state context registers. Launch the studio engine above to begin building.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          VIEW STATE CONTROLLER 2: CONSOLIDATED INLINE DRAG-AND-DROP WORKSPACE Studio
          ========================================== */}
      {viewState === 'builder' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-[#475569]/30 pb-5">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white tracking-tight">{currentEditingId ? 'Modify Layout Template Configuration' : 'Initialize Workspace Studio'}</h2>
              <p className="text-[#94a3b8] text-[11px]">Arrange input blocks array configurations to compile custom JSON data targets.</p>
            </div>
            <Button type="button" onClick={() => setViewState('listings')} className="bg-[#1e293b] border border-[#475569] text-[#cbd5e1] hover:bg-[#334155] hover:text-white h-10 px-4 flex items-center gap-2 font-medium self-start sm:self-center transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Listings
            </Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6 items-start">
            
            {/* ELEMENT DRAGGABLE DRAWERS BLOCK */}
            <div className="space-y-4">
              <div className="bg-[#1e293b] border border-[#475569] rounded-xl p-4 space-y-3 shadow-md xl:sticky xl:top-6">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Move className="h-3.5 w-3.5 text-[#3b82f6]" /> Component Elements Shelf
                </h3>
                <p className="text-[#94a3b8] text-[11px] leading-relaxed">Drag components directly into the target drop zone block layout to build schemas.</p>
                <div className="space-y-2.5 pt-2">
                  {toolBoxItems.map(item => {
                    const Icon = item.icon;
                    return (
                      <div 
                        key={item.type}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.type)}
                        onClick={() => addFieldToCanvas(item.type as FormFieldType)}
                        className="bg-[#334155]/40 border border-[#475569] rounded-xl p-3 flex items-center justify-between cursor-grab active:cursor-grabbing hover:border-[#3b82f6] transition-all group select-none hover:bg-[#334155]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-[#334155] p-2 rounded-lg group-hover:bg-[#3b82f6]/10 transition-colors">
                            <Icon className="h-4 w-4 text-[#94a3b8] group-hover:text-[#3b82f6] transition-colors" />
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs">{item.label}</p>
                            <p className="text-[10px] text-[#94a3b8] truncate w-36">{item.desc}</p>
                          </div>
                        </div>
                        <Plus className="h-4 w-4 text-[#94a3b8] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-white" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* CANVAS INTERACTIVE TARGET GRID */}
            <form onSubmit={handleCompileAndSaveSchema} className="space-y-6 w-full min-w-0">
              <div className="bg-[#1e293b] border border-[#475569] rounded-xl p-5 sm:p-6 shadow-md space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0f172a]/30 p-4 rounded-xl border border-[#475569]/20">
                  <div className="space-y-1.5">
                    <Label className="text-white font-semibold">Form Title Specification Context *</Label>
                    <Input required placeholder="e.g., Q3 Peer Appraisal Form" value={formName} onChange={(e) => setFormName(e.target.value)} className="bg-[#334155] border-[#475569] h-10 text-white placeholder-[#94a3b8]/30" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-white font-semibold">Strategic Objective Description Target</Label>
                    <Input placeholder="e.g., Criteria tracking indicators validation mapping array..." value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="bg-[#334155] border-[#475569] h-10 text-white placeholder-[#94a3b8]/30" />
                  </div>
                </div>

                <div className="bg-[#3b82f6]/10 border border-dashed border-[#3b82f6]/40 p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Award className="h-5 w-5 text-[#3b82f6] shrink-0" />
                    <div>
                      <p className="font-bold text-white text-xs">Dynamic Schema Points Sync Matrix Active</p>
                      <p className="text-[11px] text-[#94a3b8]">Adjust field weights components parameters to generate aggregate evaluation scales variables.</p>
                    </div>
                  </div>
                  <div className="bg-[#3b82f6] text-white font-mono px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap text-center">
                    {totalMaxScoreCalculated} Aggregate Canvas Points
                  </div>
                </div>

                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-4 sm:p-6 min-h-[400px] space-y-4 transition-colors ${canvasFields.length === 0 ? 'border-[#475569] bg-[#0f172a]/20 flex flex-col items-center justify-center text-center' : 'border-[#3b82f6]/40 bg-[#0f172a]/10'}`}
                >
                  {canvasFields.length === 0 ? (
                    <div className="space-y-2 max-w-sm pointer-events-none p-4">
                      <ShieldAlert className="h-8 w-8 text-[#475569] mx-auto mb-2" />
                      <p className="font-bold text-white text-sm">The Layout Canvas Target Grid is Empty</p>
                      <p className="text-[11px] text-[#94a3b8] leading-relaxed">Arrange element components onto this surface interface to map database values parameters nodes.</p>
                    </div>
                  ) : (
                    canvasFields.map((field, index) => (
                      <div key={field.id} className="bg-gradient-to-r from-[#1e293b] to-[#334155] border border-[#475569] rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm border-none bg-[#334155]/30">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="text-slate-500 font-mono text-xs font-bold pt-2.5 w-4 shrink-0">{index + 1}</div>
                          <div className="space-y-2.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-[#3b82f6] bg-[#3b82f6]/10 px-2 py-0.5 rounded">
                                {field.type.replace('_', ' ')} Element
                              </span>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] text-slate-400 font-semibold">Prompt Question Input Display Label String</Label>
                              <Input value={field.label} onChange={(e) => updateFieldProperty(field.id, 'label', e.target.value)} className="bg-[#0f172a]/40 border-[#475569] h-9 text-xs text-white focus-visible:ring-[#3b82f6]" required />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 bg-[#0f172a]/20 border border-[#475569]/20 p-2.5 rounded-xl w-full md:w-auto shrink-0 justify-between">
                          <div className="space-y-1">
                            <Label className="text-[9px] text-slate-400 uppercase font-bold block">Evaluation Weight</Label>
                            <div className="flex items-center gap-1.5">
                              <Input type="number" min={0} value={field.points} onChange={(e) => updateFieldProperty(field.id, 'points', parseInt(e.target.value) || 0)} className="bg-[#334155] border-[#475569] h-8 text-xs text-center font-bold text-[#60a5fa] w-14 focus-visible:ring-[#3b82f6]" />
                              <span className="text-[10px] text-[#94a3b8] font-bold">Pts</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-center space-y-1 border-l border-[#475569]/30 pl-4">
                            <span className="text-[9px] text-slate-400 uppercase font-bold">Required</span>
                            <input type="checkbox" checked={field.required} onChange={(e) => updateFieldProperty(field.id, 'required', e.target.checked)} className="h-4 w-4 rounded border-[#475569] bg-[#334155] text-[#3b82f6] focus:ring-0 cursor-pointer mt-1" />
                          </div>
                          <Button type="button" onClick={() => removeFieldFromCanvas(field.id)} className="bg-rose-950/20 border border-rose-900/40 text-rose-400 hover:bg-rose-900/20 h-8 w-8 p-0 shrink-0 ml-2 flex items-center justify-center transition-colors"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {canvasFields.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                  <Button type="button" onClick={() => setCanvasFields([])} className="bg-[#334155] border border-[#475569] text-white text-xs h-11 px-4 order-2 sm:order-1 transition-colors hover:bg-[#475569]">Flush Workspace Target Grid</Button>
                  <Button type="submit" className="bg-gradient-to-r from-[#3b82f6] to-[#4291f7] text-white text-xs font-bold h-11 px-5 border-none shadow-lg transition-opacity hover:opacity-90 order-1 sm:order-2">Compile and Register Specification Schema Blueprint</Button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          VIEW STATE CONTROLLER 3: ADAPTIVE SCHEMA RENDERING CANVAS LOOKUP
          ========================================== */}
      {viewState === 'viewer' && viewingFormBlueprint && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-[#475569]/30 pb-5">
            <div className="space-y-1">
              <span className="text-[9px] font-bold font-mono tracking-widest text-[#3b82f6] bg-[#3b82f6]/10 px-2 py-0.5 rounded uppercase">
                Schema Grid Inspector Mode
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">{viewingFormBlueprint.name}</h2>
            </div>
            <Button type="button" onClick={() => { setViewState('listings'); setViewingFormBlueprint(null); }} className="bg-[#1e293b] border border-[#475569] text-[#cbd5e1] hover:bg-[#334155] hover:text-white h-10 px-4 flex items-center gap-2 font-medium self-start sm:self-center transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Listings
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
            
            {/* COMPONENT LAYOUT FORM UI GENERATOR */}
            <div className="bg-[#1a1f35] border border-[#3b82f6]/20 rounded-xl p-5 sm:p-6 space-y-6 shadow-2xl">
              <div className="space-y-1 bg-[#0f172a]/60 p-4 rounded-xl border border-[#475569]/20">
                <h1 className="text-base font-bold text-white tracking-tight">{viewingFormBlueprint.structure?.formName || viewingFormBlueprint.name}</h1>
                <p className="text-slate-400 text-[11px] leading-relaxed">{viewingFormBlueprint.structure?.description || viewingFormBlueprint.description || "No specific guidelines documentation nested in schema layout."}</p>
              </div>

              <div className="space-y-5">
                {(viewingFormBlueprint.structure?.fields || []).map((field: any, idx: number) => (
                  <div key={field.id} className="space-y-2.5 bg-[#0f172a]/20 border border-[#475569]/20 p-4 rounded-xl">
                    <div className="flex justify-between items-start gap-4">
                      <Label className="text-white font-semibold text-xs block leading-snug">
                        {idx + 1}. {field.label} {field.required && <span className="text-rose-500 font-bold">*</span>}
                      </Label>
                      {field.points > 0 && (
                        <span className="text-[10px] font-bold font-mono text-[#3b82f6] bg-[#3b82f6]/10 px-2 py-0.5 rounded shrink-0">
                          {field.points} Pts Weight
                        </span>
                      )}
                    </div>

                    {/* SELECTOR TYPE SWITCH PARSER */}
                    {field.type === 'text_short' && (
                      <Input disabled placeholder="Participant text value response variable tracking field string placeholder..." className="bg-[#1e293b]/50 border-[#475569] text-xs h-9 opacity-60 text-slate-400 cursor-not-allowed" />
                    )}
                    {field.type === 'text_long' && (
                      <textarea disabled placeholder="Participant long reflection commentary space frame criteria array blocks container layout parameter description..." className="w-full bg-[#1e293b]/50 border border-[#475569] rounded-lg p-3 text-xs opacity-60 h-16 resize-none text-slate-400 cursor-not-allowed outline-none" />
                    )}
                    {field.type === 'file_upload' && (
                      <div className="border border-dashed border-[#475569] bg-[#0f172a]/40 rounded-lg p-4 text-center text-slate-500 flex flex-col items-center justify-center gap-1.5 opacity-60 cursor-not-allowed">
                        <UploadCloud className="h-5 w-5 text-slate-600" />
                        <p className="text-[10px] font-bold">Dynamic Portfolio Asset Document Link Trait Tray File Field Mock</p>
                      </div>
                    )}
                    {field.type === 'likert_scale' && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-6 gap-1.5 text-center">
                          {[1, 2, 3, 4, 5, 6].map(num => (
                            <div key={num} className="bg-[#1e293b]/40 border border-[#475569]/40 py-2 rounded-lg font-bold text-slate-400 font-mono text-xs select-none">
                              {num}
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between font-bold text-[9px] text-slate-500 px-1">
                          <span>1 - Deficient Capability</span>
                          <span>6 - Absolute Mastery</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* SQL SCHEMAS INSIGHT DATA WINDOW */}
            <div className="space-y-4">
              <div className="bg-[#111625] border border-[#475569]/40 rounded-xl p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-[#475569]/30 pb-2">
                  <CheckCircle2 className="h-4 w-4 text-[#3b82f6]" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Relational Database Context Data</h3>
                </div>
                <div className="space-y-3 font-mono text-[10px] text-[#cbd5e1]">
                  <div className="flex justify-between border-b border-[#475569]/10 pb-1.5">
                    <span className="text-slate-500">PRIMARY KEY ID:</span>
                    <span className="text-white font-bold">{viewingFormBlueprint.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#475569]/10 pb-1.5">
                    <span className="text-slate-500">MAX QUIZ RATING:</span>
                    <span className="text-[#3b82f6] font-bold">{viewingFormBlueprint.maxPossibleScore || 0} Pts</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">
                    PostgreSQL JSONB Field Storage Spec Map:
                  </span>
                  <pre className="text-[10px] font-mono bg-[#090d16] p-3 rounded-lg text-[#38bdf8] overflow-x-auto leading-relaxed border border-[#475569]/40 max-h-[300px] select-text">
                    {JSON.stringify(viewingFormBlueprint.structure || {
                      formName: viewingFormBlueprint.name,
                      description: viewingFormBlueprint.description,
                      fields: []
                    }, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          VIEW STATE CONTROLLER 4: ADMIN TEMPLATE TESTER
          ========================================== */}
      {viewState === 'demo' && demoFormBlueprint && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-[#475569]/30 pb-5">
            <div className="space-y-1">
              <span className="text-[9px] font-bold font-mono tracking-widest text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded uppercase">
                Admin Demo Mode
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">{demoFormBlueprint.name}</h2>
              <p className="text-[#94a3b8] text-[11px]">Test the template input flow locally before selecting it in an assignment.</p>
            </div>
            <Button
              type="button"
              onClick={() => {
                setViewState('listings');
                setDemoFormBlueprint(null);
                setDemoValues({});
                setDemoErrors({});
                setDemoResultJson(null);
              }}
              className="bg-[#1e293b] border border-[#475569] text-[#cbd5e1] hover:bg-[#334155] hover:text-white h-10 px-4 flex items-center gap-2 font-medium self-start sm:self-center transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Listings
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
            <form onSubmit={handleRunDemoSubmission} className="bg-[#1a1f35] border border-emerald-900/30 rounded-xl p-5 sm:p-6 space-y-6 shadow-2xl">
              <div className="space-y-1 bg-[#0f172a]/60 p-4 rounded-xl border border-[#475569]/20">
                <h1 className="text-base font-bold text-white tracking-tight">{demoFormBlueprint.structure?.formName || demoFormBlueprint.name}</h1>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {demoFormBlueprint.structure?.description || demoFormBlueprint.description || 'No template description configured.'}
                </p>
              </div>

              <FormRenderer
                fields={demoFormBlueprint.structure?.fields ?? []}
                values={demoValues}
                onChange={handleDemoValueChange}
                errors={demoErrors}
              />

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    setDemoValues({});
                    setDemoErrors({});
                    setDemoResultJson(null);
                  }}
                  className="bg-[#334155] border border-[#475569] text-white text-xs h-10 px-4 transition-colors hover:bg-[#475569]"
                >
                  Reset Sample
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold h-10 px-5 border-none">
                  <FlaskConical className="h-3.5 w-3.5 mr-1.5" /> Run Template Test
                </Button>
              </div>
            </form>

            <div className="space-y-4">
              <div className="bg-[#111625] border border-[#475569]/40 rounded-xl p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-[#475569]/30 pb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Demo Payload Preview</h3>
                </div>
                <div className="space-y-3 font-mono text-[10px] text-[#cbd5e1]">
                  <div className="flex justify-between border-b border-[#475569]/10 pb-1.5">
                    <span className="text-slate-500">TEMPLATE ID:</span>
                    <span className="text-white font-bold truncate max-w-[180px]">{demoFormBlueprint.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#475569]/10 pb-1.5">
                    <span className="text-slate-500">FIELDS:</span>
                    <span className="text-emerald-400 font-bold">{demoFormBlueprint.structure?.fields?.length ?? 0}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#475569]/10 pb-1.5">
                    <span className="text-slate-500">DB WRITE:</span>
                    <span className="text-slate-400 font-bold">Disabled</span>
                  </div>
                </div>
                <pre className="text-[10px] font-mono bg-[#090d16] p-3 rounded-lg text-[#86efac] overflow-x-auto leading-relaxed border border-[#475569]/40 max-h-[360px] select-text">
                  {demoResultJson || JSON.stringify({
                    mode: 'admin_template_test',
                    persisted: false,
                    status: 'Waiting for sample input',
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
