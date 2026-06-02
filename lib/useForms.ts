import { useAppContext } from '@/lib/AppContext';
import { FormBlueprint } from '@/lib/models';
import { formatDate } from '@/lib/formatters';

export function useForms() {
  const { forms, setForms } = useAppContext();

  const handleSaveForm = (e: React.FormEvent<HTMLFormElement>, editingForm: FormBlueprint | null) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = (data.get('name') as string || '').trim();
    const description = data.get('description') as string;
    const googleFormUrl = (data.get('googleFormUrl') as string || '').trim();
    const status = (data.get('status') as 'Enabled' | 'Disabled') || 'Enabled';

    if (!name) {
      alert("Please fill in the form name.");
      return;
    }

    if (editingForm) {
      setForms(forms.map(f => f.id === editingForm.id ? { ...f, name, description, googleFormUrl, status } : f));
    } else {
      setForms([{
        id: `form_${Date.now()}`,
        name, description, googleFormUrl,
        created: formatDate(new Date().toISOString().split('T')[0]),
        status: "Enabled"
      }, ...forms]);
    }
  };

  const deleteFormBlueprint = (id: string) => {
    if (confirm("Delete this form blueprint?")) {
      setForms(forms.filter(f => f.id !== id));
    }
  };

  return { forms, handleSaveForm, deleteFormBlueprint };
}
