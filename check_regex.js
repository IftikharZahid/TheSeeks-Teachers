const fs = require('fs');

const content = fs.readFileSync('src/screens/exams/GenericExamsScreen.tsx', 'utf8');

const testNoRegex = /\{\/\* ── Test No\. picker ── \*\/\}[\s\S]*?onClose=\{\(\) => setShowTitleDropdown\(false\)\}\s*\/>\s*<\/View>\s*\)\}\s*<\/View>\s*<\/View>/;
const testMatch = content.match(testNoRegex);

const subjectRegex = /\{\s*isTeacher\s*&&\s*\(\s*<View style=\{\[styles\.row, \{ marginTop: scale\(10\), zIndex: 1400 \}\]\}>[\s\S]*?<Text style=\{\[styles\.label, \{ color: theme\.text \}\]\}>Subject<\/Text>[\s\S]*?onClose=\{\(\) => setShowTeacherSubjectDropdown\(false\)\}\s*\/>\s*\)\}\s*<\/View>\s*<\/View>\s*<\/View>\s*\)\}/;
const subjMatch = content.match(subjectRegex);

console.log("Test No match:", !!testMatch);
console.log("Subject match:", !!subjMatch);
