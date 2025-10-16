/**
 * PDF Generator for Adoption Contracts
 * Uses puppeteer to generate PDFs from HTML content
 *
 * @deprecated Use pdf.service.js instead
 */

import puppeteer from 'puppeteer';
import {
  htmlToPdfBuffer,
  markdownToPdfBuffer,
} from '../services/pdf.service.js';

/**
 * Generate PDF from contract data
 * @param {Object} contractData - Contract data from buildAdoptionContract
 * @returns {Buffer} PDF buffer
 */
export const generateContractPDF = async (contractData) => {
  try {
    // Convert markdown content to HTML
    const htmlContent = markdownToHtml(contractData.content);

    // Create full HTML document
    const html = `
<!DOCTYPE html>
<html lang="${contractData.language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${contractData.title}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 40px;
            color: #333;
            background: white;
        }
        
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        
        h2 {
            color: #34495e;
            margin-top: 30px;
            margin-bottom: 15px;
            border-left: 4px solid #3498db;
            padding-left: 15px;
        }
        
        h3 {
            color: #2c3e50;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        
        p {
            margin-bottom: 10px;
            text-align: justify;
        }
        
        ul, ol {
            margin-bottom: 15px;
            padding-left: 20px;
        }
        
        li {
            margin-bottom: 5px;
        }
        
        .contract-header {
            text-align: center;
            margin-bottom: 40px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .contract-id {
            font-size: 14px;
            color: #666;
            margin-top: 10px;
        }
        
        .parties-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        
        .party-info {
            margin-bottom: 15px;
        }
        
        .party-label {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        
        .pet-details {
            background: #e8f5e8;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        
        .terms-section {
            margin-bottom: 30px;
        }
        
        .signature-section {
            margin-top: 50px;
            page-break-inside: avoid;
        }
        
        .signature-line {
            border-bottom: 1px solid #333;
            width: 200px;
            display: inline-block;
            margin-right: 20px;
        }
        
        .footer {
            margin-top: 50px;
            text-align: center;
            font-style: italic;
            color: #666;
            font-size: 12px;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 20px;
            }
            
            .page-break {
                page-break-before: always;
            }
        }
    </style>
</head>
<body>
    <div class="contract-header">
        <h1>${contractData.title}</h1>
        <div class="contract-id">Contract ID: ${contractData.contractId}</div>
    </div>
    
    ${htmlContent}
    
    <div class="footer">
        <p>Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} | Version ${contractData.version}</p>
    </div>
</body>
</html>
    `;

    // Use the compact PDF service
    return await htmlToPdfBuffer(html);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};

/**
 * Convert markdown content to HTML
 * @param {string} markdown - Markdown content
 * @returns {string} HTML content
 */
const markdownToHtml = (markdown) => {
  let html = markdown;

  // Convert headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Convert bold text
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Convert italic text
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Convert unordered lists
  html = html.replace(/^[\s]*[-*+]\s+(.*)$/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Convert ordered lists
  html = html.replace(/^[\s]*\d+\.\s+(.*)$/gim, '<li>$1</li>');

  // Convert line breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');

  // Wrap in paragraphs
  html = '<p>' + html + '</p>';

  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p><br><\/p>/g, '');

  return html;
};

/**
 * Generate contract preview (HTML)
 * @param {Object} contractData - Contract data from buildAdoptionContract
 * @returns {string} HTML content for preview
 */
export const generateContractPreview = (contractData) => {
  const htmlContent = markdownToHtml(contractData.content);

  return `
<!DOCTYPE html>
<html lang="${contractData.language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${contractData.title} - Preview</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
            background: #f5f5f5;
        }
        
        .preview-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        
        h2 {
            color: #34495e;
            margin-top: 30px;
            margin-bottom: 15px;
            border-left: 4px solid #3498db;
            padding-left: 15px;
        }
        
        h3 {
            color: #2c3e50;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        
        p {
            margin-bottom: 10px;
            text-align: justify;
        }
        
        ul, ol {
            margin-bottom: 15px;
            padding-left: 20px;
        }
        
        li {
            margin-bottom: 5px;
        }
        
        .contract-header {
            text-align: center;
            margin-bottom: 40px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .contract-id {
            font-size: 14px;
            color: #666;
            margin-top: 10px;
        }
        
        .parties-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        
        .party-info {
            margin-bottom: 15px;
        }
        
        .party-label {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        
        .pet-details {
            background: #e8f5e8;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        
        .signature-section {
            margin-top: 50px;
            page-break-inside: avoid;
        }
        
        .signature-line {
            border-bottom: 1px solid #333;
            width: 200px;
            display: inline-block;
            margin-right: 20px;
        }
        
        .footer {
            margin-top: 50px;
            text-align: center;
            font-style: italic;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        <div class="contract-header">
            <h1>${contractData.title}</h1>
            <div class="contract-id">Contract ID: ${contractData.contractId}</div>
        </div>
        
        ${htmlContent}
        
        <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} | Version ${contractData.version}</p>
        </div>
    </div>
</body>
</html>
  `;
};
