#!/usr/bin/env node

/**
 * Script to help migrate from SelectWrapper to direct shadcn/ui Select usage
 * Run this script from the frontend directory
 *
 * Note: SelectWrapper has been removed. This script helps identify any remaining
 * SelectWrapper usage that needs to be migrated to the pure Select components.
 */

import fs from "fs";
import path from "path";
import { glob } from "glob";

// Find all files using SelectWrapper
const files = await glob("src/**/*.{ts,tsx}", {
  ignore: ["src/components/ui/Select.tsx"],
});

console.log(`Found ${files.length} files to analyze...`);

let selectWrapperUsage = [];
let migrationSuggestions = [];

files.forEach((filePath) => {
  const fullPath = path.join(process.cwd(), filePath);
  const content = fs.readFileSync(fullPath, "utf8");

  // Check if file uses SelectWrapper
  if (content.includes("SelectWrapper")) {
    const lines = content.split("\n");
    const selectWrapperLines = [];

    lines.forEach((line, index) => {
      if (line.includes("SelectWrapper")) {
        selectWrapperLines.push({
          lineNumber: index + 1,
          content: line.trim(),
          filePath,
        });
      }
    });

    if (selectWrapperLines.length > 0) {
      selectWrapperUsage.push({
        filePath,
        lines: selectWrapperLines,
      });
    }
  }
});

console.log(`\n📊 Migration Analysis Results:`);
console.log(`Found ${selectWrapperUsage.length} files using SelectWrapper`);

if (selectWrapperUsage.length === 0) {
  console.log(`\n🎉 No SelectWrapper usage found! You're ready to remove it.`);
  process.exit(0);
}

// Analyze each usage and provide migration suggestions
selectWrapperUsage.forEach((file) => {
  console.log(`\n📁 ${file.filePath}:`);

  file.lines.forEach((line) => {
    console.log(`  Line ${line.lineNumber}: ${line.content}`);

    // Analyze the usage and provide suggestions
    const suggestion = analyzeUsage(line.content);
    if (suggestion) {
      console.log(`  💡 Suggestion: ${suggestion}`);
    }
  });
});

// Generate migration plan
console.log(`\n🚀 Migration Plan:`);
console.log(
  `\nPhase 1: Simple Components (${getSimpleComponentCount()} components)`
);
console.log(
  `- Start with components that only use basic props (label, options, value, onChange)`
);
console.log(`- These are easiest to migrate`);

console.log(
  `\nPhase 2: Enhanced Components (${getEnhancedComponentCount()} components)`
);
console.log(
  `- Migrate components with error handling, helper text, or size variants`
);
console.log(`- Add proper error states and styling`);

console.log(
  `\nPhase 3: Advanced Components (${getAdvancedComponentCount()} components)`
);
console.log(`- Add advanced features like groups, custom styling, or icons`);
console.log(`- Customize the appearance and behavior`);

console.log(`\nPhase 4: Cleanup`);
console.log(`- Remove SelectWrapper imports`);
console.log(`- Remove SelectWrapper file`);
console.log(`- Update documentation`);

// Migration checklist
console.log(`\n✅ Migration Checklist:`);
console.log(`1. Import Select components directly from "./ui/Select"`);
console.log(`2. Follow shadcn/ui Select patterns and documentation`);
console.log(`3. Test each migrated component thoroughly`);
console.log(`4. Move to the next component once comfortable`);
console.log(`5. All components should now use pure shadcn/ui Select`);

// Helper functions
function analyzeUsage(lineContent) {
  if (lineContent.includes("error=")) {
    return "Has error handling - use conditional styling with cn() utility";
  }
  if (lineContent.includes("helperText=")) {
    return "Has helper text - add separate <p> element below Select";
  }
  if (lineContent.includes("size=")) {
    return "Has size variant - use Tailwind classes (h-8, h-10, h-12)";
  }
  if (lineContent.includes("fullWidth")) {
    return "Has fullWidth - use 'w-full' class on SelectTrigger";
  }
  if (lineContent.includes("disabled=")) {
    return "Has disabled state - pass disabled prop to Select component";
  }
  return "Basic usage - straightforward migration to direct shadcn/ui Select";
}

function getSimpleComponentCount() {
  return selectWrapperUsage.filter((file) =>
    file.lines.some(
      (line) =>
        !line.content.includes("error=") &&
        !line.content.includes("helperText=") &&
        !line.content.includes("size=")
    )
  ).length;
}

function getEnhancedComponentCount() {
  return selectWrapperUsage.filter((file) =>
    file.lines.some(
      (line) =>
        line.content.includes("error=") ||
        line.content.includes("helperText=") ||
        line.content.includes("size=")
    )
  ).length;
}

function getAdvancedComponentCount() {
  return selectWrapperUsage.filter((file) =>
    file.lines.some(
      (line) =>
        line.content.includes("rightIcon=") ||
        line.content.includes("custom") ||
        line.content.includes("className=")
    )
  ).length;
}

console.log(`\n📚 Resources:`);
console.log(`- Select.tsx - Pure shadcn/ui Select components ready to use`);
console.log(`- shadcn/ui docs: https://ui.shadcn.com/docs/components/select`);
console.log(
  `- Radix UI docs: https://www.radix-ui.com/primitives/docs/components/select`
);

console.log(`\n🎯 Next Steps:`);
console.log(`1. Import Select components directly from "./ui/Select"`);
console.log(`2. Use the pure shadcn/ui Select components as documented`);
console.log(`3. Test thoroughly before moving to the next component`);
console.log(
  `4. Consider creating a reusable FormSelect component for consistency`
);
console.log(`5. Follow shadcn/ui Select patterns and documentation`);
