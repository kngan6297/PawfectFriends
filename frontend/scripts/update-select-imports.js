#!/usr/bin/env node

/**
 * Script to update all SelectWrapper imports to use pure Select components
 * Run this script from the frontend directory
 */

import fs from "fs";
import path from "path";
import { glob } from "glob";

// Find all files that might have SelectWrapper imports
const files = await glob("src/**/*.{ts,tsx}", {
  ignore: ["src/components/ui/Select.tsx"],
});

console.log(`Found ${files.length} files to process...`);

let totalReplacements = 0;
let filesUpdated = 0;

files.forEach((filePath) => {
  const fullPath = path.join(process.cwd(), filePath);
  let content = fs.readFileSync(fullPath, "utf8");
  let fileChanged = false;
  let replacements = 0;

  // Pattern 1: Import SelectWrapper as Select
  const pattern1 =
    /import\s+\{\s*SelectWrapper\s+as\s+Select\s*\}\s+from\s+["']([^"']*SelectWrapper)["']/g;
  if (content.includes("SelectWrapper")) {
    // Calculate relative path from file to Select
    const relativePath = path.relative(
      path.dirname(fullPath),
      "src/components/ui/Select"
    );
    const importPath = relativePath.startsWith(".")
      ? relativePath
      : `./${relativePath}`;

    // Replace the import
    content = content.replace(pattern1, (match, oldPath) => {
      const newImport = `import {\n  Select,\n  SelectContent,\n  SelectItem,\n  SelectTrigger,\n  SelectValue,\n  SelectGroup,\n  SelectLabel,\n  SelectSeparator\n} from "${importPath}"`;
      fileChanged = true;
      replacements++;
      console.log(
        `  ✓ Updated import in ${filePath}: SelectWrapper → pure Select components`
      );
      return newImport;
    });

    // Pattern 2: Direct SelectWrapper import
    const pattern2 =
      /import\s+\{\s*SelectWrapper\s*\}\s+from\s+["']([^"']*SelectWrapper)["']/g;
    content = content.replace(pattern2, (match, oldPath) => {
      const newImport = `import {\n  Select,\n  SelectContent,\n  SelectItem,\n  SelectTrigger,\n  SelectValue,\n  SelectGroup,\n  SelectLabel,\n  SelectSeparator\n} from "${importPath}"`;
      fileChanged = true;
      replacements++;
      console.log(
        `  ✓ Updated import in ${filePath}: SelectWrapper → pure Select components`
      );
      return newImport;
    });
  }

  if (fileChanged) {
    fs.writeFileSync(fullPath, content);
    totalReplacements += replacements;
    filesUpdated++;
  }
});

console.log(`\n✅ Import Update Complete!`);
console.log(`Total files processed: ${files.length}`);
console.log(`Files updated: ${filesUpdated}`);
console.log(`Total replacements made: ${totalReplacements}`);

if (totalReplacements > 0) {
  console.log(`\n🎯 Next Steps:`);
  console.log(
    `1. Test your application to ensure all Select components work correctly`
  );
  console.log(
    `2. Update component usage to use the new Select component structure`
  );
  console.log(`3. Remove any unused imports or variables`);
  console.log(
    `4. Consider creating a reusable FormSelect component for consistency`
  );

  console.log(`\n📚 Migration Guide:`);
  console.log(`\nBefore (SelectWrapper):`);
  console.log(`<SelectWrapper`);
  console.log(`  label="Country"`);
  console.log(`  options={countryOptions}`);
  console.log(`  value={country}`);
  console.log(`  onChange={handleChange}`);
  console.log(`  fullWidth`);
  console.log(`/>`);

  console.log(`\nAfter (Pure Select):`);
  console.log(`<div className="space-y-2">`);
  console.log(
    `  <label className="block text-sm font-medium text-gray-700">Country</label>`
  );
  console.log(`  <Select value={country} onValueChange={setCountry}>`);
  console.log(`    <SelectTrigger className="w-full">`);
  console.log(`      <SelectValue placeholder="Select a country" />`);
  console.log(`    </SelectTrigger>`);
  console.log(`    <SelectContent>`);
  console.log(`      {countryOptions.map((option) => (`);
  console.log(`        <SelectItem key={option.value} value={option.value}>`);
  console.log(`          {option.label}`);
  console.log(`        </SelectItem>`);
  console.log(`      ))}`);
  console.log(`    </SelectContent>`);
  console.log(`  </Select>`);
  console.log(`</div>`);

  console.log(`\n💡 Key Changes:`);
  console.log(`• onChange → onValueChange`);
  console.log(`• options array → SelectItem components`);
  console.log(`• label prop → separate <label> element`);
  console.log(`• fullWidth → className="w-full" on SelectTrigger`);
  console.log(`• error prop → conditional styling with cn() utility`);
  console.log(`• helperText prop → separate <p> element below Select`);
} else {
  console.log(
    `\n🎉 No SelectWrapper imports found! Your components are already using pure Select.`
  );
  console.log(
    `\n✅ SimpleSelect has also been removed and replaced with pure shadcn/ui Select components.`
  );
}
