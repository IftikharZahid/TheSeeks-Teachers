/**
 * Android Status Bar Padding Fix
 * 
 * Problem: SafeAreaView was removed from all screens. On Android, the main
 * container View now has no top padding, so headers go behind the status bar.
 * 
 * Solution: Add paddingTop: StatusBar.currentHeight to each screen's container style,
 * AND make sure StatusBar is imported and set to translucent={false}.
 * 
 * Approach:
 * 1. Find screens where the root return() view uses styles.container
 * 2. In the StyleSheet, add paddingTop: StatusBar.currentHeight || 0 to the container style
 * 3. Ensure StatusBar is imported from react-native in every screen file
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

  // ── Step 1: Ensure StatusBar is imported from react-native ──────────────────
  // Check if file uses react-native import
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

  // ── Step 2: Add paddingTop to container StyleSheet entry ─────────────────────
  // Pattern: look for `container: {` in StyleSheet.create and add paddingTop if missing
  // We use a regex that finds the container: { ... } block
  
  // First check if container already has paddingTop from StatusBar
  if (content.includes('StatusBar.currentHeight')) {
    // already fixed, skip
    if (content !== original) {
      fs.writeFileSync(filePath, content);
      totalFixed++;
      console.log('✅ Partial fix (added StatusBar import):', path.relative(SRC_DIR, filePath));
    }
    return;
  }

  // Add paddingTop: StatusBar.currentHeight || 0 to container style in StyleSheet
  // Pattern: container: {\n    flex: 1,
  content = content.replace(
    /(\s+container:\s*\{\s*\n\s+flex:\s*1,)/g,
    `$1\n    paddingTop: StatusBar.currentHeight || 0,`
  );

  // Some containers use flex: 1 without newline
  content = content.replace(
    /(\s+container:\s*\{[^}]*flex:\s*1(?!.*paddingTop)[^}]*)\n(\s+\w)/g,
    (match, before, after) => {
      if (before.includes('paddingTop')) return match;
      return `${before}\n    paddingTop: StatusBar.currentHeight || 0,\n${after}`;
    }
  );

  // ── Step 3: Also add StatusBar component in return() if missing ──────────────
  // Find the first <View style={[styles.container in return and add StatusBar after it
  // if no StatusBar JSX exists in the file
  const hasStatusBarJSX = /<StatusBar\s/.test(content);
  if (!hasStatusBarJSX) {
    // Add StatusBar right after the opening container view
    content = content.replace(
      /(<View\s+style=\{\[styles\.container[^>]*\}>)/,
      `$1\n      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={false} />`
    );
    // Also try single style version
    content = content.replace(
      /(<View\s+style=\{styles\.container\}>)/,
      `$1\n      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={false} />`
    );
  }

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

console.log(`\nDone. Fixed ${totalFixed} files.`);
