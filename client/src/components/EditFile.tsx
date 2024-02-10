import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMatch } from 'react-router-dom';
import AceEditor from "react-ace";

// Import language tools for auto-completion and snippets
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/mode-text";
import "ace-builds/src-noconflict/theme-monokai";

const EditFile: React.FC = () => {
  const params = useParams(); // Use useParams without specifying a custom type
  const navigate = useNavigate();
  const match = useMatch("/edit/*");
  const filePath = match?.params['*'] || '';
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fileExtension, setFileExtension] = useState<string>(''); // Add state for file extension

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

        // Extract file extension from filename
        const filename = data.filename || '';
        const extension = filename.split('.').pop()?.toLowerCase() || '';
        setFileExtension(extension);
      } catch (error) {
        console.error('Failed to fetch file content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFileContent();
  }, [params.filePath]); // Depend on params.filePath directly

  const handleAceChange = (newContent) => {
    setContent(newContent);
  };

  const saveFile = async () => {
    if (!filePath) {
      console.error('File path is undefined');
      return;
    }
    console.log(filePath);
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

  let mode = ''; // Initialize mode variable
  switch (fileExtension) {
    case 'js':
      mode = 'javascript';
      break;
    case 'html':
      mode = 'html';
      break;
    case 'json':
      mode = 'json';
      break;
    default:
      mode = 'text'; // Default to plain text
      break;
  }

  return (
    <div>
      <h2>Editing: {filePath}</h2>
      <AceEditor
        height="100px"
        value={content}
        mode={mode} // Use the dynamically determined mode
        theme="monokai"
        fontSize="16px"
        highlightActiveLine={true}
        onChange={handleAceChange}
        setOptions={{
          enableLiveAutocompletion: true, // Enable live auto-completion
          enableBasicAutocompletion: true, // Enable basic auto-completion
          enableSnippets: true, // Enable snippets
          showLineNumbers: true,
          tabSize: 2,
        }}
      />
  
      <button onClick={saveFile}>Save</button>
    </div>
  );
};

export default EditFile;
