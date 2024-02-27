import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import FileBrowser from './components/FileBrowser'; // Adjust the path as necessary
import { Link } from 'react-router-dom';
import EditFile from './components/EditFile';
import { Toaster } from "@/components/ui/toaster"

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/browse/*" element={<FileBrowser />} />
        <Route path="/edit/*" element={<EditFile />} />

        <Route path="/" element={
          <div>
            Welcome to the file browser
            <br />
            <Link to="/browse/">Start Browsing</Link>
          </div>
        } />

      </Routes>
      <Toaster />
    </Router>



  );
};

export default App;
``
