const fs = require('fs');
const files = [
  'Class10thExamsScreen.tsx',
  'Class1stYearExamsScreen.tsx',
  'Class2ndYearExamsScreen.tsx',
  'Class9thExamsScreen.tsx',
  'GenericExamsScreen.tsx'
];

const targetBlock = `      } else {
        const newId = Date.now().toString();
        await dispatch(saveResult({ examData: { ...examData, id: (editingExam as any)?.id ? (editingExam as any).id : (Date.now().toString()) } })).unwrap();
        Alert.alert('Success', 'Exam record added successfully');
      }`;

const replacementBlock = `      } else {
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

files.forEach(f => {
  const filePath = 'src/screens/exams/' + f;
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(targetBlock)) {
    content = content.replace(targetBlock, replacementBlock);
    fs.writeFileSync(filePath, content);
    console.log('Successfully updated ' + f);
  } else {
    console.log('Target block not found in ' + f);
  }
});
