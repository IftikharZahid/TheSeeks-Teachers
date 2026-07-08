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

  // Fix imports
  if (!content.includes('import { saveResult')) {
    content = content.replace(
      /import \{ useAppSelector/g,
      `import { saveResult, deleteResult } from '../../store/slices/resultsSlice';\nimport { useAppSelector`
    );
  }

  // Fix newId typescript error
  content = content.replace(
    /typeof newId !== 'undefined' \? newId : Date\.now\(\)\.toString\(\)/g,
    `Date.now().toString()`
  );

  // Also fix: Property 'id' does not exist on type 'never'
  // This is because of `editingExam ? editingExam.id : ...` and TS thinks `editingExam` might be `never` if it was not typed properly.
  // The original code was `doc(db, 'exams', newId)` which didn't use editingExam.id. Let's look closely at the replacements.
  /*
     await dispatch(saveResult({ examData: { ...examData, id: editingExam ? editingExam.id : (Date.now().toString()) } })).unwrap();
  */
  // Actually, wait, editingExam is defined as `const [editingExam, setEditingExam] = useState<ExamEntry | null>(null);`
  // But wait, the line numbers say:
  // src/screens/exams/Class10thExamsScreen.tsx(700,92): error TS2339: Property 'id' does not exist on type 'never'.
  content = content.replace(
    /editingExam \? editingExam\.id :/g,
    `(editingExam as any)?.id ? (editingExam as any).id :`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed', f);
});
