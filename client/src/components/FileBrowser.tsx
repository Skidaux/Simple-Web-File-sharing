import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

import { FaDownload, FaEye, FaPenSquare, FaTrash, FaLock, FaFolder, FaFile, FaUpload, FaCheckCircle } from 'react-icons/fa';


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
  const [uploadSpeed, setUploadSpeed] = useState<number | null>(null);
  const [uploadedData, setUploadedData] = useState<number | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isUploadComplete, setIsUploadComplete] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);




  const formatSize = (size: number): string => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 ** 2) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else if (size < 1024 ** 3) {
      return `${(size / 1024 ** 2).toFixed(2)} MB`;
    } else {
      return `${(size / 1024 ** 3).toFixed(2)} GB`;
    }
  };

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
    // if (!window.confirm(`Are you sure you want to delete "${filePath}"?`)) {
    //   return;
    // }

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
      formData.append('directory', path);
      formData.append('file', file);

      setFileSize(file.size);
      setIsUploadComplete(false); // Reset upload completion status

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload', true);

      const startTime = new Date().getTime();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(progress);
          setUploadedData(event.loaded);

          const elapsedTime = (new Date().getTime() - startTime) / 1000;
          const speed = event.loaded / elapsedTime;
          setUploadSpeed(speed);
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          await fetchFiles();
          setIsUploadComplete(true); // Set upload completion status to true
        } else {
          console.error('Failed to upload file:', xhr.responseText);
        }
        // Do not reset the progress state variables here
      };

      xhr.onerror = () => {
        console.error('Upload error');
        // Reset the progress state variables on error
        setUploadProgress(null);
        setUploadSpeed(null);
        setUploadedData(null);
        setFileSize(null);
      };

      xhr.send(formData);
    }
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('bg-gray-50', 'border-gray-400');
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFileName(e.target.files[0].name);
    }
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('bg-gray-50', 'border-gray-400');
    }
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('bg-gray-50', 'border-gray-400');
    }
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFileName(e.dataTransfer.files[0].name);
      e.dataTransfer.clearData();
    }
  };


  return (
    <div className="p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Browsing: /{path}</h2>
        <div className='flex'>

          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)} className='bg-blue-600 hover:bg-blue-700 px-8'><FaUpload /></Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Upload a file</AlertDialogTitle>
                <AlertDialogDescription>
                  <div
                    ref={dropZoneRef}
                    className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    {selectedFileName ? (
                      <p className="text-gray-700">{selectedFileName}</p>
                    ) : (
                      <p className="text-gray-500">Drag and drop files here, or click to select files</p>
                    )}
                  </div>
                  {uploadProgress !== null && (
                    <div className="mt-4 flex space-x-8 justify-center">

                      <CircularProgressbar value={uploadProgress} text={`${Math.round(uploadProgress)}%`} className='w-20 h-20' />

                      <div className="text-sm mt-1">
                        <div>Speed: {uploadSpeed ? `${formatSize(uploadSpeed)}/s` : 'N/A'}</div>
                        <div>Uploaded: {uploadedData ? formatSize(uploadedData) : 'N/A'}</div>
                        <div>File Size: {fileSize ? formatSize(fileSize) : 'N/A'}</div>
                      </div>
                    </div>
                  )}
                  {isUploadComplete && (
                    <div className="mt-4 text-green-600 font-semibold flex justify-center">Upload finished! <FaCheckCircle className='mx-1 mt-1' /></div>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Button className='bg-white text-black'>Cancel</Button>
                </AlertDialogCancel>
                <Button onClick={handleFileUpload} className="bg-blue-600 hover:bg-blue-700">
                  Upload
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </div>
      </div>
      <div className="space-y-2">
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
                <Dialog>
                <DialogTrigger> <Button className="ml-2 bg-red-600 hover:bg-red-700">
                  <FaTrash />
                </Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete '{file.name}'</DialogTitle>
                    <DialogDescription className=''>
                      <p>Are you sure you want delete this file stored on: \{file.path}</p>
                      <div className='space-x-10 mx-4 flex justify-center'>
                        <Button onClick={() => handleDelete(file.path)} className="ml-2 bg-red-600 hover:bg-red-700">
                          <FaTrash />  Delete
                        </Button>
                        <DialogClose asChild>
                          <Button type="button" variant="secondary">
                            Close
                          </Button>
                        </DialogClose>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
              ) : (
                <>
                  <a href={`/files/${file.path}`} target='_blank'>
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
                  <Dialog>
                    <DialogTrigger> <Button className="ml-2 bg-red-600 hover:bg-red-700">
                      <FaTrash />
                    </Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete '{file.name}'</DialogTitle>
                        <DialogDescription className=''>
                          <p>Are you sure you want delete this file stored on: \{file.path}</p>
                          <div className='space-x-10 mx-4 flex justify-center'>
                            <Button onClick={() => handleDelete(file.path)} className="ml-2 bg-red-600 hover:bg-red-700">
                              <FaTrash />  Delete
                            </Button>
                            <DialogClose asChild>
                              <Button type="button" variant="secondary">
                                Close
                              </Button>
                            </DialogClose>
                          </div>
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>


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
