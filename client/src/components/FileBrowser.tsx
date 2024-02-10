import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';

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
    <div>
      <h2>Browsing: /{path}</h2>
      <ul>
        {files.map((file) => (
          <li key={file.path}>
            {file.type === 'directory' ? (
              <>
                <Link to={`/browse/${file.path}`}>{file.name}/</Link>
                <button onClick={() => handleDelete(file.path)}>Delete</button>
              </>
            ) : (
              <div>
                {file.name} <a href={`/api/download/${file.path}`} download>Download</a>
                <button onClick={() => handleEdit(file.path)}>Edit</button>
                <button onClick={() => handleDelete(file.path)}>Delete</button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {path && <Link to={goBackPath()}>Go Back</Link>}
    </div>
  );
};

export default FileBrowser;
