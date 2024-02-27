import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const CreateFileDialog: React.FC<{ onCreate: (name: string, type: 'file' | 'directory') => void }> = ({ onCreate }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'file' | 'directory'>('file');

  const handleCreate = () => {
    onCreate(name, type);
    setName('');
  };

  return (
    <Dialog>
      <DialogTrigger>
        <Button className="bg-blue-600 hover:bg-blue-700">Create File/Folder</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Create New</DialogTitle>
        <DialogDescription>
          <label>
            Name:
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Type:
            <select value={type} onChange={(e) => setType(e.target.value as 'file' | 'directory')}>
              <option value="file">File</option>
              <option value="directory">Folder</option>
            </select>
          </label>
        </DialogDescription>
        <DialogFooter>
          <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFileDialog;
