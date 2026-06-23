const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\USER\\Desktop\\Mobile App Dev\\TheSeeks Projects\\TheSeeks-Teachers\\src\\screens\\exams';
const files = [
  'GenericExamsScreen.tsx',
  'Class9thExamsScreen.tsx',
  'Class10thExamsScreen.tsx',
  'Class1stYearExamsScreen.tsx',
  'Class2ndYearExamsScreen.tsx'
];

files.forEach(file => {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix 1: Error Parameter 's' implicitly has an 'any' type.
  content = content.replace(
    /teacherSubjectsList\.some\(s =>/g,
    `teacherSubjectsList.some((s: string) =>`
  );

  // Fix 2: Line 662
  content = content.replace(
    /bookName: scopedEntryBooks\.length > 0 \? scopedEntryBooks\.map\(b => b\.name\)\.join\(', '\) : \(isTeacher && teacherSubject \? teacherSubject : \(bookName \|\| ''\)\),/g,
    `bookName: scopedEntryBooks.length > 0 ? scopedEntryBooks.map(b => b.name).join(', ') : (isTeacher && selectedTeacherSubject ? selectedTeacherSubject : (bookName || '')),`
  );

  // Fix 3: Line 757-761
  content = content.replace(
    /if \(isTeacher && teacherSubject\) {\s*loadedBooks = loadedBooks\.filter\(b => normalizeSubjectName\(b\.name\) === normalizeSubjectName\(teacherSubject\)\);\s*const hasSubject = loadedBooks\.some\(b => normalizeSubjectName\(b\.name\) === normalizeSubjectName\(teacherSubject\)\);\s*if \(!hasSubject\) {\s*loadedBooks\.push\({ name: teacherSubject\.trim\(\), totalMarks: '', obtainedMarks: '' }\);/g,
    `if (isTeacher && teacherSubjectsList.length > 0) {
        loadedBooks = loadedBooks.filter(b => teacherSubjectsList.some((s: string) => normalizeSubjectName(s) === normalizeSubjectName(b.name)));
        const hasSubject = loadedBooks.some(b => normalizeSubjectName(b.name) === normalizeSubjectName(selectedTeacherSubject));
        if (!hasSubject && selectedTeacherSubject) {
          loadedBooks.push({ name: selectedTeacherSubject.trim(), totalMarks: '', obtainedMarks: '' });`
  );

  // Fix 4: Line 789-790
  content = content.replace(
    /setEntryBooks\(isTeacher && teacherSubject\s*\?\s*\[{ name: teacherSubject\.trim\(\), totalMarks: '', obtainedMarks: '' }\]/g,
    `setEntryBooks(isTeacher && selectedTeacherSubject
      ? [{ name: selectedTeacherSubject.trim(), totalMarks: '', obtainedMarks: '' }]`
  );

  // Fix 5: Line 812
  content = content.replace(
    /const authError = AUTHORIZATION\.canAddExamForSubject\(\s*currentBookName,\s*isTeacher,\s*teacherSubject\s*\);/g,
    `const authError = AUTHORIZATION.canAddExamForSubject(
        currentBookName,
        isTeacher,
        teacherSubjectsList
      );`
  );

  // Fix 6: Line 947-953
  content = content.replace(
    /const normalizedTeacherSubject = teacherSubject\.trim\(\)\.toLowerCase\(\);\s*const hasUnauthorizedSubject = uploadSubjects\.some\(subj => subj && subj !== normalizedTeacherSubject\);\s*if \(hasUnauthorizedSubject\) {\s*Alert\.alert\(\s*'Authorization Error',\s*`You can only upload exam records for "\${teacherSubject}" subject\. The file contains unauthorized subjects\.`\s*\);/g,
    `const hasUnauthorizedSubject = uploadSubjects.some(subj => subj && !teacherSubjectsList.some((s: string) => s.trim().toLowerCase().replace(/_/g, ' ') === subj.trim().toLowerCase().replace(/_/g, ' ')));

        if (hasUnauthorizedSubject) {
          Alert.alert(
            'Authorization Error',
            \`You can only upload exam records for your assigned subjects. The file contains unauthorized subjects.\`
          );`
  );

  // Fix 7: Line 1010
  content = content.replace(
    /if \(isTeacher && teacherSubject && subj\.replace\(\/_\/g, ' '\)\.trim\(\)\.toLowerCase\(\) !== teacherSubject\.trim\(\)\.toLowerCase\(\)\) {/g,
    `if (isTeacher && teacherSubjectsList.length > 0 && !teacherSubjectsList.some((s: string) => s.trim().toLowerCase().replace(/_/g, ' ') === subj.replace(/_/g, ' ').trim().toLowerCase())) {`
  );

  // Fix 8: Line 1062
  content = content.replace(
    /examDoc\.bookName = isTeacher && teacherSubject \? teacherSubject : \(item\.bookName \|\| ''\);/g,
    `examDoc.bookName = isTeacher && selectedTeacherSubject ? selectedTeacherSubject : (item.bookName || '');`
  );

  // Fix 9: Line 1891
  content = content.replace(
    /{isTeacher && teacherSubject \? \(/g,
    `{isTeacher && selectedTeacherSubject ? (`
  );

  // Fix 10: Line 1901
  content = content.replace(
    /<Text style=\{\[styles\.teacherSubjectName, \{ color: theme\.primary \}\]\} numberOfLines=\{1\}>\s*\{teacherSubject\}\s*<\/Text>/g,
    `<Text style={[styles.teacherSubjectName, { color: theme.primary }]} numberOfLines={1}>
                        {selectedTeacherSubject}
                      </Text>`
  );

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Successfully completed fix script for remaining teacherSubject usages.');
