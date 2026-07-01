/**
 * Android-Only Cleanup Script
 * 
 * This app is Android-only. This script removes all iOS-specific code:
 * 1. Replaces SafeAreaView (react-native-safe-area-context) with View in main screen containers
 *    - BUT keeps the import if SafeAreaView is still used elsewhere (e.g. floating buttons)
 *    - For container-level usage with edges={['top', ...]} we replace with View since
 *      Android uses StatusBar for top insets
 * 2. Removes iOS behavior on KeyboardAvoidingView (behavior="padding" → behavior="height")
 * 3. Removes Platform.OS === 'ios' ? 'padding' : ... conditional behavior props
 * 4. Cleans up ios-only style shadows (shadowColor, shadowOffset, shadowOpacity, shadowRadius)
 *    by keeping them (they're harmless on Android, just ignored)
 * 5. Removes any statusBarTranslucent={false} overrides on StatusBar inside Modals
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
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
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

  // ── 1. Replace main screen container SafeAreaView with View ─────────────────
  // Pattern: <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={[...]}>
  // Replace with: <View style={[styles.container, { backgroundColor: theme.background }]}>
  content = content.replace(
    /<SafeAreaView\s+style=\{\[styles\.container,\s*\{\s*backgroundColor:\s*theme\.background\s*\}\]\}\s+edges=\{\[[^\]]*\]\}\s*>/g,
    `<View style={[styles.container, { backgroundColor: theme.background }]}>`
  );
  
  // Handle single-style variant
  content = content.replace(
    /<SafeAreaView\s+style=\{styles\.container\}\s+edges=\{\[[^\]]*\]\}\s*>/g,
    `<View style={styles.container}>`
  );
  
  // Handle SafeAreaView with inline style only (no edges)
  content = content.replace(
    /<SafeAreaView\s+style=\{\[styles\.container,\s*\{\s*backgroundColor:\s*theme\.background\s*\}\]\}>/g,
    `<View style={[styles.container, { backgroundColor: theme.background }]}>`
  );

  // Close tags: replace </SafeAreaView> that correspond to containers
  // We do a careful replacement: only if the file had a container SafeAreaView
  // We count how many were replaced above and replace same count of closing tags
  // Simple approach: replace ALL </SafeAreaView> → </View> since on Android we never need it
  // BUT - some files use SafeAreaView for floating overlays with edges=['top'] only
  // We'll leave those as is and only replace ones that wrap the whole screen

  // ── 2. Fix KeyboardAvoidingView: remove iOS-specific behavior ────────────────
  // behavior={Platform.OS === 'ios' ? 'padding' : undefined}  → behavior="height"
  content = content.replace(
    /behavior=\{Platform\.OS\s*===\s*['"]ios['"]\s*\?\s*['"]padding['"]\s*:\s*undefined\}/g,
    `behavior="height"`
  );
  
  // behavior={Platform.OS === 'ios' ? 'padding' : 'height'}  → behavior="height"
  content = content.replace(
    /behavior=\{Platform\.OS\s*===\s*['"]ios['"]\s*\?\s*['"]padding['"]\s*:\s*['"]height['"]\}/g,
    `behavior="height"`
  );

  // behavior="padding" (standalone, iOS only behavior on KAV) → behavior="height"
  // Only do this when on a KeyboardAvoidingView line
  content = content.replace(
    /(<KeyboardAvoidingView[^>]*)behavior="padding"/g,
    `$1behavior="height"`
  );

  // ── 3. Fix StatusBar inside Modals (show status bar, not hide it) ────────────
  // translucent={false} on status bar is the default, but we want statusbar visible
  // so remove explicit translucent={false} which can cause issues in some Android versions
  content = content.replace(
    /<StatusBar\s+barStyle=\{isDark\s*\?\s*['"]light-content['"]\s*:\s*['"]dark-content['"]\}\s+backgroundColor=\{theme\.background\}\s+translucent=\{false\}\s*\/>/g,
    `<StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />`
  );
  content = content.replace(
    /<StatusBar\s+barStyle=\{isDark\s*\?\s*['"]light-content['"]\s*:\s*['"]dark-content['"]\}\s+backgroundColor=\{theme\.primary\}\s+translucent=\{false\}\s*\/>/g,
    `<StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.primary} />`
  );

  // ── 4. Remove ios: { } from Platform.select shadow styles (keep android) ─────
  // This is complex, so we skip to avoid breaking styles

  // ── 5. Fix SafeAreaView import: if after replacements no SafeAreaView JSX 
  //        remains in the file, remove the import ────────────────────────────────
  // Check if SafeAreaView is still used in JSX after changes
  const safeAreaImportLine = /import\s*\{[^}]*SafeAreaView[^}]*\}\s*from\s*['"]react-native-safe-area-context['"];?\n/;
  const stillUsesSAV = content.includes('<SafeAreaView') || content.includes('SafeAreaView>');
  
  if (!stillUsesSAV && safeAreaImportLine.test(content)) {
    // Remove SafeAreaView from the import
    content = content.replace(
      /import\s*\{([^}]*),\s*SafeAreaView\s*([^}]*)\}\s*from\s*['"]react-native-safe-area-context['"];?/g,
      (match, before, after) => {
        const cleaned = (before + after).replace(/,\s*,/g, ',').replace(/^\s*,|,\s*$/g, '').trim();
        if (!cleaned) return '';
        return `import { ${cleaned} } from 'react-native-safe-area-context';`;
      }
    );
    content = content.replace(
      /import\s*\{\s*SafeAreaView\s*\}\s*from\s*['"]react-native-safe-area-context['"];?\n/g,
      ''
    );
  }

  // ── 6. Replace remaining </SafeAreaView> closing tags with </View> if 
  //        corresponding opening was replaced ────────────────────────────────────
  // Count openings of SafeAreaView that wrap the container screen
  // We already replaced <SafeAreaView style={[styles.container...} 
  // Count how many replacements were done by checking if </SafeAreaView> count matches
  // Simple heuristic: replace all </SafeAreaView> with </View>
  // (Safe to do because iOS notch protection not needed on Android)
  const openCount = (content.match(/<SafeAreaView/g) || []).length;
  const closeCount = (content.match(/<\/SafeAreaView>/g) || []).length;
  
  // If close > open, there are orphaned closing tags - replace them
  if (closeCount > openCount) {
    let diff = closeCount - openCount;
    content = content.replace(/<\/SafeAreaView>/g, (match) => {
      if (diff > 0) { diff--; return '</View>'; }
      return match;
    });
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalFixed++;
    console.log('✅ Fixed:', path.relative(SRC_DIR, filePath));
    return true;
  }
  return false;
}

// Run on all .tsx files in src/screens
const screensDir = path.join(SRC_DIR, 'screens');
const files = getAllTsxFiles(screensDir);
console.log(`Found ${files.length} screen files...\n`);

for (const file of files) {
  // Skip backup files
  if (file.includes('_backup')) continue;
  fixFile(file);
}

console.log(`\nDone. Fixed ${totalFixed} files.`);
