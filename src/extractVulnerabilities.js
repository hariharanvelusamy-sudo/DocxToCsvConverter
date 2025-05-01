const fs = require('fs').promises;
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

async function extractVulnerabilities(markdownPath) {
    try {
        // Read the markdown file
        const content = await fs.readFile(markdownPath, 'utf8');
        
        // Split the content by vulnerability sections (level 2 headings)
        const sections = content.split(/^## /m).slice(1);
        console.log(`Split content into ${sections.length} vulnerability sections`);
        
        // Process each section
        const vulnerabilities = [];
        
        for (const section of sections) {
            // Extract the title from the first line
            const lines = section.split('\n');
            const title = lines[0].trim();
            
            const vuln = {
                Name: title
            };
            
            // Search for fields in the section
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // Check for field markers
                if (line === 'ID') {
                    // The value is usually 2 lines after the field name
                    let j = i + 1;
                    while (j < lines.length && !lines[j].trim()) j++; // Skip empty lines
                    if (j < lines.length) {
                        vuln.ID = lines[j].trim();
                    }
                }
                else if (line === 'Severity' || line === 'Severity:') {
                    // The value is usually 2 lines after the field name
                    let j = i + 1;
                    while (j < lines.length && !lines[j].trim()) j++; // Skip empty lines
                    if (j < lines.length) {
                        vuln.Severity = lines[j].trim();
                    }
                }
                else if (line === 'Re-Testing Status' || line === 'Re-Testing Status:' || line === 'Status' || line === 'Status:') {
                    // The value is usually 2 lines after the field name
                    let j = i + 1;
                    while (j < lines.length && !lines[j].trim()) j++; // Skip empty lines
                    if (j < lines.length) {
                        const value = lines[j].trim();
                        // Store under the key that matched
                        if (line.startsWith('Re-Testing')) {
                            vuln['Re-Testing Status'] = value;
                        } else {
                            vuln.Status = value;
                        }
                    }
                }
                else if (line === 'URL' || line === 'URL:') {
                    // The value is usually 2 lines after the field name
                    let j = i + 1;
                    while (j < lines.length && !lines[j].trim()) j++; // Skip empty lines
                    if (j < lines.length) {
                        vuln.URL = lines[j].trim();
                    }
                }
            }
            
            // Extract multi-line fields
            const descriptionLines = extractParagraph(section, 'Description');
            if (descriptionLines) {
                vuln.Description = descriptionLines.join('\n');
            }
            
            const recommendationsLines = extractParagraph(section, 'Recommendations');
            if (recommendationsLines) {
                vuln.Recommendations = recommendationsLines.join('\n');
            }
            
            const stepsLines = extractParagraph(section, 'Steps to Reproduce');
            if (stepsLines) {
                vuln['Steps to Reproduce'] = stepsLines.join('\n');
            }
            
            vulnerabilities.push(vuln);
        }
        
        // Map vulnerabilities to the required CSV format
        const mappedVulnerabilities = vulnerabilities.map(vuln => {
            return {
                'ID *': vuln.ID || '',
                'Name *': vuln.Name || '',
                'Description': vuln.Description || '',
                'Treatment Plan': (vuln.Recommendations || ''),
                'Steps to Reproduce': vuln['Steps to Reproduce'] || '',
                'Severity *': vuln.Severity || '',
                'Status *': vuln['Re-Testing Status'] || vuln.Status || '',
                'Fix Available': '',
                'First Seen': '',
                'Assets Affected Name': vuln.URL || '',
                'Assets Affected Type': '',
                'Assets Affected Tags': '',
                'Owner Email ID': ''
            };
        });
        
        // Log for debugging
        console.log('Extracted vulnerabilities:');
        for (const vuln of vulnerabilities) {
            console.log(`- ${vuln.Name} (ID: ${vuln.ID || 'Not found'}, Severity: ${vuln.Severity || 'Not found'}, Status: ${vuln['Re-Testing Status'] || vuln.Status || 'Not found'})`);
        }
        
        // Generate the output CSV path
        const csvPath = path.join(
            path.dirname(markdownPath),
            path.basename(markdownPath, '.md') + '.csv'
        );
        
        // Define the CSV writer
        const csvWriter = createObjectCsvWriter({
            path: csvPath,
            header: [
                { id: 'ID *', title: 'ID *' },
                { id: 'Name *', title: 'Name *' },
                { id: 'Description', title: 'Description' },
                { id: 'Treatment Plan', title: 'Treatment Plan' },
                { id: 'Steps to Reproduce', title: 'Steps to Reproduce' },
                { id: 'Severity *', title: 'Severity *' },
                { id: 'Status *', title: 'Status *' },
                { id: 'Fix Available', title: 'Fix Available' },
                { id: 'First Seen', title: 'First Seen' },
                { id: 'Assets Affected Name', title: 'Assets Affected Name' },
                { id: 'Assets Affected Type', title: 'Assets Affected Type' },
                { id: 'Assets Affected Tags', title: 'Assets Affected Tags' },
                { id: 'Owner Email ID', title: 'Owner Email ID' }
            ]
        });
        
        // Write the vulnerabilities to the CSV file
        await csvWriter.writeRecords(mappedVulnerabilities);
        
        console.log(`✓ Extracted ${mappedVulnerabilities.length} vulnerabilities to ${path.basename(csvPath)}`);
        return csvPath;
    } catch (error) {
        console.error('Error extracting vulnerabilities:', error.message);
        throw error;
    }
}

// Helper function to extract a paragraph
function extractParagraph(text, fieldName) {
    const lines = text.split('\n');
    const results = [];
    let capturing = false;
    let startIndex = -1;
    
    // Find the field marker
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line === fieldName || line === fieldName + ':') {
            startIndex = i + 1;
            break;
        }
    }
    
    if (startIndex === -1) return null;
    
    // Skip empty lines
    while (startIndex < lines.length && !lines[startIndex].trim()) {
        startIndex++;
    }
    
    // Capture until we hit another field
    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Stop at another field marker
        if (line === 'ID' || line === 'Severity' || line === 'Re-Testing Status' || 
            line === 'Status' || line === 'URL' || line === 'Description' || 
            line === 'Impact' || line === 'Recommendations' || 
            line === 'Steps to Reproduce' || line === 'References' ||
            line === 'Proof of Concept' || line.startsWith('Figure') ||
            line === 'ID:' || line === 'Severity:' || line === 'Re-Testing Status:' || 
            line === 'Status:' || line === 'URL:' || line === 'Description:' || 
            line === 'Impact:' || line === 'Recommendations:' || 
            line === 'Steps to Reproduce:' || line === 'References:' ||
            line === 'Proof of Concept:') {
            break;
        }
        
        // Add non-empty lines
        if (line) {
            results.push(line);
        }
    }
    
    return results.length > 0 ? results : null;
}

module.exports = extractVulnerabilities; 