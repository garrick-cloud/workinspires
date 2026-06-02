import { useAppContext } from '@/lib/AppContext';
import { Submission } from '@/lib/models';

export function useSubmissions() {
  const { submissions, setSubmissions } = useAppContext();

  const handleSaveSubmission = (e: React.FormEvent<HTMLFormElement>, editingSubmission: Submission | null) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const participantName = data.get('participantName') as string;
    const program = (data.get('program') as string || '').trim();
    const assignmentName = (data.get('assignmentName') as string || '').trim();
    const scoreRaw = data.get('score') as string;
    const score = scoreRaw !== '' ? parseInt(scoreRaw) : null;
    const status = data.get('status') as 'Completed' | 'In Progress' | 'Pending';
    const progress = status === 'Completed' ? 100 : status === 'Pending' ? 0 : parseInt(data.get('progress') as string) || 0;

    if (!participantName || !program || !assignmentName) {
      alert("Please fill in all required fields.");
      return;
    }

    if (editingSubmission) {
      setSubmissions(submissions.map(s => s.id === editingSubmission.id ? {
        ...s, participantName, program, assignmentName, score, status, progress
      } : s));
    } else {
      setSubmissions([{
        id: `sub_${Date.now()}`,
        participantName, program, assignmentName, score, status, progress
      }, ...submissions]);
    }
  };

  const deleteSubmission = (id: string) => {
    if (confirm("Remove this result entry?")) {
      setSubmissions(submissions.filter(s => s.id !== id));
    }
  };

  return { submissions, handleSaveSubmission, deleteSubmission };
}
