const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens', 'exams');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.tsx') && !f.includes('_backup'));

files.forEach(file => {
    const filePath = path.join(screensDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Normalize newlines to match safely
    content = content.replace(/\r\n/g, '\n');

    const handleSaveSearch = `const isDuplicate = exams.some(exam => {
      if (editingExam && exam.id === editingExam.id) return false;
      return (
        exam.title === title &&
        exam.category === category &&
        exam.rollNo === rollNo
      );
    });`;
    
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

    if (content.includes(handleSaveSearch)) {
        content = content.replace(handleSaveSearch, handleSaveReplacement);
        console.log(`Replaced handleSave duplicate logic in ${file}`);
    } else {
        console.log(`Failed to find handleSave duplicate logic in ${file}`);
    }

    const uiWarningSearch = `{/* Duplicate Warning */}
              {title && rollNo && !editingExam && (() => {
                const duplicate = exams.find(e => e.title === title && e.rollNo === rollNo);`;
                
    // Wait, in my previous attempt I saw the duplicate checking logic in the UI also doesn't check for category. I will fix that too.
    const uiWarningReplacement = `{/* Duplicate Warning */}
              {title && rollNo && !editingExam && (() => {
                const scopedEntryBooksUI = isTeacher && typeof teacherSubjectsList !== 'undefined' && teacherSubjectsList.length > 0 ? entryBooks.filter(book => teacherSubjectsList.some((s) => s.toLowerCase() === book.name.toLowerCase())) : entryBooks;
                const currentSubject = scopedEntryBooksUI.length > 0 ? scopedEntryBooksUI.map(b => b.name).join(', ') : (isTeacher && selectedTeacherSubject ? selectedTeacherSubject : (bookName || ''));
                const duplicate = exams.find(e => e.title === title && e.category === category && e.rollNo === rollNo && e.bookName === currentSubject);`;

    if (content.includes(uiWarningSearch)) {
        content = content.replace(uiWarningSearch, uiWarningReplacement);
        console.log(`Replaced UI warning logic in ${file}`);
    } else {
        console.log(`Failed to find UI warning logic in ${file}`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
});
