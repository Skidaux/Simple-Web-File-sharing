import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

import { FaDownload, FaEye, FaPenSquare, FaTrash, FaLock, FaFolder, FaFile   } from 'react-icons/fa';

interface File {
  name: string;
  type: 'directory' | 'file';
  path: string;
  size: string;
}
interface FileSizeUnits {
  [unit: string]: number;
}

const FileBrowser: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname.replace('/browse/', '') || '';
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

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
  const parseFileSize = (fileSize: string): number => {
    if (!fileSize) return 0;
    const units: FileSizeUnits = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 };
    const match = fileSize.match(/(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)/);
    return match ? parseFloat(match[1]) * (units[match[2]] || 0) : 0;
  };
  const handleFileUpload = () => {
    if (fileInputRef.current && fileInputRef.current.files) {
      const file = fileInputRef.current.files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('directory', path);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload', true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(progress);
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          // Refresh the list of files after upload
          await fetchFiles();
        } else {
          console.error('Failed to upload file:', xhr.responseText);
        }
        setUploadProgress(null); // Reset progress
      };

      xhr.onerror = () => {
        console.error('Upload error');
        setUploadProgress(null); // Reset progress
      };

      xhr.send(formData);
    }
  };
  

  return (
<div className="p-4 flex flex-col">
<div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Browsing: /{path}</h2>
        <div>
          <input type="file" ref={fileInputRef} className="mr-2" />
          <Button onClick={handleFileUpload} className="bg-blue-600 hover:bg-blue-700">
            Upload
          </Button>
          {uploadProgress !== null && (
            <div style={{ width: 50, height: 50, marginLeft: 10 }}>
              <CircularProgressbar value={uploadProgress} text={`${Math.round(uploadProgress)}%`} />
            </div>
          )}
        </div>
        </div>
      <div className="space-y-4">
      {files.map((file) => (
  <div key={file.path} className="flex items-center border border-gray-300 rounded-lg p-4">
    <div className="flex items-center flex-grow">
      {file.type === 'directory' ? (
        <Link to={`/browse/${file.path}`} className="text-blue-500 hover:underline flex items-center">
          <FaFolder className="mr-2" /> {file.name}/
        </Link>
      ) : (
        <span className="flex items-center">
          <FaFile className="mr-2" /> {file.name} | {file.size}
        </span>
      )}
    </div>
    <div className="flex items-center">
      {file.type === 'directory' ? (
        <Button onClick={() => handleDelete(file.path)} className="ml-2 bg-red-600 hover:bg-red-700">
          <FaTrash />
        </Button>
      ) : (
        <>
          <a href={`/files/${file.path}`}>
            <Button className="bg-yellow-600 hover:bg-yellow-700 ml-2">
              <FaEye />
            </Button>
          </a>
          <a href={`/api/download/${file.path}`} download>
            <Button className="bg-green-600 hover:bg-green-700 ml-2">
              <FaDownload />
            </Button>
          </a>
          {parseFileSize(file.size) > 2048 ? (
            <Button className="ml-2 bg-gray-400 cursor-not-allowed hover:bg-gray-500">
              <FaLock />
            </Button>
          ) : (
            <Button onClick={() => handleEdit(file.path)} className="ml-2 bg-blue-600 hover:bg-blue-700">
              <FaPenSquare />
            </Button>
          )}
          <Button onClick={() => handleDelete(file.path)} className="ml-2 bg-red-600 hover:bg-red-700">
            <FaTrash />
          </Button>
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
