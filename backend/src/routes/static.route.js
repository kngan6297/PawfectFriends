/**
 * Static File Serving Routes
 * Serves files from the storage directory
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fs } from 'fs';

const router = express.Router();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage directory
const STORAGE_DIR = path.join(process.cwd(), 'storage');

/**
 * Serve static files from storage directory
 * GET /static/* - Serves files from storage directory
 */
router.get('/static/*', async (req, res) => {
  try {
    // Get file path from URL
    const filePath = req.params[0]; // Everything after /static/
    const fullPath = path.join(STORAGE_DIR, filePath);

    // Security check: ensure the file is within storage directory
    const resolvedPath = path.resolve(fullPath);
    const resolvedStorage = path.resolve(STORAGE_DIR);

    if (!resolvedPath.startsWith(resolvedStorage)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      return res.status(404).json({ error: 'File not found' });
    }

    // Get file stats
    const stats = await fs.stat(fullPath);

    if (!stats.isFile()) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set CORS headers - use specific origin instead of wildcard for credentials
    const origin = req.headers.origin;
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://localhost:19006',
      'http://localhost:19000',
    ];

    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );

    // Set appropriate headers
    const ext = path.extname(fullPath).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.md': 'text/markdown',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
    };

    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    // Special handling for PDFs to display in browser
    if (ext === '.pdf') {
      res.setHeader('Content-Disposition', 'inline'); // Display in browser instead of download
    }

    // Stream the file
    const fileStream = await fs.readFile(fullPath);
    res.send(fileStream);
  } catch (error) {
    console.error('Error serving static file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get file information
 * GET /static/info/* - Returns file metadata
 */
router.get('/static/info/*', async (req, res) => {
  try {
    const filePath = req.params[0];
    const fullPath = path.join(STORAGE_DIR, filePath);

    // Security check
    const resolvedPath = path.resolve(fullPath);
    const resolvedStorage = path.resolve(STORAGE_DIR);

    if (!resolvedPath.startsWith(resolvedStorage)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      return res.status(404).json({ error: 'File not found' });
    }

    const stats = await fs.stat(fullPath);

    if (!stats.isFile()) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({
      path: filePath,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      extension: path.extname(fullPath),
    });
  } catch (error) {
    console.error('Error getting file info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * List files in directory
 * GET /static/list/* - Returns directory contents
 */
router.get('/static/list/*', async (req, res) => {
  try {
    const dirPath = req.params[0] || '';
    const fullPath = path.join(STORAGE_DIR, dirPath);

    // Security check
    const resolvedPath = path.resolve(fullPath);
    const resolvedStorage = path.resolve(STORAGE_DIR);

    if (!resolvedPath.startsWith(resolvedStorage)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if directory exists
    try {
      await fs.access(fullPath);
    } catch {
      return res.status(404).json({ error: 'Directory not found' });
    }

    const stats = await fs.stat(fullPath);

    if (!stats.isDirectory()) {
      return res.status(404).json({ error: 'Not a directory' });
    }

    const files = await fs.readdir(fullPath);
    const fileList = [];

    for (const file of files) {
      const filePath = path.join(fullPath, file);
      const fileStats = await fs.stat(filePath);

      fileList.push({
        name: file,
        path: path.join(dirPath, file),
        isDirectory: fileStats.isDirectory(),
        isFile: fileStats.isFile(),
        size: fileStats.size,
        modified: fileStats.mtime,
      });
    }

    res.json({
      path: dirPath,
      files: fileList,
    });
  } catch (error) {
    console.error('Error listing directory:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
