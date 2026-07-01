/**
 * Android-Only Cleanup - Pass 2
 * Fix remaining SafeAreaView containers with inline styles
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
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      results.push(full);
    }
  }
  return results;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Replace full-screen container SafeAreaViews with inline styles
  // Pattern: <SafeAreaView style={{ flex: 1 }} edges={[...]}>  → <View style={{ flex: 1 }}>
  content = content.replace(
    /<SafeAreaView\s+style=\{\{\s*flex:\s*1\s*\}\}\s+edges=\{\[[^\]]*\]\}\s*>/g,
    `<View style={{ flex: 1 }}>`
  );

  // Pattern: <SafeAreaView style={[styles.container, { backgroundColor: ... }]} edges={[...]}>
  content = content.replace(
    /<SafeAreaView\s+style=\{\[styles\.container,\s*\{\s*backgroundColor:\s*[^}]+\}\]\}\s+edges=\{\[[^\]]*\]\}\s*>/g,
    (match) => {
      // Extract the backgroundColor part
      const bgMatch = match.match(/backgroundColor:\s*([^}]+)\}/);
      const bg = bgMatch ? bgMatch[1].trim() : 'theme.background';
      return `<View style={[styles.container, { backgroundColor: ${bg} }]}>`;
    }
  );

  // Pattern: <SafeAreaView style={styles.safeArea} edges={[...]}>  → <View style={styles.container}>
  content = content.replace(
    /<SafeAreaView\s+style=\{styles\.safeArea\}\s+edges=\{\[[^\]]*\]\}\s*>/g,
    `<View style={styles.safeArea}>`
  );

  // Pattern: <SafeAreaView style={styles.container} edges={[...]}>
  content = content.replace(
    /<SafeAreaView\s+style=\{styles\.container\}\s+edges=\{\[[^\]]*\]\}\s*>/g,
    `<View style={styles.container}>`
  );

  // Pattern: <SafeAreaView style={{ flex: 1, backgroundColor: ... }} edges={[...]}>
  content = content.replace(
    /<SafeAreaView\s+style=\{\{[^}]+\}\}\s+edges=\{\[[^\]]*\]\}\s*>/g,
    (match) => {
      const styleMatch = match.match(/style=\{(\{[^}]+\})\}/);
      const style = styleMatch ? styleMatch[1] : '{ flex: 1 }';
      return `<View style={${style}}>`;
    }
  );

  // Pattern: <SafeAreaView edges={['top', ...]} style={...}> (reversed attribute order)
  content = content.replace(
    /<SafeAreaView\s+edges=\{\[[^\]]*\]\}\s+style=\{([^}]+)\}\s*>/g,
    (match, style) => `<View style={${style}}>`
  );

  // Now fix remaining orphaned </SafeAreaView> closing tags
  const openCount = (content.match(/<SafeAreaView/g) || []).length;
  const closeCount = (content.match(/<\/SafeAreaView>/g) || []).length;
  if (closeCount > openCount) {
    let diff = closeCount - openCount;
    content = content.replace(/<\/SafeAreaView>/g, (match) => {
      if (diff > 0) { diff--; return '</View>'; }
      return match;
    });
  }

  // Fix KeyboardAvoidingView remaining iOS behaviors
  content = content.replace(
    /(<KeyboardAvoidingView[^>]*)behavior="padding"/g,
    `$1behavior="height"`
  );

  // Clean unused SafeAreaView imports if no JSX left
  const stillUsesSAV = content.includes('<SafeAreaView') || content.includes('SafeAreaView>');
  if (!stillUsesSAV) {
    // Remove SafeAreaView from named import
    content = content.replace(
      /import\s*\{([^}]*),\s*SafeAreaView\s*([^}]*)\}\s*from\s*['"]react-native-safe-area-context['"];?/g,
      (match, before, after) => {
        const cleaned = (before.trim() + ' ' + after.trim()).replace(/,\s*,/g, ',').trim().replace(/^,|,$/g, '').trim();
        if (!cleaned) return '';
        return `import { ${cleaned} } from 'react-native-safe-area-context';`;
      }
    );
    content = content.replace(
      /import\s*\{\s*SafeAreaView,?\s*\}\s*from\s*['"]react-native-safe-area-context['"];?\n/g, ''
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

console.log(`\nDone. Fixed ${totalFixed} more files.`);
