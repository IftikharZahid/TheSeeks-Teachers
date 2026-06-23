const fs = require('fs');
const files = [
  'src/screens/exams/Class9thExamsScreen.tsx',
  'src/screens/exams/Class10thExamsScreen.tsx',
  'src/screens/exams/Class1stYearExamsScreen.tsx',
  'src/screens/exams/Class2ndYearExamsScreen.tsx',
  'src/screens/exams/GenericExamsScreen.tsx'
];

for (const file of files) {
  let c = fs.readFileSync(file, 'utf8');

  // Fix styles.compactInput padding
  c = c.replace(/compactInput:\s*\{([^}]*)paddingHorizontal:\s*scale\(\d+\)([^}]*)\}/g, 'compactInput: { $1paddingHorizontal: 0$2}');

  // Fix Teacher padding (scale(8) -> 0)
  c = c.replace(/paddingHorizontal:\s*scale\(\s*8\s*\),\s*fontSize:\s*scale\(\s*13\s*\),\s*fontWeight:\s*'700'/g, "paddingHorizontal: 0, fontSize: scale(13), fontWeight: '700'");
  c = c.replace(/paddingHorizontal:\s*scale\(\s*8\s*\),\s*fontSize:\s*scale\(\s*13\s*\),\s*fontWeight:\s*'800'/g, "paddingHorizontal: 0, fontSize: scale(13), fontWeight: '800'");

  // Fix Teacher regex
  c = c.replace(/updateTeacherSubjectBook\('totalMarks',\s*val\);/g, "updateTeacherSubjectBook('totalMarks', val.replace(/[^0-9]/g, ''));");
  c = c.replace(/updateTeacherSubjectBook\('obtainedMarks',\s*val\);/g, "updateTeacherSubjectBook('obtainedMarks', val.replace(/[^0-9]/g, ''));");

  // Fix Admin regex (existing entryBooks)
  c = c.replace(/updated\[index\]\s*=\s*\{\s*\.\.\.updated\[index\],\s*totalMarks:\s*val\s*\};/g, "updated[index] = { ...updated[index], totalMarks: val.replace(/[^0-9]/g, '') };");
  c = c.replace(/updated\[index\]\s*=\s*\{\s*\.\.\.updated\[index\],\s*obtainedMarks:\s*val\s*\};/g, "updated[index] = { ...updated[index], obtainedMarks: val.replace(/[^0-9]/g, '') };");

  // Fix Admin regex (new currentTotalMarks)
  c = c.replace(/onChangeText=\{setCurrentTotalMarks\}/g, "onChangeText={(val) => setCurrentTotalMarks(val.replace(/[^0-9]/g, ''))}");
  c = c.replace(/onChangeText=\{setCurrentObtainedMarks\}/g, "onChangeText={(val) => setCurrentObtainedMarks(val.replace(/[^0-9]/g, ''))}");

  fs.writeFileSync(file, c);
}
console.log('Fixed padding and input regex in all exam screens');
