import { useAppContext } from '@/lib/AppContext';
import { Participant, Company } from '@/lib/models';
import { formatDate } from '@/lib/formatters';

export function useParticipants() {
  const { participants, setParticipants, companies } = useAppContext();

  const handleSaveParticipant = (e: React.FormEvent<HTMLFormElement>, editingParticipant: Participant | null) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const firstName = (data.get('firstName') as string || '').trim();
    const lastName = (data.get('lastName') as string || '').trim();
    const email = (data.get('email') as string || '').trim();
    const department = (data.get('department') as string || '').trim() || 'General Operations';
    const company = data.get('companySelect') as string;
    const status = (data.get('status') as 'Enabled' | 'Disabled') || 'Enabled';

    if (!firstName || !lastName || !email || !company) {
      alert("Please fill in all required fields.");
      return;
    }

    if (editingParticipant) {
      setParticipants(participants.map(p => p.id === editingParticipant.id ? {
        ...p, firstName, lastName, name: `${firstName} ${lastName}`, email, department, company, status
      } : p));
    } else {
      setParticipants([{
        id: `part_${Date.now()}`,
        firstName, lastName,
        name: `${firstName} ${lastName}`,
        email, department, company,
        status: "Enabled"
      }, ...participants]);
    }
  };

  const deleteParticipant = (id: string) => {
    if (confirm("Remove this participant?")) {
      setParticipants(participants.filter(p => p.id !== id));
    }
  };

  return { participants, handleSaveParticipant, deleteParticipant };
}
