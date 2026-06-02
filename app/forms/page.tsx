"use client";

import React, { useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { FormField, FormFieldType, FormBlueprint } from '@/types/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, Trash2, Move, Type, AlignLeft, UploadCloud, SlidersHorizontal 
} from 'lucide-react';

export default function FormBuilderPage() {
  const { forms, setForms } = useDashboard();
  const [isBuilding, setIsBuilding] = useState(false);
  
  // Builder workspace state metrics
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [canvasFields, setCanvasFields] = useState<FormField[]>([]);

  // Available toolbox elements definition palette
  const toolBoxItems = [
    { type: 'text_short', label: 'Short Text Input', icon: Type, desc: 'For single line entries, URLs' },
    { type: 'text_long', label: 'Long Textarea', icon: AlignLeft, desc: 'For qualitative reflections' },
    { type: 'file_upload', label: 'File Upload Tray', icon: UploadCloud, desc: 'For PDF or PPT materials' },
    { type: 'likert_scale', label: 'Likert Scale (1-6)', icon: SlidersHorizontal, desc: 'For peer & self scoring evaluation grids' },
  ];

  // Drag and Drop event orchestration triggers
  const handleDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData("text/plain", type);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("text/plain") as FormFieldType;
    if (type) addFieldToCanvas(type);
  };

  const addFieldToCanvas = (type: FormFieldType) => {
    const defaultLabels: Record<FormFieldType, string> = {
      text_short: "New Short Text Question Prompt",
      text_long: "New Long Form Reflection Prompt",
      file_upload: "Please upload your practical execution materials (.pdf, .pptx)",
      likert_scale: "The candidate demonstrates exceptional execution capabilities:"
    };

    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: defaultLabels[type],
      required: true,
      placeholder: type === 'text_short' || type === 'text_long' ? 'Type response space...' : undefined,
      allowedExtensions: type === 'file_upload' ? ['.pdf', '.pptx'] : undefined,
      minScale: type === 'likert_scale' ? 1 : undefined,
      maxScale: type === 'likert_scale' ? 6 : undefined
    };

    setCanvasFields([...canvasFields, newField]);
  };

  const updateFieldLabel = (id: string, nextLabel: string) => {
    setCanvasFields(canvasFields.map(f => f.id === id ? { ...f, label: nextLabel } : f));
  };

  const removeFieldFromCanvas = (id: string) => {
    setCanvasFields(canvasFields.filter(f => f.id !== id));
  };

  const handleCompileAndSaveSchema = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || canvasFields.length === 0) {
      alert("Validation Error: Please specify a Form Name and drag at least one structural field onto the canvas.");
      return;
    }

    const completedBlueprint: FormBlueprint = {
      id: `form_${Date.now()}`,
      name: formName,
      type: "Custom Dynamic Form JSON Schema",
      questionCount: canvasFields.length,
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      status: 'Enabled',
      description: formDesc,
      structure: {
        formName,
        description: formDesc,
        fields: canvasFields
      }
    };

    setForms([completedBlueprint, ...forms]);
    // Reset workspace variables
    setFormName('');
    setFormDesc('');
    setCanvasFields([]);
    setIsBuilding(false);
  };

  return (
    <div className="space-y-6 duration-200 animate-in fade-in select-none text-xs">
      
      {/* HEADER ACTION CONTROLS */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Form Customization Engine</h2>
          <p className="text-[#94a3b8] text-[11px]">Compile dynamic modules out of native input elements arrays.</p>
        </div>
        {!isBuilding ? (
          <Button onClick={() => setIsBuilding(true)} className="bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] text-white text-xs font-semibold h-10 px-4 shadow-md border-none">
            <Plus className="h-4 w-4 mr-1" /> Initialize Form Customizer Workspace
          </Button>
        ) : (
          <Button onClick={() => setIsBuilding(false)} className="bg-[#334155] border border-[#475569] text-white text-xs h-10 px-4">
            ← Cancel and Return to Listings
          </Button>
        )}
      </div>

      {!isBuilding ? (
        /* LISTINGS DIRECTORY PORTAL VIEW */
        <div className="bg-gradient-to-br from-[#1e293b] to-[#334155] border border-[#475569] rounded-xl p-6 shadow-md">
          <Table className="text-xs">
            <TableHeader className="bg-[#475569]">
              <TableRow className="hover:bg-transparent border-[#475569]">
                <TableHead className="text-[#cbd5e1] font-semibold text-[11px]">Blueprint Spec Name</TableHead>
                <TableHead className="text-[#cbd5e1] font-semibold text-[11px]">Logic Model Model</TableHead>
                <TableHead className="text-[#cbd5e1] font-semibold text-[11px]">Metrics Fields Count</TableHead>
                <TableHead className="text-[#cbd5e1] font-semibold text-[11px]">Date Created</TableHead>
                <TableHead className="text-[#cbd5e1] font-semibold text-[11px]">Operational Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.map(form => (
                <TableRow key={form.id} className="border-b border-[#475569]/30 hover:bg-[#475569]/20">
                  <TableCell className="font-bold text-white py-4">{form.name}</TableCell>
                  <TableCell className="text-[#cbd5e1]">{form.type}</TableCell>
                  <TableCell className="text-[#3b82f6] font-bold">{form.questionCount} components</TableCell>
                  <TableCell className="text-[#94a3b8]">{form.created}</TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/20">
                      {form.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* INTERACTIVE DRAG N DROP CUSTOMIZATION DESK LAYOUT */
        <div className="grid grid-cols-[300px_1fr] gap-6 items-start">
          
          {/* DRAG-SOURCE CONTROLS TOOLBOX */}
          <div className="space-y-4">
            <div className="bg-[#1e293b] border border-[#475569] rounded-xl p-4 space-y-3 shadow-md">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Field Elements Palette</h3>
              <p className="text-[#94a3b8] text-[11px]">Drag an element card or click the plus tool to anchor it into the system blueprint canvas.</p>
              
              <div className="space-y-2.5 pt-2">
                {toolBoxItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <div 
                      key={item.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.type)}
                      onClick={() => addFieldToCanvas(item.type as FormFieldType)}
                      className="bg-[#334155]/60 border border-[#475569] rounded-xl p-3 flex items-center justify-between cursor-grab active:cursor-grabbing hover:border-[#3b82f6] transition-all group select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-[#334155] p-2 rounded-lg group-hover:bg-[#3b82f6]/10 transition-colors">
                          <Icon className="h-4 w-4 text-[#94a3b8] group-hover:text-[#3b82f6] transition-colors" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">{item.label}</p>
                          <p className="text-[10px] text-[#94a3b8] truncate w-40">{item.desc}</p>
                        </div>
                      </div>
                      <Plus className="h-4 w-4 text-[#94a3b8] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-white" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* DYNAMIC CANVAS DESK TARGET FRAME */}
          <form onSubmit={handleCompileAndSaveSchema} className="space-y-6">
            <div className="bg-[#1e293b] border border-[#475569] rounded-xl p-6 shadow-md space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-white font-semibold">Form Title Configuration *</Label>
                  <Input required placeholder="e.g., Module 1 Portfolio Evaluation" value={formName} onChange={(e) => setFormName(e.target.value)} className="bg-[#334155] border-[#475569] h-10 text-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white font-semibold">Description Scope Target Summary</Label>
                  <Input placeholder="e.g., Dynamic blueprint matrix checking peers 360 values" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="bg-[#334155] border-[#475569] h-10 text-white" />
                </div>
              </div>

              {/* INTERACTIVE DROP TARGET BLOCK CANVAS */}
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 min-h-[350px] space-y-4 transition-colors ${canvasFields.length === 0 ? 'border-[#475569] bg-[#0f172a]/20 flex flex-col items-center justify-center text-center' : 'border-[#3b82f6]/40 bg-[#0f172a]/10'}`}
              >
                {canvasFields.length === 0 ? (
                  <div className="space-y-2 max-w-sm pointer-events-none">
                    <Move className="h-8 w-8 text-[#475569] mx-auto animate-pulse" />
                    <p className="font-bold text-white">The Layout Blueprint Canvas is empty</p>
                    <p className="text-[11px] text-[#94a3b8]">Drag module inputs here from the palette tray or click cards to begin building your custom form configuration variables structure.</p>
                  </div>
                ) : (
                  canvasFields.map((field, index) => (
                    <div key={field.id} className="bg-gradient-to-r from-[#1e293b] to-[#334155] border border-[#475569] rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm group duration-150 animate-in slide-in-from-bottom-2">
                      <div className="flex items-center gap-3.5 flex-1">
                        <div className="text-slate-500 font-mono text-[11px] font-bold select-none w-4">{index + 1}</div>
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#3b82f6] bg-[#3b82f6]/10 px-2 py-0.5 rounded">
                              {field.type.replace('_', ' ')} Component
                            </span>
                          </div>
                          <Input 
                            value={field.label} 
                            required
                            onChange={(e) => updateFieldLabel(field.id, e.target.value)}
                            className="bg-[#0f172a]/40 border-[#475569] h-9 text-xs text-white w-full focus-visible:ring-[#3b82f6]" 
                          />
                        </div>
                      </div>

                      {/* NATIVE LAYOUT EMBED PREVIEWS MOCK HOOKS */}
                      <div className="w-48 hidden lg:flex bg-[#0f172a]/30 rounded-lg p-2.5 border border-[#475569]/30 items-center justify-center h-14 text-center select-none text-[#94a3b8] font-medium text-[10px]">
                        {field.type === 'likert_scale' && "Matrix Preview: [ 1 2 3 4 5 6 ]"}
                        {field.type === 'file_upload' && "File Dropzone [.pdf, .pptx]"}
                        {field.type === 'text_long' && "Multiline Textarea Box"}
                        {field.type === 'text_short' && "Single-line Textfield String"}
                      </div>

                      <Button 
                        type="button"
                        onClick={() => removeFieldFromCanvas(field.id)}
                        className="bg-rose-950/20 border border-rose-900/40 text-rose-400 hover:bg-rose-900/20 h-9 w-9 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* LOWER BLUEPRINT ACTIONS COMMIT TARGET PANEL */}
            {canvasFields.length > 0 && (
              <div className="flex justify-end gap-3 duration-200 animate-in fade-in">
                <Button type="button" onClick={() => setCanvasFields([])} className="bg-[#334155] border border-[#475569] text-white text-xs h-11 px-4">
                  Flush Canvas Schema
                </Button>
                <Button type="submit" className="bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] text-white text-xs font-bold h-11 px-5 shadow-lg border-none shadow-blue-500/10">
                  Compile JSON Schema & Register Template
                </Button>
              </div>
            )}
          </form>

        </div>
      )}
    </div>
  );
}