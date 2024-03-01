const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const app = express();
const cors = require('cors')
const multer = require('multer');
const https = require('https');
app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// const allowedHost = 'domain_here.com';
// function (req, res, next) {
//     const host = req.get('Host');
//     if (host !== allowedHost) {
//         return res.status(503).send('Server Unactive');
//     }
//     next();
// }

// app.use((req, res, next) => {

//     if (!req.secure) {
//         return res.redirect(`https://${req.hostname}${req.url}`);
//     }
//     next();
// });


// app.use((req, res, next) => {
//     if (!req.secure) {
//         return res.redirect(`https://localhost${req.url}`);
//         // return res.redirect(`https://${req.headers.host}${req.url}`);
//     }
//     next();
// });

//app.use(checkHost)

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

const isTextFile = (buffer) => {
    // Limit the buffer size to prevent ERR_STRING_TOO_LONG
    const maxBufferSize = 1024 * 1024; // 1MB
    const limitedBuffer = buffer.slice(0, maxBufferSize);

    // Convert the buffer to a UTF-8 encoded string
    const utf8String = limitedBuffer.toString('utf8');

    // Check if the file contains fewer than 20 characters
    if (utf8String.length < 20) {
        return true; // Treat as text file
    }

    // Count the occurrences of text characters, emojis, and other special symbols
    let textCount = 0;
    let specialCount = 0;

    for (const char of utf8String) {
        const code = char.charCodeAt(0);
        if ((code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13) {
            textCount++;
        } else {
            specialCount++;
        }
    }

    // Calculate the ratio of text characters to emojis and other special symbols
    const totalCharacters = textCount + specialCount;
    const textRatio = textCount / totalCharacters;
    const specialRatio = specialCount / totalCharacters;

    // Check if the text ratio is greater than or equal to 3:1
    return textRatio >= 0.75 && specialRatio <= 0.25;
};


const readDirectory = async (dirPath) => {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const directories = [];
    const files = [];

    // Sort entries by name
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (let dirent of entries) {
        const itemPath = path.join(dirPath, dirent.name).replace(/\\/g, '/');
        const relativePath = path.relative(__dirname + '/files', itemPath);
        const stats = await fs.promises.stat(itemPath);
        const fileSize = formatFileSize(stats.size);

        let isText = null;
        if (!dirent.isDirectory()) {
            const fileBuffer = await fs.promises.readFile(itemPath);
            isText = isTextFile(fileBuffer);
        }

        if (dirent.isDirectory()) {
            directories.push({
                name: dirent.name,
                type: 'directory',
                path: `${relativePath}/`,
                size: null,
                isText: null,
            });
        } else {
            files.push({
                name: dirent.name,
                type: 'file',
                path: relativePath,
                size: fileSize,
                isText: isText,
            });
        }
    }

    return [...directories, ...files];
};


app.get('/api/download/*', (req, res) => {
    const filePath = path.join(__dirname, 'files', req.params[0]);
    res.download(filePath, (err) => {
        if (err) {
            if (!res.headersSent) {
                console.error('File download failed:', err);
                res.status(500).json({ error: "Download failed" });
            }
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

        if (stats.size > 16384) {
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
        res.status(400).json({ error: 'No file uploaded.' });
    }
});

app.post('/api/create', (req, res) => {
    const { type, directory, name, content } = req.body;
    const filePath = path.join(__dirname, 'files', directory, name);

    if (type === 'file') {
        fs.writeFile(filePath, content, (err) => {
            if (err) {
                console.error('Unable to create file:', err);
                return res.status(500).json({ success: false, message: 'Server Error' });
            }
            res.json({ success: true, message: 'File created successfully' });
        });
    } else if (type === 'directory') {
        fs.mkdir(filePath, { recursive: true }, (err) => {
            if (err) {
                console.error('Unable to create folder:', err);
                return res.status(500).json({ success: false, message: 'Server Error' });
            }
            res.json({ success: true, message: 'Folder created successfully' });
        });
    } else {
        res.status(400).json({ success: false, message: 'Invalid request' });
    }
});


app.use('/files', express.static('files'))
app.use(express.static(path.join(__dirname, 'dist'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    },
}));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// const options = {
//     key: fs.readFileSync("priv.pem"),
//     cert: fs.readFileSync("cert.pem")
// };


// //Opening the server with the http/s protocol
// https.createServer(options, app).listen(443, () => {
//     console.log(`Server started on port 443`);
// });

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
