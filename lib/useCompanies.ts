import { useAppContext } from '@/lib/AppContext';
import { Company } from '@/lib/models';
import { formatDate } from '@/lib/formatters';

export function useCompanies() {
  const { companies, setCompanies, participants, setParticipants } = useAppContext();

  const handleSaveCompany = (e: React.FormEvent<HTMLFormElement>, editingCompany: Company | null) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = (data.get('name') as string || '').trim();
    const industry = (data.get('industry') as string || '').trim() || 'General Enterprise';
    const status = (data.get('status') as 'Enabled' | 'Disabled') || 'Enabled';

    if (!name) {
      alert("Company name is required.");
      return;
    }

    if (editingCompany) {
      setParticipants(participants.map(p => p.company === editingCompany.name ? { ...p, company: name } : p));
      setCompanies(companies.map(c => c.id === editingCompany.id ? { ...c, name, industry, status } : c));
    } else {
      setCompanies([{
        id: `c_${Date.now()}`,
        name, industry,
        createdDate: formatDate(new Date().toISOString().split('T')[0]),
        status: "Enabled"
      }, ...companies]);
    }
  };

  const deleteCompanyEntity = (id: string, name: string) => {
    const clusterCount = participants.filter(p => p.company === name).length;
    if (clusterCount > 0) {
      alert(`Cannot delete "${name}" — ${clusterCount} participants are still linked.`);
      return;
    }
    if (confirm(`Delete company "${name}"?`)) {
      setCompanies(companies.filter(c => c.id !== id));
    }
  };

  return { companies, handleSaveCompany, deleteCompanyEntity };
}
