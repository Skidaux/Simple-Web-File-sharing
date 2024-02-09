import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMatch } from 'react-router-dom';

const EditFile: React.FC = () => {
  const params = useParams(); // Use useParams without specifying a custom type
  const navigate = useNavigate();
  const match = useMatch("/edit/*");
  const filePath = match?.params['*'] || '';
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Assert that filePath exists and is a string

    if (!filePath) {
      console.log('File path is undefined');
      setIsLoading(false);
      return;
    }

    const fetchFileContent = async () => {
      setIsLoading(true);
      try {
        const encodedFilePath = encodeURIComponent(filePath);
        const response = await fetch(`/api/edit/${encodedFilePath}`);
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const data = await response.json();
        setContent(data.content);
      } catch (error) {
        console.error('Failed to fetch file content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFileContent();
  }, [params.filePath]); // Depend on params.filePath directly

  const saveFile = async () => {
    

    if (!filePath) {
      console.error('File path is undefined');
      return;
    }
console.log(filePath)
    try {
      const encodedFilePath = encodeURIComponent(filePath);
      const response = await fetch(`/api/save/${encodedFilePath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        throw new Error(`Failed to save the file: ${response.statusText}`);
      }
      console.log('File saved successfully');
      // Navigate or show success message as needed
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Editing: {params.filePath}</h2>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{ width: '100%', height: '400px' }}
      />
      <button onClick={saveFile}>Save</button>
    </div>
  );
};

export default EditFile;
