const fs = require('fs');
const path = require('path');
const files = ['Class9thExamsScreen.tsx', 'Class10thExamsScreen.tsx', 'Class1stYearExamsScreen.tsx', 'Class2ndYearExamsScreen.tsx'];
files.forEach(file => {
  const filePath = path.join('c:/Users/USER/Desktop/Mobile App Dev/TheSeeks Projects/TheSeeks-Teachers/src/screens/exams', file);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/AUTHORIZATION\.canAddExamForSubject\(\s*currentBookName,\s*isTeacher,\s*selectedTeacherSubject\s*\)/g, 
    `AUTHORIZATION.canAddExamForSubject(
        currentBookName,
        isTeacher,
        teacherSubjectsList
      )`);
  // And just in case it already has literal \n from the previous command
  content = content.replace(/AUTHORIZATION\.canAddExamForSubject\(n\s*currentBookName,n\s*isTeacher,n\s*teacherSubjectsListn\s*\)/g, 
    `AUTHORIZATION.canAddExamForSubject(
        currentBookName,
        isTeacher,
        teacherSubjectsList
      )`);
  fs.writeFileSync(filePath, content);
});
console.log('Fixed selectedTeacherSubject');
