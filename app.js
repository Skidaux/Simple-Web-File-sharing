const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const app = express();
const multer  = require('multer');


app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');


app.get('/download/*', (req, res) => {
    const filePath = path.join(__dirname, 'files', req.params[0]);
    res.download(filePath, (err) => {
        if (err) {
            console.error('File download failed:', err);
            res.status(500).send('Server Error');
        }
    });
});


app.get('/edit/*', (req, res) => {
    
    const relativePath = req.params[0];
    const filePath = path.join(__dirname, 'files', relativePath);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.status(404).send('File not found');
            }
            console.error('Unable to read file:', err);
            return res.status(500).send('Server Error');
        }
        res.render('edit', { content: data, filename: path.basename(relativePath), filePath: relativePath });
    });
});


app.get('/*', (req, res) => {
    const directoryPath = path.join(__dirname, 'files', req.params[0] || '');
    const parentPath = path.dirname(req.params[0] || '.');
    console.log(directoryPath);
    fs.readdir(directoryPath, { withFileTypes: true }, (err, files) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.status(404).send('Directory not found');
            }
            console.error('Unable to scan directory:', err);
            return res.status(500).send('Server Error');
        }
        res.render('index', { files: files, currentPath: req.params[0] || '', parentPath: parentPath, path: path });
    });
});


app.post('/save/*', (req, res) => {
    const filePath = path.join(__dirname, 'files', req.params[0]);
    fs.writeFile(filePath, req.body.content, (err) => {
        if (err) {
            console.error('Unable to write file:', err);
            return res.status(500).send('Server Error');
        }
        res.redirect('/');
    });
});

app.post('/delete/*', (req, res) => {
    const filePath = path.join(__dirname, 'files', req.params[0]);
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error('Unable to delete file:', err);
            return res.status(500).send('Server Error');
        }
        res.redirect('/');
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


app.post('/upload', upload.single('file'), (req, res) => {
    if (req.file) {
        res.redirect(`/${req.body.directory || ''}`);
    } else {
        res.status(400).send('No file uploaded.');
    }
});



app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
