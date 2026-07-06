const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens', 'exams');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.tsx') && !f.includes('_backup'));

files.forEach(file => {
    const filePath = path.join(screensDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Fix duplicate logic in handleSaveRecord
    const handleSaveRegex = /const isDuplicate = exams\.some\(exam => \{\s+if \(editingExam && exam\.id === editingExam\.id\) return false;\s+return \(\s+exam\.title === title &&\s+exam\.category === category &&\s+exam\.rollNo === rollNo\s+\);\s+\}\);/g;
    
    const handleSaveReplacement = `const currentSubject = scopedEntryBooks.length > 0 ? scopedEntryBooks.map(b => b.name).join(', ') : (isTeacher && selectedTeacherSubject ? selectedTeacherSubject : (bookName || ''));
    const isDuplicate = exams.some(exam => {
      if (editingExam && exam.id === editingExam.id) return false;
      return (
        exam.title === title &&
        exam.category === category &&
        exam.rollNo === rollNo &&
        exam.bookName === currentSubject
      );
    });`;

    content = content.replace(handleSaveRegex, handleSaveReplacement);

    // Fix Duplicate Warning in UI
    const uiWarningRegex = /\{\/\* Duplicate Warning \*\/\}\s+\{title && rollNo && !editingExam && \(\(\) => \{\s+const duplicate = exams\.find\(e => e\.title === title && e\.rollNo === rollNo\);/g;
    
    const uiWarningReplacement = `{/* Duplicate Warning */}
              {title && rollNo && !editingExam && (() => {
                const scopedEntryBooksUI = isTeacher && typeof teacherSubjectsList !== 'undefined' && teacherSubjectsList.length > 0 ? entryBooks.filter(book => teacherSubjectsList.some((s) => s.toLowerCase() === book.name.toLowerCase())) : entryBooks;
                const currentSubject = scopedEntryBooksUI.length > 0 ? scopedEntryBooksUI.map(b => b.name).join(', ') : (isTeacher && selectedTeacherSubject ? selectedTeacherSubject : (bookName || ''));
                const duplicate = exams.find(e => e.title === title && e.category === category && e.rollNo === rollNo && e.bookName === currentSubject);`;

    content = content.replace(uiWarningRegex, uiWarningReplacement);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated duplicate logic in ${file}`);
});
