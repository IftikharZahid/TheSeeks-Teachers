const fs = require('fs');
const path = require('path');

const examsDir = path.join(__dirname, 'src', 'screens', 'exams');
const filesToFix = [
  'GenericExamsScreen.tsx',
  'Class9thExamsScreen.tsx',
  'Class10thExamsScreen.tsx',
  'Class1stYearExamsScreen.tsx',
  'Class2ndYearExamsScreen.tsx'
];

filesToFix.forEach(file => {
  const filePath = path.join(examsDir, file);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Fix main screen Status Bar
  content = content.replace(
    /<StatusBar backgroundColor=\{theme\.primary\} barStyle="light-content" translucent=\{false\} \/>/g,
    `<StatusBar backgroundColor="transparent" barStyle="light-content" translucent={true} />`
  );

  content = content.replace(
    /<View style=\{\[styles\.container, \{ backgroundColor: theme\.background \}\]\}>/g,
    `<View style={[styles.container, { backgroundColor: theme.background, paddingTop: StatusBar.currentHeight || 0 }]}><View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: StatusBar.currentHeight || 0, backgroundColor: theme.primary, zIndex: 999 }} />`
  );

  // KeyboardAvoidingView
  content = content.replace(
    /behavior="height"/g,
    `behavior={Platform.OS === 'ios' ? 'padding' : undefined}`
  );

  // Fix modal absolute view if it exists (from my previous patch that I might have committed)
  content = content.replace(
    /<View style=\{\{ position: 'absolute', top: 0, left: 0, right: 0, height: StatusBar\.currentHeight \|\| 0, backgroundColor: theme\.primary([^\}]*)\}\} \/>/g,
    `<View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: StatusBar.currentHeight || 0, backgroundColor: theme.card$1}} />`
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${file}`);
  }
});
