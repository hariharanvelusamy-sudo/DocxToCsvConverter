const fs = require('fs').promises;
const path = require('path');

async function cleanMarkdownFile(markdownPath) {
    try {
        // Read the markdown file
        const content = await fs.readFile(markdownPath, 'utf8');

        // Remove base64 encoded images with improved regex
        let cleanedContent = content
            // Handle standard markdown image syntax with base64
            .replace(/!\[.*?\]\(data:image\/[^;]+;base64,[^)]+\)/g, '')
            // Handle HTML img tags with base64
            .replace(/<img[^>]*src="data:image\/[^;]+;base64,[^"]+"[^>]*>/g, '')
            // Handle any remaining base64 data URLs
            .replace(/data:image\/[^;]+;base64,[^\s)]+/g, '')
            // Clean up any empty lines that might be left
            .replace(/\n\s*\n\s*\n/g, '\n\n');

        // Remove everything before the Findings section
        const findingsIndex = cleanedContent.indexOf('# **Findings**');
        if (findingsIndex !== -1) {
            cleanedContent = cleanedContent.substring(findingsIndex);
        } else {
            console.warn('⚠️  Warning: "Findings" section not found in the document');
        }

        // Write the cleaned content back to the file
        await fs.writeFile(markdownPath, cleanedContent, 'utf8');
        console.log(`✓ Cleaned ${path.basename(markdownPath)} (removed base64 images and content before Findings)`);
    } catch (error) {
        console.error('Error cleaning markdown file:', error.message);
        throw error;
    }
}

module.exports = cleanMarkdownFile; 