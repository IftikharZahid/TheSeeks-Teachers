const fs = require('fs');

const file = 'src/screens/exams/Class10thExamsScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

const testNoRegex = /\{\/\* ── Test No\. picker ── \*\/\}[\s\S]*?<View style=\{\[styles\.col, \{ flex: 0\.35, zIndex: 2000 \}\]\}>([\s\S]*?onClose=\{\(\) => setShowTitleDropdown\(false\)\}\s*\/>\s*<\/View>\s*\)\}\s*<\/View>\s*<\/View>)/;
const testMatch = content.match(testNoRegex);

const subjectRegex = /\{\s*isTeacher\s*&&\s*\(\s*<View style=\{\[styles\.row, \{ marginTop: scale\(10\), zIndex: 1400 \}\]\}>[\s\S]*?<View style=\{\[styles\.col, \{ flex: 1 \}\]\}>([\s\S]*?onClose=\{\(\) => setShowTeacherSubjectDropdown\(false\)\}\s*\/>\s*\)\}\s*<\/View>\s*<\/View>\s*<\/View>\s*\)\}/;
const subjMatch = content.match(subjectRegex);

if (testMatch && subjMatch) {
    const testInner = testMatch[1];
    const subjInner = subjMatch[1];

    const newSubjectBlock = `{isTeacher && (\n                      <View style={[styles.col, { flex: 0.35, zIndex: 2000 }]}>\n${subjInner}\n                      </View>\n                    )}`;
    const newTestBlock = `<View style={[styles.row, { marginTop: scale(10), zIndex: 1400 }]}>\n                  <View style={[styles.col, { flex: 1 }]}>\n                    {/* ── Test No. picker ── */}\n${testInner}\n                  </View>\n                </View>`;

    content = content.replace(testMatch[0], newSubjectBlock);
    content = content.replace(subjMatch[0], newTestBlock);

    fs.writeFileSync(file, content, 'utf8');
    console.log('Swapped in Class10thExamsScreen.tsx');
} else {
    console.log('Regex match failed');
}
