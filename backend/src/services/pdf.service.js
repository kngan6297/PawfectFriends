/**
 * PDF Render Service
 * Compact service for converting HTML to PDF using Puppeteer
 */

import puppeteer from 'puppeteer';

/**
 * Convert HTML content to PDF buffer
 * @param {string} html - HTML content to convert
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function htmlToPdfBuffer(html) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  await page.setContent(
    `<html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: system-ui, -apple-system, Segoe UI, Roboto;
            line-height: 1.5;
            padding: 24px;
          }
          h1, h2, h3 {
            margin: 0.8em 0 0.4em;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          pre {
            white-space: pre-wrap;
          }
          hr {
            border: none;
            border-top: 1px solid #ddd;
            margin: 24px 0;
          }
        </style>
      </head>
      <body>${html}</body>
    </html>`,
    { waitUntil: 'networkidle0' }
  );

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
  });

  await browser.close();

  return pdf;
}

/**
 * Convert markdown content to PDF buffer
 * @param {string} markdown - Markdown content to convert
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function markdownToPdfBuffer(markdown) {
  // Simple markdown to HTML conversion
  const html = markdown
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/\n\n/gim, '</p><p>')
    .replace(/\n/gim, '<br>')
    .replace(/^(.*)$/gim, '<p>$1</p>')
    .replace(/<p><\/p>/gim, '')
    .replace(/<p>(<h[1-6]>.*<\/h[1-6]>)<\/p>/gim, '$1')
    .replace(/<p>(<li>.*<\/li>)<\/p>/gim, '<ul>$1</ul>')
    .replace(/<\/li><br><li>/gim, '</li><li>')
    .replace(/<p>(<ul>.*<\/ul>)<\/p>/gim, '$1');

  return htmlToPdfBuffer(html);
}

/**
 * Generate PDF with custom options
 * @param {string} html - HTML content
 * @param {Object} options - PDF generation options
 * @param {string} [options.format] - Page format (A4, A3, Letter, etc.)
 * @param {Object} [options.margin] - Page margins
 * @param {boolean} [options.printBackground] - Print background colors
 * @param {string} [options.filename] - Output filename
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generatePdf(html, options = {}) {
  const {
    format = 'A4',
    margin = { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    printBackground = true,
    filename = 'document.pdf',
  } = options;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  await page.setContent(
    `<html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: system-ui, -apple-system, Segoe UI, Roboto;
            line-height: 1.5;
            padding: 24px;
          }
          h1, h2, h3 {
            margin: 0.8em 0 0.4em;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          pre {
            white-space: pre-wrap;
          }
          hr {
            border: none;
            border-top: 1px solid #ddd;
            margin: 24px 0;
          }
        </style>
      </head>
      <body>${html}</body>
    </html>`,
    { waitUntil: 'networkidle0' }
  );

  const pdf = await page.pdf({
    format,
    margin,
    printBackground,
  });

  await browser.close();

  return pdf;
}
