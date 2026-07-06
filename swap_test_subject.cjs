const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'screens', 'exams');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') && !f.includes('_backup'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    const testNoStartStr = '{/* ── Test No. picker ── */}';
    const testNoEndStr = 'onClose={() => setShowTitleDropdown(false)}\n                            />\n                          </View>\n                        )}\n                      </View>\n                    </View>';

    const subjStartStr = '{isTeacher && (\n                <View style={[styles.row, { marginTop: scale(10), zIndex: 1400 }]}>\n                  <View style={[styles.col, { flex: 1 }]}>';
    const subjEndStr = 'onClose={() => setShowTeacherSubjectDropdown(false)}\n                        />\n                      )}\n                    </View>\n                  </View>\n                </View>\n              )}';

    // Normalize line endings to help match
    content = content.replace(/\r\n/g, '\n');

    let testStartIndex = content.indexOf(testNoStartStr);
    let subjStartIndex = content.indexOf(subjStartStr);

    if (testStartIndex !== -1 && subjStartIndex !== -1) {
        // Find ends by searching forward from the start index
        let testEndIndex = content.indexOf(testNoEndStr, testStartIndex);
        let subjEndIndex = content.indexOf(subjEndStr, subjStartIndex);
        
        if (testEndIndex !== -1 && subjEndIndex !== -1) {
            testEndIndex += testNoEndStr.length;
            subjEndIndex += subjEndStr.length;

            let testBlock = content.substring(testStartIndex, testEndIndex);
            let subjBlock = content.substring(subjStartIndex, subjEndIndex);

            // testBlock inner content (remove outer wrapper for flex 0.35)
            // It looks like:
            // {/* ── Test No. picker ── */}
            // <View style={[styles.col, { flex: 0.35, zIndex: 2000 }]}>
            //   <Text style={[styles.label, { color: theme.text }]}>Test No.</Text>
            //   ...
            // </View>

            // subjBlock inner content
            // It looks like:
            // {isTeacher && (
            //   <View style={[styles.row, { marginTop: scale(10), zIndex: 1400 }]}>
            //     <View style={[styles.col, { flex: 1 }]}>
            //       <Text style={[styles.label, { color: theme.text }]}>Subject</Text>
            //       ...
            //     </View>
            //   </View>
            // )}

            // Let's replace the outer wrappers. 
            // For Test No inner:
            let testInner = testBlock.replace(/^\{\/\* ── Test No\. picker ── \*\/}\n\s*<View style=\{\[styles\.col, \{ flex: 0\.35, zIndex: 2000 \}\]\}>/, '')
                                     .replace(/<\/View>$/, '');
            
            // For Subject inner:
            let subjInner = subjBlock.replace(/^\{isTeacher && \(\n\s*<View style=\{\[styles\.row, \{ marginTop: scale\(10\), zIndex: 1400 \}\]\}>\n\s*<View style=\{\[styles\.col, \{ flex: 1 \}\]\}>/, '')
                                     .replace(/<\/View>\n\s*<\/View>\n\s*\)\}$/, '');

            let newSubjectBlock = `{isTeacher && (\n                      <View style={[styles.col, { flex: 0.35, zIndex: 2000 }]}>\n${subjInner}                      </View>\n                    )}`;
            let newTestBlock = `<View style={[styles.row, { marginTop: scale(10), zIndex: 1400 }]}>\n                  <View style={[styles.col, { flex: 1 }]}>\n                    {/* ── Test No. picker ── */}\n${testInner}                  </View>\n                </View>`;

            // Replace the full blocks in the content
            content = content.replace(testBlock, newSubjectBlock);
            content = content.replace(subjBlock, newTestBlock);

            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Swapped in', file);
        } else {
            console.log('Could not find end boundaries in', file);
        }
    } else {
        console.log('Could not find start boundaries in', file);
    }
});
