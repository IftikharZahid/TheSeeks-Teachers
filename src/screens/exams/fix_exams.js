const fs = require('fs');
const path = require('path');

const files = [
  'GenericExamsScreen.tsx',
  'Class9thExamsScreen.tsx',
  'Class10thExamsScreen.tsx',
  'Class1stYearExamsScreen.tsx',
  'Class2ndYearExamsScreen.tsx'
];

files.forEach(f => {
  const filePath = path.join(__dirname, f);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix the newId reference
  content = content.replace(
    /id: editingExam \? editingExam\.id : newId/g,
    `id: editingExam ? editingExam.id : (typeof newId !== 'undefined' ? newId : Date.now().toString())`
  );

  // Add import if missing
  if (!content.includes('saveResult')) {
    content = content.replace(
      /import\s*\{\s*useAppSelector,\s*useAppDispatch\s*\}\s*from\s*'(\.\.\/)*\.\.\/store\/hooks';/,
      `import { useAppSelector, useAppDispatch } from '../../store/hooks';\nimport { saveResult, deleteResult } from '../../store/slices/resultsSlice';`
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed', f);
});
