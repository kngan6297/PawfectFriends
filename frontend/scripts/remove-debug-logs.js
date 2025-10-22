#!/usr/bin/env node

/**
 * Script to remove debug console.log statements from production build
 * This helps clean up the console and improve performance
 */

const fs = require('fs');
const path = require('path');

// Patterns to match debug logs
const debugPatterns = [
  /console\.log\([^)]*🔍[^)]*\);?\s*/g,
  /console\.log\([^)]*Debug[^)]*\);?\s*/g,
  /console\.log\([^)]*debug[^)]*\);?\s*/g,
  /\/\/ Debug:.*\n\s*console\.log\([^)]*\);?\s*/g,
];

function removeDebugLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Remove debug patterns
    debugPatterns.forEach(pattern => {
      content = content.replace(pattern, '');
    });
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Cleaned debug logs from: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  let cleanedCount = 0;
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      cleanedCount += processDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js')) {
      if (removeDebugLogs(filePath)) {
        cleanedCount++;
      }
    }
  });
  
  return cleanedCount;
}

// Main execution
const srcDir = path.join(__dirname, '..', 'src');
console.log('🧹 Removing debug logs from production build...');
console.log(`📁 Processing directory: ${srcDir}`);

const cleanedCount = processDirectory(srcDir);
console.log(`\n✨ Cleaned ${cleanedCount} files`);
console.log('🎉 Debug log cleanup complete!');
