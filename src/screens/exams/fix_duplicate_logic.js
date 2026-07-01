const fs = require('fs');
const files = [
  'GenericExamsScreen.tsx',
  'Class9thExamsScreen.tsx',
  'Class10thExamsScreen.tsx',
  'Class1stYearExamsScreen.tsx',
  'Class2ndYearExamsScreen.tsx'
];

const duplicateLogicTarget = `    const isDuplicate = exams.some(exam => {
      if (editingExam && exam.id === editingExam.id) return false;
      return (
        exam.title === title &&
        exam.category === category &&
        exam.rollNo === rollNo
      );
    });`;

const duplicateLogicReplacement = `    const isDuplicate = exams.some(exam => {
      if (editingExam && exam.id === editingExam.id) return false;
      const matchesBase = exam.title === title && exam.category === category && exam.rollNo === rollNo;
      if (matchesBase) {
        const newSubjects = (scopedEntryBooks.length > 0
          ? scopedEntryBooks.map(b => b.name)
          : [isTeacher && selectedTeacherSubject ? selectedTeacherSubject : (bookName || '')])
          .filter(Boolean)
          .map(s => s.toLowerCase().trim());
          
        let existingSubjects = [];
        if (exam.books && exam.books.length > 0) {
          existingSubjects = exam.books.map(b => b.name);
        } else if (exam.bookName) {
          existingSubjects = exam.bookName.split(',').map(s => s.trim());
        }
        existingSubjects = existingSubjects.filter(Boolean).map(s => s.toLowerCase().trim());
        
        return newSubjects.some(sub => existingSubjects.includes(sub));
      }
      return false;
    });`;

const warningLogicTarget = `                const duplicate = exams.find(e => e.title === title && e.rollNo === rollNo);`;

const warningLogicReplacement = `                const duplicate = exams.find(e => {
                  const matchesBase = e.title === title && e.category === category && e.rollNo === rollNo;
                  if (matchesBase) {
                    const scopedEntryBooks = isTeacher && teacherSubjectsList.length > 0
                      ? entryBooks.filter(book => teacherSubjectsList.some(s => s.toLowerCase().trim() === book.name.toLowerCase().trim()))
                      : entryBooks;
                    const newSubjects = (scopedEntryBooks.length > 0
                      ? scopedEntryBooks.map(b => b.name)
                      : [isTeacher && selectedTeacherSubject ? selectedTeacherSubject : (bookName || '')])
                      .filter(Boolean)
                      .map(s => s.toLowerCase().trim());
                      
                    let existingSubjects = [];
                    if (e.books && e.books.length > 0) {
                      existingSubjects = e.books.map(b => b.name);
                    } else if (e.bookName) {
                      existingSubjects = e.bookName.split(',').map(s => s.trim());
                    }
                    existingSubjects = existingSubjects.filter(Boolean).map(s => s.toLowerCase().trim());
                    
                    return newSubjects.some(sub => existingSubjects.includes(sub));
                  }
                  return false;
                });`;

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    if (content.includes(duplicateLogicTarget)) {
      content = content.replace(duplicateLogicTarget, duplicateLogicReplacement);
      console.log('Fixed handleSaveExam logic in', file);
    } else {
      console.log('Target handleSaveExam logic NOT FOUND in', file);
    }
    
    if (content.includes(warningLogicTarget)) {
      content = content.replace(warningLogicTarget, warningLogicReplacement);
      console.log('Fixed inline duplicate warning in', file);
    } else {
      console.log('Target inline duplicate warning NOT FOUND in', file);
    }
    
    fs.writeFileSync(file, content);
  }
}
