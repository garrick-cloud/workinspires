import { useAppContext } from '@/lib/AppContext';
import { Assignment } from '@/lib/models';
import { formatDate } from '@/lib/formatters';

export function useAssignments() {
  const { assignments, setAssignments, participants, folders, setFolders } = useAppContext();

  const handleSaveAssignment = (e: React.FormEvent<HTMLFormElement>, editingAssignment: Assignment | null, publish = false) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = (data.get('name') as string || '').trim();
    const formName = data.get('formName') as string;
    const target = data.get('target') as string;
    const date = data.get('date') as string;
    const status = (data.get('status') as 'Enabled' | 'Disabled') || 'Enabled';

    if (!name || !formName || !target || !date) {
      alert("Please fill in all required fields.");
      return;
    }

    const targetParticipants = participants.filter(p => p.company === target && p.status === 'Enabled');

    if (editingAssignment) {
      const wasPublished = editingAssignment.published;
      const nowPublishing = publish && !wasPublished;
      setAssignments(assignments.map(a => a.id === editingAssignment.id ? {
        ...a, name, formName, assignedTo: target,
        dueDate: date.includes('-') ? formatDate(date) : date, rawDate: date, status,
        published: publish || wasPublished,
        publishedAt: nowPublishing ? formatDate(new Date().toISOString().split('T')[0]) : a.publishedAt
      } : a));
      if (nowPublishing) alert(`Assignment published! Email notifications sent to ${targetParticipants.length} participant(s) at ${target}.`);
    } else {
      const newAsg: Assignment = {
        id: `asg_${Date.now()}`, name, formName, assignedTo: target,
        dueDate: formatDate(date), rawDate: date, completedText: "0 assigned",
        status: "Enabled", published: publish,
        publishedAt: publish ? formatDate(new Date().toISOString().split('T')[0]) : undefined
      };
      setAssignments([newAsg, ...assignments]);
      if (publish) alert(`Assignment published! Email notifications sent to ${targetParticipants.length} participant(s) at ${target}.`);
    }
  };

  const handlePublishAssignment = (id: string) => {
    const asg = assignments.find(a => a.id === id);
    if (!asg) return;
    const targetParticipants = participants.filter(p => p.company === asg.assignedTo && p.status === 'Enabled');
    if (confirm(`Publish "${asg.name}" to ${targetParticipants.length} participant(s) at ${asg.assignedTo}?\n\nThis will send email notifications to:\n${targetParticipants.map(p => `• ${p.name} (${p.email})`).join('\n')}`)) {
      setAssignments(assignments.map(a => a.id === id ? { ...a, published: true, publishedAt: formatDate(new Date().toISOString().split('T')[0]) } : a));
    }
  };

  const deleteAssignment = (id: string) => {
    if (confirm("Remove this assignment?")) {
      setAssignments(assignments.filter(a => a.id !== id));
      setFolders(folders.map(f => ({ ...f, assignmentIds: f.assignmentIds.filter(aid => aid !== id) })));
    }
  };

  return { assignments, handleSaveAssignment, handlePublishAssignment, deleteAssignment };
}
