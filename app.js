const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const app = express();
const cors = require('cors')
const multer  = require('multer');


app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'ejs');

const formatFileSize = (bytes) => {
    if (bytes < 1024) {
        return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(2) + ' KB';
    } else if (bytes < 1024 * 1024 * 1024) {
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    } else {
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }
};

const readDirectory = async (dirPath) => {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const files = [];

    for (let dirent of entries) {
        const itemPath = path.join(dirPath, dirent.name).replace(/\\/g, '/'); // Ensure forward slashes
        // Only append the name and type, construct relative path for each item
        const relativePath = path.relative(__dirname + '/files', itemPath);
        const stats = await fs.promises.stat(itemPath); // Get file stats
        const fileSize = formatFileSize(stats.size); // Format file size
        files.push({
            name: dirent.name,
            type: dirent.isDirectory() ? 'directory' : 'file',
            // Append '/' to directories to indicate it's a directory
            path: dirent.isDirectory() ? `${relativePath}/` : relativePath,
            size: dirent.isDirectory() ? null : fileSize, // Add size for files, null for directories
        });
    }

    return files;
};






app.get('/api/download/*', (req, res) => {
    const filePath = path.join(__dirname, 'files', req.params[0]);
    res.download(filePath, (err) => {
        if (err) {
            console.error('File download failed:', err);
            return res.status(500).send('Server Error');
        }
    });
});



app.get('/api/edit/*', (req, res) => {
    const relativePath = req.params[0];
    const filePath = path.join(__dirname, 'files', relativePath);

    fs.stat(filePath, (err, stats) => {
        if (err) {
            console.error('Error accessing file:', err);
            const status = err.code === 'ENOENT' ? 404 : 500;
            return res.status(status).send('Error processing your request');
        }

        if (stats.size > 2048) {
            return res.status(413).json({ error: 'File size exceeds 2 kilobytes' });
        }

        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Unable to read file:', err);
                return res.status(500).send('Error processing your request');
            }
            res.json({ content: data, filename: path.basename(relativePath), filePath: relativePath });
        });
    });
});


app.get('/api/list/*', async (req, res) => {
    // Construct directory path from request
    const requestedPath = req.params[0] ? req.params[0] : '';
    const directoryPath = path.join(__dirname, 'files', requestedPath);

    try {
        const directoryStructure = await readDirectory(directoryPath);
        res.json({ files: directoryStructure });
    } catch (err) {
        console.error('Error reading directory:', err);
        res.status(500).send('Failed to read directory structure');
    }
});





app.post('/api/save/*', (req, res) => {
    const filePath = path.join(__dirname, 'files', req.params[0]);
    fs.writeFile(filePath, req.body.content, (err) => {
        if (err) {
            console.error('Unable to write file:', err);
            return res.status(500).json({ success: false, message: 'Server Error' });
        }
        res.json({ success: true, message: 'File saved successfully' });
    });
});

app.post('/api/delete/*', (req, res) => {
    const relativePath = req.params[0]; // The relative path provided in the URL
    const filePath = path.join(__dirname, 'files', relativePath);

    // Safety check to prevent deletion of the root directory or any unintended higher-level directories
    if (!relativePath || relativePath === '/' || path.relative(__dirname, filePath).startsWith('..')) {
        return res.status(400).json({ success: false, message: 'Invalid request: Attempt to access restricted directory' });
    }

    fs.stat(filePath, (err, stats) => {
        if (err) {
            console.error('Error accessing path:', err);
            return res.status(404).json({ success: false, message: 'Path not found' });
        }

        if (stats.isDirectory()) {
            fs.rm(filePath, { recursive: true }, (err) => {
                if (err) {
                    console.error('Unable to delete directory:', err);
                    return res.status(500).json({ success: false, message: 'Server Error' });
                }
                res.json({ success: true, message: 'Directory deleted successfully' });
            });
        } else {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Unable to delete file:', err);
                    return res.status(500).json({ success: false, message: 'Server Error' });
                }
                res.json({ success: true, message: 'File deleted successfully' });
            });
        }
    });
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = path.join(__dirname, 'files', req.body.directory || '');
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });


app.post('/api/upload', upload.single('file'), (req, res) => {
    if (req.file) {
        res.redirect(`/${req.body.directory || ''}`);
    } else {
        res.status(400).send('No file uploaded.');
    }
});

app.use('/files', express.static('files'))


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
