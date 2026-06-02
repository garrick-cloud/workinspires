import { useAppContext } from '@/lib/AppContext';
import { CollectionFolder } from '@/lib/models';
import { formatDate } from '@/lib/formatters';

export function useCollections() {
  const { folders, setFolders, activeFolderView, setActiveFolderView } = useAppContext();

  const handleSaveFolder = (e: React.FormEvent<HTMLFormElement>, editingFolder: CollectionFolder | null) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = (data.get('folderName') as string || '').trim();
    const description = (data.get('folderDesc') as string || '').trim();
    const selectedAssignmentIds = Array.from(data.getAll('assignments') as string[]);

    if (!name) {
      alert("Please provide a folder collection name.");
      return;
    }

    if (editingFolder) {
      setFolders(folders.map(f => f.id === editingFolder.id ? {
        ...f, name, description, assignmentIds: selectedAssignmentIds
      } : f));
      if (activeFolderView && activeFolderView.id === editingFolder.id) {
        setActiveFolderView({ ...activeFolderView, name, description, assignmentIds: selectedAssignmentIds });
      }
    } else {
      const newFolder: CollectionFolder = {
        id: `fol_${Date.now()}`,
        name,
        description,
        createdDate: formatDate(new Date().toISOString().split('T')[0]),
        assignmentIds: selectedAssignmentIds
      };
      setFolders([newFolder, ...folders]);
    }
  };

  const deleteFolder = (id: string) => {
    if (confirm("Delete this collection folder? Linked assignments inside will return to the root assignments tab.")) {
      setFolders(folders.filter(f => f.id !== id));
      setActiveFolderView(null);
    }
  };

  return { folders, handleSaveFolder, deleteFolder };
}
