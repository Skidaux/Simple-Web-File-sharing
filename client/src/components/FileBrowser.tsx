import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface File {
  name: string;
  type: 'directory' | 'file';
  path: string;
}

const FileBrowser: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname.replace('/browse/', '') || '';
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      setIsLoading(true);
      const apiPath = path ? `/api/list/${path}` : '/api/list/';
      try {
        const response = await fetch(apiPath);
        if (!response.ok) {
          throw new Error(`Network response was not ok, status: ${response.status}`);
        }
        const data = await response.json();
        setFiles(data.files);
      } catch (error) {
        console.error('Failed to fetch files:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, [path]);

  const handleDelete = async (filePath: string) => {
    // Confirm before deleting
    if (!window.confirm(`Are you sure you want to delete "${filePath}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/delete/${filePath}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`Network response was not ok, status: ${response.status}`);
      }
      // Refresh the list of files after deletion
      await fetchFiles();
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const handleEdit = (filePath: string) => {
    navigate(`/edit/${filePath}`);
  };

  if (isLoading) return <div>Loading...</div>;

  const goBackPath = () => {
    const segments = path.split('/').filter(Boolean);
    segments.pop();
    return `/browse/${segments.join('/')}`;
  };

  // Fetch files again to refresh the list
  const fetchFiles = async () => {
    setIsLoading(true);
    const apiPath = path ? `/api/list/${path}` : '/api/list/';
    try {
      const response = await fetch(apiPath);
      if (!response.ok) {
        throw new Error(`Network response was not ok, status: ${response.status}`);
      }
      const data = await response.json();
      setFiles(data.files);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Browsing: /{path}</h2>
      <div className="space-y-4">
        {files.map((file) => (
          <div key={file.path} className="flex items-center border border-gray-300 rounded-lg p-4">
            {file.type === 'directory' ? (
              <div>
                <Link to={`/browse/${file.path}`} className="text-blue-500 hover:underline">
                  {file.name}/
                </Link>
              </div>
            ) : (
              <div>
                <span>{file.name}</span>
              </div>
            )}
            <div className="ml-auto">
              {file.type === 'directory' ? (
                <Button onClick={() => handleDelete(file.path)} className="ml-2 bg-red-600 hover:bg-red-700">Delete</Button>
              ) : (
                <>
                  <Button className='bg-green-600 hover:bg-green-700'><a href={`/api/download/${file.path}`} download >Download</a></Button>
                  <Button onClick={() => handleEdit(file.path)} className="ml-2 bg-blue-600 hover:bg-blue-700">Edit</Button>
                  <Button onClick={() => handleDelete(file.path)} className="ml-2 bg-red-600 hover:bg-red-700">Delete</Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {path && <Link to={goBackPath()} className="block mt-4 text-blue-500 hover:underline">Go Back</Link>}
    </div>
  );
};

export default FileBrowser;
