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
  // Extracting the path from the location.pathname
  const path = location.pathname.replace('/browse/', '') || '';
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleEdit = (filePath: string) => {
    navigate(`/edit/${filePath}`);
  };

  useEffect(() => { // Correctly placed useEffect hook
    const fetchFiles = async () => {
      setIsLoading(true);
      // Construct the API path dynamically based on the current browser path
      const apiPath: string = path ? `/api/list/${path}` : '/api/list/';
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
  }, [path]); // Dependency array to re-fetch whenever the path changes

  if (isLoading) return <div>Loading...</div>;
  const goBackPath = () => {
    // Split the current path by slashes and filter out empty segments
    const segments = path.split('/').filter(Boolean);
    // Remove the last segment to navigate up one directory
    segments.pop();
    // Reconstruct the path and prepend with the base browse path
    return `/browse/${segments.join('/')}`;
  };
  

  return (
<div>
      <h2>Browsing: /{path}</h2>
      <ul>
        {files.map((file) => (
          <li key={file.path}>
            {file.type === 'directory' ? (
              <Link to={`/browse/${file.path}`}>{file.name}/</Link>
            ) : (
              <div>
                {file.name}{' '}
                <a href={`/api/download/${file.path}`} download>Download</a>
                <button onClick={() => handleEdit(file.path)}>Edit</button> {/* Edit button */}
              </div>
            )}
          </li>
        ))}
      </ul>
      {path && (
        <Link to={goBackPath()}>Go Back</Link>
      )}
    </div>
  );
};

export default FileBrowser;
