import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input"
import { FaFileCirclePlus } from "react-icons/fa6";
import { FaFolderPlus } from "react-icons/fa";

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
        <Button className="mx-4 bg-yellow-600 hover:bg-yellow-700"><FaFileCirclePlus className='mx-1' />File <code className='font-bold mx-1'>|</code> <FaFolderPlus className='mx-1' /> Folder</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Create New</DialogTitle>
        <DialogDescription className='flex space-x-10'>
          <label className='flex'>
            Name:
            <Input type="text" value={name} onChange={(e) => setName(e.target.value)} className='w-40 h-6 mx-1' />
          </label>
          <label>
            Type:

            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'file' | 'directory')}
              className="w-16 h-6 border-2 border-gray-300 rounded-md appearance-none "
            >

              <option disabled>Select an option</option>
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
