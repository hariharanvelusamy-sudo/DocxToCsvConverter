const mammoth = require('mammoth');
const TurndownService = require('turndown');
const fs = require('fs').promises;
const path = require('path');

async function convertDocxToMarkdown(inputPath) {
    try {
        // Read the DOCX file and convert to HTML
        const result = await mammoth.convertToHtml({ path: inputPath });
        const html = result.value;

        // Convert HTML to Markdown
        const turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced'
        });
        const markdown = turndownService.turndown(html);

        // Generate output path (same name but with .md extension)
        const outputPath = path.join(
            path.dirname(inputPath),
            path.basename(inputPath, '.docx') + '.md'
        );

        // Write the markdown to a file
        await fs.writeFile(outputPath, markdown, 'utf8');
        console.log(`✓ Converted ${path.basename(inputPath)} to Markdown`);
        return outputPath; // Return the path instead of the content
    } catch (error) {
        console.error('Error converting DOCX to Markdown:', error.message);
        throw error;
    }
}

// Example usage
// convertDocxToMarkdown('path/to/your/document.docx');

module.exports = convertDocxToMarkdown; 