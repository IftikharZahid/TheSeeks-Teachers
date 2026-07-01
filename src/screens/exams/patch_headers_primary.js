const fs = require('fs');
const path = require('path');

const files = [
  'GenericExamsScreen.tsx',
  'Class9thExamsScreen.tsx',
  'Class10thExamsScreen.tsx',
  'Class1stYearExamsScreen.tsx',
  'Class2ndYearExamsScreen.tsx'
];

files.forEach(file => {
  const filePath = path.join('c:/Users/USER/Desktop/Mobile App Dev/TheSeeks Projects/TheSeeks-Teachers/src/screens/exams', file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace transparent status bar back to solid
  const regex = /<View style=\{\[styles\.container, \{ backgroundColor: theme\.background(?:, paddingTop: 0)? \}\]\}>\s*<StatusBar backgroundColor="transparent" barStyle="light-content" translucent=\{true\} \/>\s*\{\/\* ── Header ── \*\/\}\s*<View style=\{\[styles\.header, \{ backgroundColor: theme\.primary, borderBottomColor: 'transparent'(?:, paddingTop: \(StatusBar\.currentHeight \|\| 0\))? \}\]\}>/g;

  content = content.replace(regex, `<View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar backgroundColor={theme.primary} barStyle="light-content" translucent={false} />
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: theme.primary, borderBottomColor: 'transparent' }]}>`);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});
