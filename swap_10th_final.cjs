const fs = require('fs');

const file = 'src/screens/exams/Class10thExamsScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

const testNoStartStr = '{/* ── Test No. picker ── */}';
const testNoEndStr = 'onClose={() => setShowTitleDropdown(false)}\n                            />\n                        )}\n                      </View>\n                    </View>';

const subjStartStr = '{isTeacher && (\n                <View style={[styles.row, { marginTop: scale(10), zIndex: 1400 }]}>\n                  <View style={[styles.col, { flex: 1 }]}>';
const subjEndStr = 'onClose={() => setShowTeacherSubjectDropdown(false)}\n                        />\n                      )}\n                    </View>\n                  </View>\n                </View>\n              )}';

content = content.replace(/\r\n/g, '\n');

let testStartIndex = content.indexOf(testNoStartStr);
let subjStartIndex = content.indexOf(subjStartStr);

if (testStartIndex !== -1 && subjStartIndex !== -1) {
    let testEndIndex = content.indexOf(testNoEndStr, testStartIndex);
    let subjEndIndex = content.indexOf(subjEndStr, subjStartIndex);
    
    if (testEndIndex !== -1 && subjEndIndex !== -1) {
        testEndIndex += testNoEndStr.length;
        subjEndIndex += subjEndStr.length;

        let testBlock = content.substring(testStartIndex, testEndIndex);
        let subjBlock = content.substring(subjStartIndex, subjEndIndex);

        let testInner = testBlock.replace(/^\{\/\* ── Test No\. picker ── \*\/}\n\s*<View style=\{\[styles\.col, \{ flex: 0\.35, zIndex: 2000 \}\]\}>/, '')
                                 .replace(/<\/View>$/, '');
        
        let subjInner = subjBlock.replace(/^\{isTeacher && \(\n\s*<View style=\{\[styles\.row, \{ marginTop: scale\(10\), zIndex: 1400 \}\]\}>\n\s*<View style=\{\[styles\.col, \{ flex: 1 \}\]\}>/, '')
                                 .replace(/<\/View>\n\s*<\/View>\n\s*\)\}$/, '');

        let newSubjectBlock = `{isTeacher && (\n                      <View style={[styles.col, { flex: 0.35, zIndex: 2000 }]}>\n${subjInner}                      </View>\n                    )}`;
        let newTestBlock = `<View style={[styles.row, { marginTop: scale(10), zIndex: 1400 }]}>\n                  <View style={[styles.col, { flex: 1 }]}>\n                    {/* ── Test No. picker ── */}\n${testInner}                  </View>\n                </View>`;

        content = content.replace(testBlock, newSubjectBlock);
        content = content.replace(subjBlock, newTestBlock);

        fs.writeFileSync(file, content, 'utf8');
        console.log('Swapped in Class10th');
    } else {
        console.log('End boundaries not found', {testEndIndex, subjEndIndex});
    }
} else {
    console.log('Start boundaries not found', {testStartIndex, subjStartIndex});
}
