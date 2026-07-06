const fs = require('fs');

const file = 'src/screens/exams/Class10thExamsScreen.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\r\n/g, '\n');

// Find the Test No block
const testStartIndex = content.indexOf('{/* ── Test No. picker ── */}');
const testEndIndex = content.indexOf('onClose={() => setShowTitleDropdown(false)}\n                            />\n                          </View>\n                        )}\n                      </View>\n                    </View>') + 'onClose={() => setShowTitleDropdown(false)}\n                            />\n                          </View>\n                        )}\n                      </View>\n                    </View>'.length;

const testBlock = content.substring(testStartIndex, testEndIndex);
const testInner = testBlock.replace(/^\{\/\* ── Test No\. picker ── \*\/}\n\s*<View style=\{\[styles\.col, \{ flex: 0\.35, zIndex: 2000 \}\]\}>/, '').replace(/<\/View>$/, '');

// Find the Subject block using regex to be completely safe against spacing
const subjStartRegex = /\{\s*isTeacher && \(\s*<View style=\{\[styles\.row, \{ marginTop: scale\(10\), zIndex: 1400 \}\]\}>\s*<View style=\{\[styles\.col, \{ flex: 1 \}\]\}>/;
const subjStartMatch = content.match(subjStartRegex);
const subjStartIndex = subjStartMatch.index;

const subjEndRegex = /onClose=\{\(\) => setShowTeacherSubjectDropdown\(false\)\}\s*\/>\s*\)\}\s*<\/View>\s*<\/View>\s*<\/View>\s*\)\}/;
const subjEndMatch = content.match(subjEndRegex);
const subjEndIndex = subjEndMatch.index + subjEndMatch[0].length;

const subjBlock = content.substring(subjStartIndex, subjEndIndex);
const subjInner = subjBlock.replace(subjStartRegex, '').replace(/<\/View>\s*<\/View>\s*<\/View>\s*\)\}$/, '');

const newSubjectBlock = `{isTeacher && (\n                      <View style={[styles.col, { flex: 0.35, zIndex: 2000 }]}>\n${subjInner}                      </View>\n                    )}`;
const newTestBlock = `<View style={[styles.row, { marginTop: scale(10), zIndex: 1400 }]}>\n                  <View style={[styles.col, { flex: 1 }]}>\n                    {/* ── Test No. picker ── */}\n${testInner}                  </View>\n                </View>`;

content = content.replace(testBlock, newSubjectBlock);
content = content.replace(subjBlock, newTestBlock);

fs.writeFileSync(file, content, 'utf8');
console.log('Swapped in Class10th');
