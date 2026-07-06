const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens', 'exams');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.tsx') && !f.includes('_backup'));

files.forEach(file => {
    const filePath = path.join(screensDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Replace Compact Stats & Subject Breakdown
    const compactStatsStart = `              {/* Compact Stats Row */}`;
    const descriptionStart = `              {/* Description */}`;
    const compactIndex = content.indexOf(compactStatsStart);
    const descIndex = content.indexOf(descriptionStart);

    if (compactIndex !== -1 && descIndex !== -1) {
        const replacementBlock = `              {/* Compact Stats Row & Subject Breakdown (Aggregated) */}
              {(() => {
                const sel = selectedExamForOptions;
                if (!sel) return null;
                const allRelatedExams = exams.filter(e => e.rollNo === sel.rollNo && e.title === sel.title && e.category === sel.category && e.studentClass === sel.studentClass);
                
                let allBooks = [];
                let sumTotal = 0; let sumObtained = 0;
                let hasValidMarks = false;

                allRelatedExams.forEach(e => {
                  if (e.books && e.books.length > 0) {
                    allBooks = allBooks.concat(e.books.map(b => ({ ...b, examId: e.id, teacherId: e.teacherId })));
                    e.books.forEach(b => {
                      const t = parseFloat(b.totalMarks); const o = parseFloat(b.obtainedMarks);
                      if (!isNaN(t)) { sumTotal += t; hasValidMarks = true; }
                      if (!isNaN(o)) sumObtained += o;
                    });
                  } else if (e.bookName || e.totalMarks || e.obtainedMarks) {
                    allBooks.push({
                      name: e.bookName || 'Subject',
                      totalMarks: e.totalMarks,
                      obtainedMarks: e.obtainedMarks,
                      examId: e.id,
                      teacherId: e.teacherId
                    });
                    const t = parseFloat(e.totalMarks); const o = parseFloat(e.obtainedMarks);
                    if (!isNaN(t)) { sumTotal += t; hasValidMarks = true; }
                    if (!isNaN(o)) sumObtained += o;
                  }
                });

                if (allBooks.length === 0) return null;

                let displayTotal = hasValidMarks ? sumTotal.toString() : '—';
                let displayObtained = hasValidMarks ? sumObtained.toString() : '—';
                const percentage = displayTotal !== '—' && displayObtained !== '—' && parseFloat(displayTotal) > 0
                  ? ((parseFloat(displayObtained) / parseFloat(displayTotal)) * 100).toFixed(1) + '%' : null;
                
                let aggStatus = 'Active';
                if (hasValidMarks) {
                   const pct = (parseFloat(displayObtained) / parseFloat(displayTotal)) * 100;
                   aggStatus = pct >= 40 ? 'Pass' : 'Fail';
                }

                return (
                  <>
                    <View style={{ flexDirection: 'row', gap: scale(6), marginBottom: scale(12) }}>
                      <View style={{ flex: 1, borderRadius: scale(6), paddingVertical: scale(6), alignItems: 'center', borderWidth: 1, backgroundColor: aggStatus === 'Pass' ? '#E8F5E910' : aggStatus === 'Fail' ? '#FFEBEE10' : '#FFF3E010', borderColor: aggStatus === 'Pass' ? '#2E7D3225' : aggStatus === 'Fail' ? '#C6282825' : '#EF6C0025' }}>
                        <Text style={{ fontSize: scale(9), color: theme.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: scale(1) }}>Status</Text>
                        <Text style={{ fontSize: scale(12), fontWeight: '800', color: aggStatus === 'Pass' ? '#2E7D32' : aggStatus === 'Fail' ? '#C62828' : '#EF6C00' }}>{aggStatus}</Text>
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
                        <Text style={{ fontSize: scale(12), fontWeight: '800', color: theme.text }}>—</Text>
                      </View>
                    </View>

                    <View style={{ marginBottom: scale(12), backgroundColor: theme.background, borderRadius: scale(8), borderWidth: 1, borderColor: theme.border, overflow: 'hidden' }}>
                      <View style={{ flexDirection: 'row', paddingVertical: scale(6), paddingHorizontal: scale(10), backgroundColor: theme.primary + '08', borderBottomWidth: 1, borderBottomColor: theme.border }}>
                        <Text style={{ flex: 1, fontSize: scale(10), fontWeight: '700', color: theme.primary, textTransform: 'uppercase', letterSpacing: 0.3 }}>Subject</Text>
                        <Text style={{ width: scale(40), fontSize: scale(10), fontWeight: '700', color: theme.primary, textTransform: 'uppercase', letterSpacing: 0.3, textAlign: 'center' }}>Total</Text>
                        <Text style={{ width: scale(40), fontSize: scale(10), fontWeight: '700', color: theme.primary, textTransform: 'uppercase', letterSpacing: 0.3, textAlign: 'center' }}>Obt.</Text>
                      </View>
                      {allBooks.map((book, idx) => (
                        <View key={idx} style={{ flexDirection: 'row', paddingVertical: scale(6), paddingHorizontal: scale(10), alignItems: 'center', backgroundColor: idx % 2 === 0 ? 'transparent' : theme.card + '60', borderBottomWidth: idx < allBooks.length - 1 ? 0.5 : 0, borderBottomColor: theme.border }}>
                          <Text style={{ flex: 1, fontSize: scale(11), color: theme.text, fontWeight: '500' }}>{book.name}</Text>
                          <Text style={{ width: scale(40), fontSize: scale(11), color: theme.textSecondary, textAlign: 'center' }}>{book.totalMarks || '—'}</Text>
                          <Text style={{ width: scale(40), fontSize: scale(11), fontWeight: '600', color: theme.text, textAlign: 'center' }}>{book.obtainedMarks || '—'}</Text>
                        </View>
                      ))}
                      <View style={{ flexDirection: 'row', paddingVertical: scale(6), paddingHorizontal: scale(10), backgroundColor: theme.primary + '10', borderTopWidth: 1, borderTopColor: theme.border }}>
                        <Text style={{ flex: 1, fontSize: scale(10), fontWeight: '800', color: theme.primary, textTransform: 'uppercase' }}>Total</Text>
                        <Text style={{ width: scale(40), fontSize: scale(11), fontWeight: '800', color: theme.text, textAlign: 'center' }}>{sumTotal}</Text>
                        <Text style={{ width: scale(40), fontSize: scale(11), fontWeight: '800', color: theme.primary, textAlign: 'center' }}>{sumObtained}</Text>
                      </View>
                    </View>
                  </>
                );
              })()}

`;
        content = content.substring(0, compactIndex) + replacementBlock + content.substring(descIndex);
    } else {
        console.log(`Warning: Could not find Compact Stats Block in ${file}`);
    }

    // 2. Replace Action Buttons
    const actionButtonsStart = `            {/* Action Buttons */}`;
    const actionButtonsEnd = `            </View>
          </View>
        </View>
      </Modal>`;
    
    const actIndex = content.indexOf(actionButtonsStart);
    const actEndIndex = content.indexOf(actionButtonsEnd);

    if (actIndex !== -1 && actEndIndex !== -1) {
        const replacementBtns = `            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: scale(8), paddingTop: scale(10), marginTop: 'auto' }}>
              <TouchableOpacity
                onPress={() => {
                  if (selectedExamForOptions) {
                    const isAuthorized = !isTeacher || (selectedExamForOptions.teacherId === teacherId);
                    if (!isAuthorized) {
                      Alert.alert('Unauthorized', 'You can only edit subjects that you added.');
                    } else {
                      setShowOptionsModal(false);
                      openModal(selectedExamForOptions);
                    }
                  }
                }}
                style={{ flex: 1, paddingVertical: scale(8), backgroundColor: theme.primary, borderRadius: scale(8), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', opacity: (isTeacher && selectedExamForOptions && selectedExamForOptions.teacherId !== teacherId) ? 0.5 : 1 }}
                disabled={isTeacher && selectedExamForOptions && selectedExamForOptions.teacherId !== teacherId}
              >
                <Ionicons name="create-outline" size={14} color={isDark ? theme.text : '#fff'} style={{ marginRight: scale(4) }} />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: scale(12) }}>Edit Record</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (selectedExamForOptions) {
                    const isAuthorized = !isTeacher || (selectedExamForOptions.teacherId === teacherId);
                    if (!isAuthorized) {
                      Alert.alert('Unauthorized', 'You can only delete subjects that you added.');
                    } else {
                      setShowOptionsModal(false);
                      handleDeleteExam(selectedExamForOptions.id);
                    }
                  }
                }}
                style={{ flex: 1, paddingVertical: scale(8), backgroundColor: theme.error + '12', borderRadius: scale(8), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.error + '25', opacity: (isTeacher && selectedExamForOptions && selectedExamForOptions.teacherId !== teacherId) ? 0.5 : 1 }}
                disabled={isTeacher && selectedExamForOptions && selectedExamForOptions.teacherId !== teacherId}
              >
                <Ionicons name="trash-outline" size={14} color={theme.error} style={{ marginRight: scale(4) }} />
                <Text style={{ color: theme.error, fontWeight: '700', fontSize: scale(12) }}>Delete</Text>
              </TouchableOpacity>
`;
        content = content.substring(0, actIndex) + replacementBtns + content.substring(actEndIndex);
    } else {
        console.log(`Warning: Could not find Action Buttons Block in ${file}`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated result card in ${file}`);
});
