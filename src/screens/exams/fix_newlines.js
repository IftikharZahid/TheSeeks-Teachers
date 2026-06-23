const fs = require('fs');
const path = require('path');
const files = ['Class9thExamsScreen.tsx', 'Class10thExamsScreen.tsx', 'Class1stYearExamsScreen.tsx', 'Class2ndYearExamsScreen.tsx'];
files.forEach(file => {
  const filePath = path.join('c:/Users/USER/Desktop/Mobile App Dev/TheSeeks Projects/TheSeeks-Teachers/src/screens/exams', file);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/AUTHORIZATION\.canAddExamForSubject\(\\n\s*currentBookName,\\n\s*isTeacher,\\n\s*teacherSubjectsList\\n\s*\);/g, 
`AUTHORIZATION.canAddExamForSubject(
        currentBookName,
        isTeacher,
        teacherSubjectsList
      );`);
  fs.writeFileSync(filePath, content);
});
console.log('Fixed literal newlines');
