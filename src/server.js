const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;

// Import the original working files
const convertDocxToMarkdown = require('./docxToMarkdown');
const cleanMarkdownFile = require('./cleanMarkdown');
const extractVulnerabilities = require('./extractVulnerabilities');

const app = express();
const port = 3001;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
const upload = multer({
    dest: uploadsDir,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            cb(null, true);
        } else {
            cb(new Error('Only .docx files are allowed!'), false);
        }
    }
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Handle file upload and conversion
app.post('/convert', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log(`Converting ${req.file.path} to Markdown...`);
        const markdownPath = await convertDocxToMarkdown(req.file.path);
        
        console.log('Cleaning Markdown file...');
        await cleanMarkdownFile(markdownPath);
        
        console.log('Extracting vulnerabilities...');
        const csvPath = await extractVulnerabilities(markdownPath);

        // Read the generated CSV file
        const csvContent = await fsPromises.readFile(csvPath, 'utf8');

        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${path.basename(csvPath)}`);

        // Send the CSV file
        res.send(csvContent);

        // Clean up temporary files
        await fsPromises.unlink(req.file.path);
        await fsPromises.unlink(markdownPath);
        await fsPromises.unlink(csvPath);
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).json({ error: 'Error processing file: ' + error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 