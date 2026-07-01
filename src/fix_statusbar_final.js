/**
 * Android Status Bar Padding - Final Pass
 * Fixes screens with single-line container style: { flex: 1 }
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname);
let totalFixed = 0;

function getAllTsxFiles(dir) {
  const results = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results.push(...getAllTsxFiles(full));
    } else if (item.endsWith('.tsx')) {
      results.push(full);
    }
  }
  return results;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Skip if already fixed
  if (content.includes('StatusBar.currentHeight')) return;

  // ── Ensure StatusBar imported ────────────────────────────────────────────────
  const rnImportMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]react-native['"];?/);
  if (rnImportMatch) {
    const imports = rnImportMatch[1];
    if (!imports.includes('StatusBar')) {
      const newImports = imports.trim() + ', StatusBar';
      content = content.replace(
        /import\s*\{([^}]+)\}\s*from\s*['"]react-native['"];?/,
        `import { ${newImports} } from 'react-native';`
      );
    }
  }

  // ── Fix single-line container: { flex: 1 } ────────────────────────────────── 
  content = content.replace(
    /container:\s*\{\s*flex:\s*1\s*\}/g,
    `container: { flex: 1, paddingTop: StatusBar.currentHeight || 0 }`
  );

  // ── Fix single-line container: { flex: 1, ... } (with more props) ────────────
  // This won't match the above since it already has paddingTop, handled correctly

  // ── Fix multiline container that starts with flex: 1 (pass 1 already handled) ─
  content = content.replace(
    /(container:\s*\{\s*\n\s+flex:\s*1,?\s*\n\s+)(\w)/g,
    (match, before, firstChar) => {
      if (match.includes('paddingTop')) return match;
      return `${before}paddingTop: StatusBar.currentHeight || 0,\n    ${firstChar}`;
    }
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalFixed++;
    console.log('✅ Fixed:', path.relative(SRC_DIR, filePath));
  }
}

const screensDir = path.join(SRC_DIR, 'screens');
const files = getAllTsxFiles(screensDir);
console.log(`Scanning ${files.length} screen files...\n`);
for (const file of files) {
  if (file.includes('_backup')) continue;
  fixFile(file);
}

// Also fix components that might have containers
const componentsDir = path.join(SRC_DIR, 'components');
if (fs.existsSync(componentsDir)) {
  const compFiles = getAllTsxFiles(componentsDir);
  for (const file of compFiles) {
    if (file.includes('_backup')) continue;
    fixFile(file);
  }
}

console.log(`\nDone. Fixed ${totalFixed} more files.`);
