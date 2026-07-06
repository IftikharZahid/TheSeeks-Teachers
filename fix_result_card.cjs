const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens', 'exams');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.tsx') && !f.includes('_backup'));

const replacementCode = `{/* Compact Stats Row */}
              {(() => {
                const selOriginal = selectedExamForOptions;
                const studentKey = (selOriginal?.rollNo || selOriginal?.studentName || '');
                const studentClass = selOriginal?.studentClass || '';
                const studentExams = exams.filter(e => {
                  const k = (e.rollNo || e.studentName || '');
                  return k === studentKey && (e.studentClass || '') === studentClass;
                });
                const sameTests = studentExams.filter(e => e.title === selOriginal?.title && e.category === selOriginal?.category);
                
                let combinedBooks = [];
                sameTests.forEach(test => {
                  if (test.books && test.books.length > 0) {
                    test.books.forEach(b => combinedBooks.push(b));
                  } else if (test.bookName) {
                    combinedBooks.push({
                      name: test.bookName,
                      totalMarks: test.totalMarks || '0',
                      obtainedMarks: test.obtainedMarks || '0'
                    });
                  }
                });
                
                let displayTotal = combinedBooks.reduce((sum, b) => sum + (parseFloat(b.totalMarks) || 0), 0).toString();
                let displayObtained = combinedBooks.reduce((sum, b) => sum + (parseFloat(b.obtainedMarks) || 0), 0).toString();
                if (displayTotal === '0' && displayObtained === '0' && combinedBooks.length === 0) {
                   displayTotal = selOriginal?.totalMarks || '—';
                   displayObtained = selOriginal?.obtainedMarks || '—';
                }
                const percentage = displayTotal !== '—' && displayObtained !== '—' && parseFloat(displayTotal) > 0
                  ? ((parseFloat(displayObtained) / parseFloat(displayTotal)) * 100).toFixed(1) + '%' : null;
                
                const status = percentage ? (parseFloat(percentage) >= 40 ? 'Pass' : 'Fail') : (selOriginal?.status || 'Active');

                return (
                  <View style={{ flexDirection: 'row', gap: scale(6), marginBottom: scale(12) }}>
                    <View style={{ flex: 1, borderRadius: scale(6), paddingVertical: scale(6), alignItems: 'center', borderWidth: 1, backgroundColor: status === 'Pass' ? '#E8F5E910' : status === 'Fail' ? '#FFEBEE10' : '#FFF3E010', borderColor: status === 'Pass' ? '#2E7D3225' : status === 'Fail' ? '#C6282825' : '#EF6C0025' }}>
                      <Text style={{ fontSize: scale(9), color: theme.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: scale(1) }}>Status</Text>
                      <Text style={{ fontSize: scale(12), fontWeight: '800', color: status === 'Pass' ? '#2E7D32' : status === 'Fail' ? '#C62828' : '#EF6C00' }}>{status}</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: theme.background, borderRadius: scale(6), paddingVertical: scale(6), alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
                      <Text style={{ fontSize: scale(9), color: theme.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: scale(1) }}>Total</Text>
                      <Text style={{ fontSize: scale(13), fontWeight: '800', color: theme.text }}>{displayTotal}</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: theme.primary + '08', borderRadius: scale(6), paddingVertical: scale(6), alignItems: 'center', borderWidth: 1, borderColor: theme.primary + '20' }}>
                      <Text style={{ fontSize: scale(9), color: theme.primary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: scale(1) }}>Obtained</Text>
                      <Text style={{ fontSize: scale(13), fontWeight: '800', color: theme.primary }}>{displayObtained}</Text>
                      {percentage && <Text style={{ fontSize: scale(8), color: theme.primary, marginTop: scale(1) }}>({percentage})</Text>}
                    </View>
                    <View style={{ flex: 1, backgroundColor: theme.background, borderRadius: scale(6), paddingVertical: scale(6), alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
                      <Text style={{ fontSize: scale(9), color: theme.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: scale(1) }}>Pos.</Text>
                      <Text style={{ fontSize: scale(12), fontWeight: '800', color: theme.text }}>
                        {(() => {
                          if (!selOriginal) return '—';
                          
                          const sameGroupExams = exams.filter(e => e.title === selOriginal.title && e.studentClass === selOriginal.studentClass && e.category === selOriginal.category);
                          
                          const studentScores = new Map();
                          sameGroupExams.forEach(e => {
                            const key = (e.rollNo || e.studentName || '');
                            if (!studentScores.has(key)) {
                              studentScores.set(key, 0);
                            }
                            
                            let eObt = 0;
                            if (e.books && e.books.length > 0) {
                              e.books.forEach(b => eObt += parseFloat(b.obtainedMarks) || 0);
                            } else {
                              eObt = parseFloat(e.obtainedMarks) || 0;
                            }
                            studentScores.set(key, studentScores.get(key) + eObt);
                          });
                          
                          const sortedScores = Array.from(studentScores.entries()).sort((a, b) => b[1] - a[1]);
                          const myKey = (selOriginal.rollNo || selOriginal.studentName || '');
                          const pos = sortedScores.findIndex(s => s[0] === myKey) + 1;
                          return pos > 0 ? \`\${pos}/\${sortedScores.length}\` : '—';
                        })()}
                      </Text>
                    </View>
                  </View>
                );
              })()}

              {/* Subject Breakdown */}
              {(() => {
                const selOriginal = selectedExamForOptions;
                if (!selOriginal) return null;
                const studentKey = (selOriginal?.rollNo || selOriginal?.studentName || '');
                const studentClass = selOriginal?.studentClass || '';
                const studentExams = exams.filter(e => {
                  const k = (e.rollNo || e.studentName || '');
                  return k === studentKey && (e.studentClass || '') === studentClass;
                });
                const sameTests = studentExams.filter(e => e.title === selOriginal.title && e.category === selOriginal.category);
                
                let combinedBooks = [];
                sameTests.forEach(test => {
                  if (test.books && test.books.length > 0) {
                    test.books.forEach(b => combinedBooks.push(b));
                  } else if (test.bookName) {
                    combinedBooks.push({
                      name: test.bookName,
                      totalMarks: test.totalMarks || '0',
                      obtainedMarks: test.obtainedMarks || '0'
                    });
                  }
                });
                
                if (combinedBooks.length === 0) return null;

                return (
                  <View style={{ marginBottom: scale(12), backgroundColor: theme.background, borderRadius: scale(8), borderWidth: 1, borderColor: theme.border, overflow: 'hidden' }}>
                    <View style={{ flexDirection: 'row', paddingVertical: scale(6), paddingHorizontal: scale(10), backgroundColor: theme.primary + '08', borderBottomWidth: 1, borderBottomColor: theme.border }}>
                      <Text style={{ flex: 1, fontSize: scale(10), fontWeight: '700', color: theme.primary, textTransform: 'uppercase', letterSpacing: 0.3 }}>Subject</Text>
                      <Text style={{ width: scale(40), fontSize: scale(10), fontWeight: '700', color: theme.primary, textTransform: 'uppercase', letterSpacing: 0.3, textAlign: 'center' }}>Total</Text>
                      <Text style={{ width: scale(40), fontSize: scale(10), fontWeight: '700', color: theme.primary, textTransform: 'uppercase', letterSpacing: 0.3, textAlign: 'center' }}>Obt.</Text>
                    </View>
                    {combinedBooks.map((book, idx) => (
                      <View key={idx} style={{ flexDirection: 'row', paddingVertical: scale(6), paddingHorizontal: scale(10), alignItems: 'center', backgroundColor: idx % 2 === 0 ? 'transparent' : theme.card + '60', borderBottomWidth: idx < combinedBooks.length - 1 ? 0.5 : 0, borderBottomColor: theme.border }}>
                        <Text style={{ flex: 1, fontSize: scale(11), color: theme.text, fontWeight: '500' }}>{book.name}</Text>
                        <Text style={{ width: scale(40), fontSize: scale(11), color: theme.textSecondary, textAlign: 'center' }}>{book.totalMarks}</Text>
                        <Text style={{ width: scale(40), fontSize: scale(11), fontWeight: '600', color: theme.text, textAlign: 'center' }}>{book.obtainedMarks}</Text>
                      </View>
                    ))}
                    <View style={{ flexDirection: 'row', paddingVertical: scale(6), paddingHorizontal: scale(10), backgroundColor: theme.primary + '10', borderTopWidth: 1, borderTopColor: theme.border }}>
                      <Text style={{ flex: 1, fontSize: scale(10), fontWeight: '800', color: theme.primary, textTransform: 'uppercase' }}>Total</Text>
                      <Text style={{ width: scale(40), fontSize: scale(11), fontWeight: '800', color: theme.text, textAlign: 'center' }}>
                        {combinedBooks.reduce((s, b) => s + (parseFloat(b.totalMarks) || 0), 0)}
                      </Text>
                      <Text style={{ width: scale(40), fontSize: scale(11), fontWeight: '800', color: theme.primary, textAlign: 'center' }}>
                        {combinedBooks.reduce((s, b) => s + (parseFloat(b.obtainedMarks) || 0), 0)}
                      </Text>
                    </View>
                  </View>
                );
              })()}

              {/* Description */}
              {selectedExamForOptions?.description && (
                <View style={{ marginBottom: scale(12), flexDirection: 'row', backgroundColor: theme.background, borderRadius: scale(6), padding: scale(8), borderLeftWidth: 3, borderLeftColor: theme.primary }}>
                  <Ionicons name="chatbubble-outline" size={12} color={theme.textSecondary} style={{ marginRight: scale(6), marginTop: scale(1) }} />
                  <Text style={{ fontSize: scale(11), color: theme.textSecondary, fontStyle: 'italic', flex: 1 }}>"{selectedExamForOptions.description}"</Text>
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            {(() => {
              const selOriginal = selectedExamForOptions;
              let targetEditExam = selOriginal;
              let targetDeleteId = selOriginal?.id;
              
              if (isTeacher && selOriginal) {
                 const studentKey = (selOriginal.rollNo || selOriginal.studentName || '');
                 const studentClass = selOriginal.studentClass || '';
                 const sameTests = exams.filter(e => {
                   return (e.rollNo || e.studentName || '') === studentKey && (e.studentClass || '') === studentClass && e.title === selOriginal.title && e.category === selOriginal.category;
                 });
                 const teacherDocs = sameTests.filter(e => {
                   return typeof teacherSubjectsList !== 'undefined' && teacherSubjectsList.some(s => s.toLowerCase().trim() === (e.bookName || '').toLowerCase().trim());
                 });
                 if (teacherDocs.length > 0) {
                   targetEditExam = teacherDocs[0];
                   targetDeleteId = teacherDocs[0].id;
                 }
              }

              return (
                <View style={{ flexDirection: 'row', gap: scale(8), paddingTop: scale(10), marginTop: 'auto' }}>
                  <TouchableOpacity
                    onPress={() => { setShowOptionsModal(false); if (targetEditExam) openModal(targetEditExam); }}
                    style={{ flex: 1, paddingVertical: scale(8), backgroundColor: theme.primary, borderRadius: scale(8), flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="create-outline" size={14} color={isDark ? theme.text : '#fff'} style={{ marginRight: scale(4) }} />
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: scale(12) }}>Edit Record</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { setShowOptionsModal(false); if (targetDeleteId) handleDeleteExam(targetDeleteId); }}
                    style={{ flex: 1, paddingVertical: scale(8), backgroundColor: theme.error + '12', borderRadius: scale(8), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.error + '25' }}
                  >
                    <Ionicons name="trash-outline" size={14} color={theme.error} style={{ marginRight: scale(4) }} />
                    <Text style={{ color: theme.error, fontWeight: '700', fontSize: scale(12) }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              );
            })()}
          </View>
        </View>
      </Modal>`;

files.forEach(file => {
    const filePath = path.join(screensDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\r\n/g, '\n');

    const startIndex = content.indexOf('{/* Compact Stats Row */}');
    const endStr = '</Modal>';
    let endIndex = content.indexOf(endStr, startIndex);
    
    if (startIndex !== -1 && endIndex !== -1) {
        endIndex += endStr.length;
        const before = content.slice(0, startIndex);
        const after = content.slice(endIndex);
        const updatedContent = before + replacementCode + after;
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        console.log('Updated Result Card aggregation in ' + file);
    } else {
        console.log('Could not find boundaries in ' + file);
    }
});
