const fs = require('fs');
const path = require('path');

const files = [
  'Class9thExamsScreen.tsx',
  'Class10thExamsScreen.tsx',
  'Class1stYearExamsScreen.tsx',
  'Class2ndYearExamsScreen.tsx',
  'GenericExamsScreen.tsx'
];

files.forEach(f => {
  const filePath = path.join(__dirname, f);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Remove duplicate check
  const duplicateCheckRegex = /const isDuplicate = exams\.some\([\s\S]*?Alert\.alert\('Duplicate Entry', 'An exam entry with these details already exists\.'\);\s*return;\s*\}/g;
  content = content.replace(duplicateCheckRegex, '');

  // 2. Change logic for testCount to subjectsInExam
  // Find the studentProgressList block
  content = content.replace(
    /const total = parseFloat\(e\.totalMarks \|\| '0'\) \|\| 0;\s*const obtained = parseFloat\(e\.obtainedMarks \|\| '0'\) \|\| 0;\s*const existing = map\.get\(key\);/g,
    `const total = parseFloat(e.totalMarks || '0') || 0;
      const obtained = parseFloat(e.obtainedMarks || '0') || 0;
      const subjectsInExam = (e.books && e.books.length > 0) ? e.books.length : (e.bookName && e.bookName.trim() !== '' ? e.bookName.split(',').length : 1);
      const existing = map.get(key);`
  );

  content = content.replace(
    /existing\.testCount \+= 1;/g,
    `existing.testCount += subjectsInExam;`
  );

  content = content.replace(
    /testCount: 1,/g,
    `testCount: subjectsInExam,`
  );

  // 3. Update 'TESTS' table header to 'SUBJECTS'
  content = content.replace(
    /<Text style=\{\[styles\.tableHeaderCell, \{ flex: 0\.6, textAlign: 'center', color: theme\.textSecondary, fontSize: scale\(8\) \}\]\}>TESTS<\/Text>/g,
    `<Text style={[styles.tableHeaderCell, { flex: 0.6, textAlign: 'center', color: theme.textSecondary, fontSize: scale(8) }]}>SUBJECTS</Text>`
  );

  // 4. Update 'Tests' label in summary widget to 'Subjects'
  content = content.replace(
    /<Text style=\{\[styles\.summaryLabel, \{ color: theme\.textSecondary \}\]\}>Tests<\/Text>/g,
    `<Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Subjects</Text>`
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', f);
  } else {
    console.log('No changes needed for', f);
  }
});
