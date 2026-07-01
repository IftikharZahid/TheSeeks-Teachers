const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Change container padding and background
  content = content.replace(
    /<View style=\{\[styles\.container, \{ backgroundColor: theme\.background(?:, paddingTop: 0)? \}\]\}>/g,
    `<View style={[styles.container, { backgroundColor: theme.background, paddingTop: StatusBar.currentHeight || 0 }]}>`
  );
  content = content.replace(
    /<View style=\{\[styles\.container, \{ backgroundColor: isDark \? theme\.background : '[^']+' \}\]\}>/g,
    `<View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F3F4F6', paddingTop: StatusBar.currentHeight || 0 }]}>`
  );

  // Change StatusBar
  content = content.replace(
    /<StatusBar barStyle=\{isDark \? ['"]light-content['"] : ['"]dark-content['"]\} backgroundColor=\{[^}]+\}(?: translucent=\{false\})? \/>/g,
    `<StatusBar barStyle="light-content" backgroundColor={theme.primary} translucent={false} />`
  );
  content = content.replace(
    /<StatusBar barStyle="light-content" backgroundColor="transparent" translucent=\{false\} \/>/g,
    `<StatusBar barStyle="light-content" backgroundColor={theme.primary} translucent={false} />`
  );
  content = content.replace(
    /<StatusBar backgroundColor="transparent" barStyle="light-content" translucent=\{false\} \/>/g,
    `<StatusBar barStyle="light-content" backgroundColor={theme.primary} translucent={false} />`
  );
  content = content.replace(
    /<StatusBar backgroundColor=\{theme\.primary\} barStyle="light-content" translucent=\{false\} \/>/g, // if it's already primary, just normalize
    `<StatusBar barStyle="light-content" backgroundColor={theme.primary} translucent={false} />`
  );

  // Change header view
  content = content.replace(
    /<View style=\{\[styles\.header, \{ backgroundColor: isDark \? theme\.card : '[^']+'(?:, borderBottomColor: theme\.border)?(?:, paddingHorizontal: scale\(\d+\))?(?:, paddingVertical: scale\(\d+\))? \}\]\}>/g,
    `<View style={[styles.header, { backgroundColor: theme.primary, borderBottomColor: 'transparent' }]}>`
  );
  content = content.replace(
    /<View style=\{\[styles\.header, \{ backgroundColor: theme\.card, borderBottomColor: theme\.border(?:, borderBottomWidth: 1)? \}\]\}>/g,
    `<View style={[styles.header, { backgroundColor: theme.primary, borderBottomColor: 'transparent' }]}>`
  );
  content = content.replace(
    /<View style=\{\[styles\.header, \{ borderBottomColor: theme\.border(?:, borderBottomWidth: 1)? \}\]\}>/g,
    `<View style={[styles.header, { backgroundColor: theme.primary, borderBottomColor: 'transparent' }]}>`
  );
  // Custom header inline
  content = content.replace(
    /<View style=\{\{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale\(\d+\), paddingVertical: scale\(\d+\), backgroundColor: isDark \? theme\.card : '#fff', borderBottomWidth: 1, borderBottomColor: theme\.border \}\}>/g,
    `<View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(16), paddingVertical: scale(12), backgroundColor: theme.primary }}>`
  );

  // Change title text
  content = content.replace(
    /<Text style=\{\[styles\.headerTitle, \{ color: theme\.text \}\]\}(.*?)>/g,
    `<Text style={[styles.headerTitle, { color: '#fff' }]}$1>`
  );
  content = content.replace(
    /<Text style=\{\{ fontSize: scale\(\d+\), fontWeight: '800', color: theme\.text(?:, flex: 1)?(?:, textAlign: 'center')? \}\}>/g,
    `<Text style={{ fontSize: scale(17), fontWeight: '800', color: '#fff', flex: 1 }}>` // simplistic but we'll see
  );

  // Subtitle
  content = content.replace(
    /<Text style=\{\[styles\.headerSub, \{ color: theme\.textSecondary \}\]\}>/g,
    `<Text style={[styles.headerSub, { color: 'rgba(255,255,255,0.8)' }]}>`
  );
  content = content.replace(
    /<Text style=\{\{ fontSize: scale\(12\), color: theme\.textSecondary(?:, textAlign: 'center')? \}\}>/g,
    `<Text style={{ fontSize: scale(12), color: 'rgba(255,255,255,0.8)' }}>`
  );

  // Back button and icons
  // 1. backButton / headerButton / backBtn
  content = content.replace(
    /<TouchableOpacity([^>]*?)style=\{styles\.(?:headerButton|backButton|backBtn|headerIconButton)\}([^>]*?)>/g,
    `<TouchableOpacity$1style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 4 }]} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}$2>`
  );
  content = content.replace(
    /<Ionicons name="(?:arrow-back|chevron-back)" size=\{scale\(\d+\)\} color=\{theme\.text\} \/>/g,
    `<Ionicons name="arrow-back" size={scale(22)} color="#fff" />`
  );
  
  // Custom round button like in TeachersScreen
  content = content.replace(
    /<TouchableOpacity([^>]*?)style=\{\[styles\.actionButton, \{ backgroundColor: isDark \? '#334155' : '#f1f5f9' \}\]\}([^>]*?)>/g,
    `<TouchableOpacity$1style={[styles.actionButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}$2>`
  );
  // Other header icons color fix
  content = content.replace(
    /<Ionicons name="([a-zA-Z0-9\-]+)" size=\{scale\(\d+\)\} color=\{theme\.text\} \/>/g,
    `<Ionicons name="$1" size={scale(22)} color="#fff" />`
  );
  
  // Specific fix for add button in assignments
  content = content.replace(
    /<Ionicons name="add-circle" size=\{scale\(24\)\} color=\{theme\.primary\} \/>/g,
    `<Ionicons name="add-circle" size={scale(24)} color="#fff" />`
  );

  // If we changed something, ensure StatusBar is imported
  if (content !== originalContent) {
    if (content.includes('<StatusBar') && !content.includes('StatusBar,')) {
      if (content.includes(`import { View`)) {
         content = content.replace(/import \{([^}]+)\} from 'react-native';/, "import { $1, StatusBar } from 'react-native';");
      }
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Patched: ' + path.basename(filePath));
  }
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (file.endsWith('.tsx') && !file.includes('Class10thExamsScreen.tsx') && !file.includes('Class9thExamsScreen.tsx') && !file.includes('Class1stYearExamsScreen.tsx') && !file.includes('Class2ndYearExamsScreen.tsx') && !file.includes('GenericExamsScreen.tsx') && !file.includes('TeacherMessagesScreen.tsx')) {
       // skip exams screens because they were done, also messages screen
       processFile(fullPath);
    }
  }
}

traverse(screensDir);
