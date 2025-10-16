#!/usr/bin/env node

/**
 * Migration script to replace old Select component imports with SelectWrapper
 * Run this script from the frontend directory
 */

import fs from "fs";
import path from "path";
import { glob } from "glob";

// Configuration - Legacy patterns (old Select.tsx has been removed)
const OLD_IMPORT_PATTERNS = [
  // These patterns are no longer needed since old Select.tsx has been removed
  // Keeping for reference in case of future migrations
];

const NEW_IMPORT =
  'import { SelectWrapper as Select } from "@/components/ui/SelectWrapper"';

// Find all TypeScript/TSX files
const files = await glob("src/**/*.{ts,tsx}", {
  ignore: [
    "src/components/ui/Select.tsx",
  ],
});

console.log(`Found ${files.length} files to process...`);

let totalReplacements = 0;

files.forEach((filePath) => {
  const fullPath = path.join(process.cwd(), filePath);
  let content = fs.readFileSync(fullPath, "utf8");
  let fileChanged = false;
  let replacements = 0;

  OLD_IMPORT_PATTERNS.forEach((pattern) => {
    if (content.includes(pattern)) {
      // Calculate relative path from file to SelectWrapper
      const relativePath = path.relative(
        path.dirname(fullPath),
        "src/components/ui/SelectWrapper"
      );
      const importPath = relativePath.startsWith(".")
        ? relativePath
        : `./${relativePath}`;
      const newImport = `import { SelectWrapper as Select } from "${importPath}"`;

      content = content.replace(pattern, newImport);
      fileChanged = true;
      replacements++;
      console.log(`  ✓ Updated import in ${filePath}`);
    }
  });

  if (fileChanged) {
    fs.writeFileSync(fullPath, content);
    totalReplacements += replacements;
  }
});

console.log(`\nMigration complete!`);
console.log(`Total files processed: ${files.length}`);
console.log(`Total replacements made: ${totalReplacements}`);

// Instructions for next steps
console.log(`\nNext steps:`);
console.log(`1. ✅ SelectProvider has been removed from main.tsx and AppProviders.tsx`);
console.log(`2. ✅ SelectWrapper has been removed - using pure shadcn/ui Select`);
console.log(`3. ✅ All Select components can now use pure shadcn/ui Select`);
console.log(`4. 🚀 Ready to use Select components directly from "./ui/Select"`);
console.log(`5. Run 'npm run analyze:select' to check for any remaining SelectWrapper usage`);
