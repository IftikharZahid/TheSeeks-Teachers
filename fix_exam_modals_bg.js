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
  content = content.replace(
    /<View style=\{\{ flex: 1, backgroundColor: theme\.card \}\}>\s*<SafeAreaView style=\{\{ flex: 1 \}\} edges=\{\['top', 'bottom'\]\}>/g,
    `<View style={{ flex: 1, backgroundColor: theme.primary }}>\n          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>`
  );
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed background for', file);
});
