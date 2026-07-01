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

  // Fix compactInput
  content = content.replace(
    /compactInput: \{ borderWidth: 1, borderRadius: scale\(8\), paddingHorizontal: 0, height: scale\(40\), fontSize: scale\(13\), textAlign: 'center' \},/g,
    `compactInput: { borderWidth: 1, borderRadius: scale(8), padding: 0, height: scale(40), fontSize: scale(13), textAlign: 'center', textAlignVertical: 'center' },`
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed compactInput in ${file}`);
  }
});
