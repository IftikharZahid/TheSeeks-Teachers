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

  // Teacher Total marks padding
  content = content.replace(
    /borderRadius:\s*scale\(7\),\s*paddingHorizontal:\s*scale\(8\),\s*fontSize:\s*scale\(13\)/g,
    `borderRadius: scale(7), paddingHorizontal: 0, fontSize: scale(13)`
  );

  // Admin compactInput padding (line 2529)
  content = content.replace(
    /compactInput:\s*\{\s*borderWidth:\s*1,\s*borderRadius:\s*scale\(8\),\s*paddingHorizontal:\s*scale\(12\),\s*height:\s*scale\(40\),\s*fontSize:\s*scale\(13\)\s*\}/g,
    `compactInput: { borderWidth: 1, borderRadius: scale(8), paddingHorizontal: 0, height: scale(40), fontSize: scale(13), textAlign: 'center' }`
  );

  // Teacher Total marks typing validation
  content = content.replace(
    /updateTeacherSubjectBook\('totalMarks',\s*val\);/g,
    `updateTeacherSubjectBook('totalMarks', val.replace(/[^0-9.]/g, ''));`
  );

  // Teacher Obtained marks typing validation
  content = content.replace(
    /updateTeacherSubjectBook\('obtainedMarks',\s*val\);/g,
    `updateTeacherSubjectBook('obtainedMarks', val.replace(/[^0-9.]/g, ''));`
  );

  // Admin loop Total marks typing validation
  content = content.replace(
    /updated\[index\] = \{ \.\.\.updated\[index\], totalMarks: val \};/g,
    `updated[index] = { ...updated[index], totalMarks: val.replace(/[^0-9.]/g, '') };`
  );

  // Admin loop Obtained marks typing validation
  content = content.replace(
    /updated\[index\] = \{ \.\.\.updated\[index\], obtainedMarks: val \};/g,
    `updated[index] = { ...updated[index], obtainedMarks: val.replace(/[^0-9.]/g, '') };`
  );

  // Admin New Book Total marks typing validation
  content = content.replace(
    /onChangeText=\{setCurrentTotalMarks\}/g,
    `onChangeText={(val) => setCurrentTotalMarks(val.replace(/[^0-9.]/g, ''))}`
  );

  // Admin New Book Obtained marks typing validation
  content = content.replace(
    /onChangeText=\{setCurrentObtainedMarks\}/g,
    `onChangeText={(val) => setCurrentObtainedMarks(val.replace(/[^0-9.]/g, ''))}`
  );

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Successfully completed padding and number validation fixes.');
