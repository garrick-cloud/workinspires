import { useAppContext } from '@/lib/AppContext';
import { Report } from '@/lib/models';
import { formatDate } from '@/lib/formatters';

export function useReports() {
  const { reports, setReports } = useAppContext();

  const handleGenerateReport = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = (data.get('name') as string || '').trim();
    const type = data.get('type') as string;
    const format = (data.get('format') as string) || 'PDF';

    if (!name || !type) {
      alert("Please fill in report name and type.");
      return;
    }

    const newReport: Report = {
      id: `r_${Date.now()}`,
      name,
      type,
      generated: formatDate(new Date().toISOString().split('T')[0]),
      format,
      size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`
    };
    setReports([newReport, ...reports]);
  };

  const deleteReport = (id: string) => {
    if (confirm("Delete this report?")) {
      setReports(reports.filter(r => r.id !== id));
    }
  };

  return { reports, handleGenerateReport, deleteReport };
}
