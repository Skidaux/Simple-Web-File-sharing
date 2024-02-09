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

const readDirectory = async (dirPath) => {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const files = [];

    for (let dirent of entries) {
        const itemPath = path.join(dirPath, dirent.name).replace(/\\/g, '/'); // Ensure forward slashes
        // Only append the name and type, construct relative path for each item
        const relativePath = path.relative(__dirname + '/files', itemPath);
        files.push({
            name: dirent.name,
            type: dirent.isDirectory() ? 'directory' : 'file',
            // Append '/' to directories to indicate it's a directory
            path: dirent.isDirectory() ? `${relativePath}/` : relativePath,
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
    fs.readFile(filePath, 'utf8', (err, data) => {
        
            if (err) {
                console.error('Unable to read file:', err);
                const status = err.code === 'ENOENT' ? 404 : 500;
                return res.status(status).send('Error processing your request');
            }
        res.json( { content: data, filename: path.basename(relativePath), filePath: relativePath });
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


// app.get('/*', (req, res) => {
//     const directoryPath = path.join(__dirname, 'files', req.params[0] || '');
//     const parentPath = path.dirname(req.params[0] || '.');
//     console.log(directoryPath);
//     fs.readdir(directoryPath, { withFileTypes: true }, (err, files) => {
//         if (err) {
//             if (err.code === 'ENOENT') {
//                 return res.status(404).send('Directory not found');
//             }
//             console.error('Unable to scan directory:', err);
//             return res.status(500).send('Server Error');
//         }
//         res.render('index', { files: files, currentPath: req.params[0] || '', parentPath: parentPath, path: path });
//     });
// });


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
    const filePath = path.join(__dirname, 'files', req.params[0]);
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error('Unable to delete file:', err);
            return res.status(500).json({ success: false, message: 'Server Error' });
        }
        res.json({ success: true, message: 'File deleted successfully' });
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



app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
