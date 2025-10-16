#!/usr/bin/env node

/**
 * Script to fix Windows backslash import paths that are causing TypeScript errors
 * Run this script from the frontend directory
 */

import fs from "fs";
import path from "path";
import { glob } from "glob";

// Find all TypeScript/TSX files
const files = await glob("src/**/*.{ts,tsx}", {
  ignore: [
    "src/components/ui/Select.tsx",
    "src/components/ui/SelectShadcn.tsx",
    "src/components/ui/SelectWrapper.tsx",
  ],
});

console.log(`Found ${files.length} files to process...`);

let totalReplacements = 0;

files.forEach((filePath) => {
  const fullPath = path.join(process.cwd(), filePath);
  let content = fs.readFileSync(fullPath, "utf8");
  let fileChanged = false;
  let replacements = 0;

  // Fix Windows backslash paths in imports
  const backslashPattern =
    /import\s+\{[^}]*\}\s+from\s+["']([^"']*\\)([^"']*)["']/g;

  content = content.replace(backslashPattern, (match, pathPart, fileName) => {
    const fixedPath = pathPart.replace(/\\/g, "/") + fileName;
    const newImport = match.replace(pathPart + fileName, fixedPath);
    fileChanged = true;
    replacements++;
    console.log(
      `  ✓ Fixed import path in ${filePath}: ${
        pathPart + fileName
      } → ${fixedPath}`
    );
    return newImport;
  });

  if (fileChanged) {
    fs.writeFileSync(fullPath, content);
    totalReplacements += replacements;
  }
});

console.log(`\nPath fixing complete!`);
console.log(`Total files processed: ${files.length}`);
console.log(`Total replacements made: ${totalReplacements}`);

console.log(`\nNext steps:`);
console.log(`1. Run 'npm run build' to verify TypeScript compilation works`);
console.log(
  `2. Test your application to ensure all Select components work correctly`
);
console.log(`3. Consider gradually migrating to direct shadcn/ui Select usage`);
console.log(`4. Remove the old Select.tsx file once migration is complete`);
