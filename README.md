# VAPT Report Converter

A web application that converts VAPT (Vulnerability Assessment and Penetration Testing) reports from DOCX format to CSV format.

## Features

- Upload DOCX files through a web interface
- Automatic conversion of DOCX to CSV
- Extracts vulnerability information including:
  - ID
  - Name
  - Description
  - Treatment Plan
  - Steps to Reproduce
  - Severity
  - Status
  - And more...

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## Usage

1. Start the server:
```bash
npm start
```

2. Open your browser and go to `http://localhost:3001`

3. Click the "Upload VAPT Report" button and select your DOCX file

4. The converted CSV file will be automatically downloaded

## Project Structure

```
docx-to-csv/
├── src/
│   ├── server.js           # Express server and file handling
│   ├── docxToMarkdown.js   # DOCX to Markdown conversion
│   ├── cleanMarkdown.js    # Markdown cleaning utilities
│   └── extractVulnerabilities.js # Vulnerability extraction
├── public/
│   └── index.html          # Web interface
├── uploads/                # Temporary file storage
├── package.json
└── README.md
```

## Dependencies

- express: Web server framework
- multer: File upload handling
- mammoth: DOCX to HTML conversion
- turndown: HTML to Markdown conversion
- csv-writer: CSV file generation

## License

ISC 