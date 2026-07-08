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
  let original = content;

  // Replace import to include saveResult, deleteResult
  if (!content.includes('saveResult') && content.includes('fetchResults')) {
    content = content.replace(
      /import\s*\{\s*fetchResults\s*\}\s*from\s*'(\.\.\/)*\.\.\/store\/slices\/resultsSlice';/,
      `import { fetchResults, saveResult, deleteResult } from '../../store/slices/resultsSlice';`
    );
  }

  // Refactor _handleSaveExamCore
  // Find where it does setDoc and replace with dispatch(saveResult({ examData }))
  /*
    await setDoc(doc(db, 'exams', editingExam.id), examData, { merge: true });
    // or
    await setDoc(doc(db, 'exams', newId), examData);
  */
  
  content = content.replace(
    /await setDoc\(doc\(db, 'exams', [^)]+\), examData(?:, \{ merge: true \})?\);/g,
    `await dispatch(saveResult({ examData: { ...examData, id: editingExam ? editingExam.id : newId } })).unwrap();`
  );

  // For GenericExamsScreen.tsx specifically, it uses docId:
  /*
    await setDoc(doc(db, 'exams', docId), examDoc);
  */
  content = content.replace(
    /await setDoc\(doc\(db, 'exams', docId\), examDoc\);/g,
    `await dispatch(saveResult({ examData: { ...examDoc, id: docId } })).unwrap();`
  );

  // For deleting:
  /*
    await deleteDoc(doc(db, 'exams', id));
  */
  content = content.replace(
    /await deleteDoc\(doc\(db, 'exams', id\)\);/g,
    `await dispatch(deleteResult({ id })).unwrap();`
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Refactored Firebase calls in', f);
  }
});
