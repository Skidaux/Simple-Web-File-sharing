import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMatch } from 'react-router-dom';
import AceEditor from "react-ace";
import { Button } from "@/components/ui/button"


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
  const [savedContent, setSavedContent] = useState<string>('');
  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);
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
        setSavedContent(data.content);

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

  const handleAceChange = (newContent: string) => {
    setContent(newContent);
    setUnsavedChanges(true);
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
      setSavedContent(content);
      setUnsavedChanges(false);
      // Navigate or show success message as needed
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  const discardChanges = () => {
    setContent(savedContent); // Reset content to the saved state
    setUnsavedChanges(false);
  };

  const Browse = () => {
    if (unsavedChanges) {
      const confirmNavigation = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmNavigation) {
        return;
      }
    }
    const directoryPath = filePath.substring(0, filePath.lastIndexOf('/'));
    navigate(`/browse/${directoryPath}`);
  };


  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (unsavedChanges) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [unsavedChanges]);

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
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-white">
        <h2 className="text-lg font-bold">Editing: /{filePath}</h2>
        <div>
          <Button className="bg-green-600 hover:bg-green-700 mr-2" onClick={saveFile}>Save</Button>
          <Button className="bg-red-600 hover:bg-red-700 mr-2" onClick={discardChanges}>Discard</Button>
          <Button className="bg-blue-600 hover:bg-blue-700 mr-2" onClick={Browse}>Go Back</Button>
        </div>
      </div>
      <AceEditor
        className="flex-1"
        width="100%"
        height="100%"
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
    </div>

  );
};

export default EditFile;
