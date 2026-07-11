const fs = require('fs');
const files = [
  'Class10thExamsScreen.tsx',
  'Class1stYearExamsScreen.tsx',
  'Class2ndYearExamsScreen.tsx',
  'Class9thExamsScreen.tsx',
  'GenericExamsScreen.tsx'
];

files.forEach(f => {
  const filePath = 'src/screens/exams/' + f;
  let content = fs.readFileSync(filePath, 'utf8');

  // We want to replace the `else` block after `if (editingExam) { ... }` inside `try {`
  const regex = /\} else \{\s*const newId = Date\.now\(\)\.toString\(\);\s*await dispatch\(saveResult\(\{ examData: \{ \.\.\.examData, id: \(editingExam as any\)\?\.id \? \(editingExam as any\)\.id : \(Date\.now\(\)\.toString\(\)\) \} \}\)\)\.unwrap\(\);\s*Alert\.alert\('Success', 'Exam record added successfully'\);\s*\}/;

  const replacementBlock = `} else {
        const existingExam = exams.find((e: any) => 
          e.title === examData.title && 
          e.bookName === examData.bookName && 
          e.rollNo === examData.rollNo && 
          e.studentClass === examData.studentClass
        );

        if (existingExam && existingExam.id) {
          await dispatch(saveResult({ examData: { ...examData, id: existingExam.id } })).unwrap();
          Alert.alert('Success', 'Exam record replaced successfully');
        } else {
          const newId = Date.now().toString();
          await dispatch(saveResult({ examData: { ...examData, id: newId } })).unwrap();
          Alert.alert('Success', 'Exam record added successfully');
        }
      }`;

  if (regex.test(content)) {
    content = content.replace(regex, replacementBlock);
    fs.writeFileSync(filePath, content);
    console.log('Successfully updated ' + f);
  } else {
    console.log('Regex did not match in ' + f);
  }
});
