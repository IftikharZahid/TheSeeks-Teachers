const fs = require('fs');
const files = [
  'GenericExamsScreen.tsx',
  'Class9thExamsScreen.tsx',
  'Class10thExamsScreen.tsx',
  'Class1stYearExamsScreen.tsx',
  'Class2ndYearExamsScreen.tsx'
];

const updateTeacherBookTarget = `      return [{
        name: subject,
        totalMarks: field === 'totalMarks' ? digits : '',
        obtainedMarks: field === 'obtainedMarks' ? digits : '',
      }];`;

const updateTeacherBookReplacement = `      return [...prev, {
        name: subject,
        totalMarks: field === 'totalMarks' ? digits : '',
        obtainedMarks: field === 'obtainedMarks' ? digits : '',
      }];`;

const handleSaveExamCalcTarget = `    let computedStatus = 'Absent';
    let totalObtained = 0;
    let totalPossible = 0;

    if (scopedEntryBooks.length > 0) {
      scopedEntryBooks.forEach(book => {
        const obtained = parseFloat(book.obtainedMarks);
        const total = parseFloat(book.totalMarks);
        if (!isNaN(obtained) && !isNaN(total)) {
          totalObtained += obtained;
          totalPossible += total;
        }
      });
      if (totalPossible > 0) {
        const percentage = (totalObtained / totalPossible) * 100;
        computedStatus = percentage >= 40 ? 'Pass' : 'Fail';
      }
    } else if (obtainedMarks && obtainedMarks.trim() !== '') {`;

const handleSaveExamCalcReplacement = `    let computedStatus = 'Absent';
    let totalObtained = 0;
    let totalPossible = 0;

    if (entryBooks.length > 0) {
      entryBooks.forEach(book => {
        const obtained = parseFloat(book.obtainedMarks);
        const total = parseFloat(book.totalMarks);
        if (!isNaN(obtained) && !isNaN(total)) {
          totalObtained += obtained;
          totalPossible += total;
        }
      });
      if (totalPossible > 0) {
        const percentage = (totalObtained / totalPossible) * 100;
        computedStatus = percentage >= 40 ? 'Pass' : 'Fail';
      }
    } else if (obtainedMarks && obtainedMarks.trim() !== '') {`;

const handleSaveExamPayloadTarget = `    const finalTotalMarks = scopedEntryBooks.length > 0 ? totalPossible.toString() : (totalMarks || '');
    const finalObtainedMarks = scopedEntryBooks.length > 0 ? totalObtained.toString() : (obtainedMarks || '');

    const examData: any = {
      title,
      date: formattedDate,
      category,
      rollNo: rollNo || '',
      studentName: studentName || '',
      studentEmail: studentEmail || '',
      studentClass: studentClass || '',
      books: scopedEntryBooks.length > 0 ? scopedEntryBooks : undefined,
      bookName: scopedEntryBooks.length > 0 ? scopedEntryBooks.map(b => b.name).join(', ') : (isTeacher && selectedTeacherSubject ? selectedTeacherSubject : (bookName || '')),
      totalMarks: finalTotalMarks,
      obtainedMarks: finalObtainedMarks,`;

const handleSaveExamPayloadReplacement = `    const finalTotalMarks = entryBooks.length > 0 ? totalPossible.toString() : (totalMarks || '');
    const finalObtainedMarks = entryBooks.length > 0 ? totalObtained.toString() : (obtainedMarks || '');

    const examData: any = {
      title,
      date: formattedDate,
      category,
      rollNo: rollNo || '',
      studentName: studentName || '',
      studentEmail: studentEmail || '',
      studentClass: studentClass || '',
      books: entryBooks.length > 0 ? entryBooks : undefined,
      bookName: entryBooks.length > 0 ? entryBooks.map(b => b.name).join(', ') : (isTeacher && selectedTeacherSubject ? selectedTeacherSubject : (bookName || '')),
      totalMarks: finalTotalMarks,
      obtainedMarks: finalObtainedMarks,`;

const mapExistingBooksTarget = `                  {/* Existing books list */}
                  {entryBooks.map((book, index) => (
                    <View key={index} style={[styles.addBookRow, { borderColor: theme.border, marginBottom: scale(8) }]}>
                      <View style={{ flex: 2, marginRight: scale(6) }}>
                        <View style={[styles.compactInput, { borderColor: theme.border, backgroundColor: theme.card, justifyContent: 'center' }]}>
                          <Text style={{ color: theme.text, fontSize: scale(12) }} numberOfLines={1}>{book.name}</Text>
                        </View>
                      </View>
                      <View style={{ flex: 1, marginRight: scale(4) }}>
                        <TextInput
                          style={[styles.compactInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                          placeholder="Total"
                          placeholderTextColor={theme.textSecondary}
                          value={book.totalMarks}
                          onChangeText={(val) => {
                            const digits = val.replace(/[^0-9]/g, '');
                            const updated = [...entryBooks];
                            updated[index] = { ...updated[index], totalMarks: digits };
                            if (updated[index].obtainedMarks && parseInt(updated[index].obtainedMarks) > parseInt(digits || '0')) {
                              updated[index].obtainedMarks = digits;
                            }
                            setEntryBooks(updated);
                          }}
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={{ flex: 1, marginRight: scale(6) }}>
                        <TextInput
                          style={[styles.compactInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                          placeholder="Obt."
                          placeholderTextColor={theme.textSecondary}
                          value={book.obtainedMarks}
                          onChangeText={(val) => {
                            const digits = val.replace(/[^0-9]/g, '');
                            const updated = [...entryBooks];
                            if (digits && !updated[index].totalMarks) { alert('Please enter Total marks first.'); return; }
                            if (digits && parseInt(digits) > parseInt(updated[index].totalMarks || '0')) {
                              alert('Obtained marks cannot exceed Total marks.');
                              updated[index] = { ...updated[index], obtainedMarks: updated[index].totalMarks };
                            } else {
                              updated[index] = { ...updated[index], obtainedMarks: digits };
                            }
                            setEntryBooks(updated);
                          }}
                          keyboardType="numeric"
                        />
                      </View>
                      <TouchableOpacity onPress={() => handleRemoveBook(index)} style={{ padding: scale(4) }}>
                        <Ionicons name="close-circle" size={20} color={theme.error} />
                      </TouchableOpacity>
                    </View>
                  ))}`;

const mapExistingBooksReplacement = `                  {/* Existing books list */}
                  {entryBooks.map((book, index) => {
                    const isSubjectRestricted = isTeacher && teacherSubjectsList.length > 0 && !teacherSubjectsList.some((s: any) => (s||'').toLowerCase().trim() === (book.name||'').toLowerCase().trim());
                    return (
                    <View key={index} style={[styles.addBookRow, { borderColor: theme.border, marginBottom: scale(8), opacity: isSubjectRestricted ? 0.6 : 1 }]}>
                      <View style={{ flex: 2, marginRight: scale(6) }}>
                        <View style={[styles.compactInput, { borderColor: theme.border, backgroundColor: theme.card, justifyContent: 'center' }]}>
                          <Text style={{ color: theme.text, fontSize: scale(12) }} numberOfLines={1}>{book.name}</Text>
                        </View>
                      </View>
                      <View style={{ flex: 1, marginRight: scale(4) }}>
                        <TextInput
                          style={[styles.compactInput, { color: theme.text, borderColor: theme.border, backgroundColor: isSubjectRestricted ? theme.background : theme.card }]}
                          placeholder="Total"
                          placeholderTextColor={theme.textSecondary}
                          value={book.totalMarks}
                          editable={!isSubjectRestricted}
                          onChangeText={(val) => {
                            const digits = val.replace(/[^0-9]/g, '');
                            const updated = [...entryBooks];
                            updated[index] = { ...updated[index], totalMarks: digits };
                            if (updated[index].obtainedMarks && parseInt(updated[index].obtainedMarks) > parseInt(digits || '0')) {
                              updated[index].obtainedMarks = digits;
                            }
                            setEntryBooks(updated);
                          }}
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={{ flex: 1, marginRight: scale(6) }}>
                        <TextInput
                          style={[styles.compactInput, { color: theme.text, borderColor: theme.border, backgroundColor: isSubjectRestricted ? theme.background : theme.card }]}
                          placeholder="Obt."
                          placeholderTextColor={theme.textSecondary}
                          value={book.obtainedMarks}
                          editable={!isSubjectRestricted}
                          onChangeText={(val) => {
                            const digits = val.replace(/[^0-9]/g, '');
                            const updated = [...entryBooks];
                            if (digits && !updated[index].totalMarks) { alert('Please enter Total marks first.'); return; }
                            if (digits && parseInt(digits) > parseInt(updated[index].totalMarks || '0')) {
                              alert('Obtained marks cannot exceed Total marks.');
                              updated[index] = { ...updated[index], obtainedMarks: updated[index].totalMarks };
                            } else {
                              updated[index] = { ...updated[index], obtainedMarks: digits };
                            }
                            setEntryBooks(updated);
                          }}
                          keyboardType="numeric"
                        />
                      </View>
                      {!isSubjectRestricted && (
                        <TouchableOpacity onPress={() => handleRemoveBook(index)} style={{ padding: scale(4) }}>
                          <Ionicons name="close-circle" size={20} color={theme.error} />
                        </TouchableOpacity>
                      )}
                      {isSubjectRestricted && (
                        <View style={{ padding: scale(4), justifyContent: 'center' }}>
                          <Ionicons name="lock-closed" size={16} color={theme.textSecondary} />
                        </View>
                      )}
                    </View>
                  )})} `;

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    if (content.includes(updateTeacherBookTarget)) {
      content = content.replace(updateTeacherBookTarget, updateTeacherBookReplacement);
      console.log('Fixed updateTeacherBook in', file);
    }
    
    if (content.includes(handleSaveExamCalcTarget)) {
      content = content.replace(handleSaveExamCalcTarget, handleSaveExamCalcReplacement);
      console.log('Fixed Exam Calc in', file);
    }
    
    if (content.includes(handleSaveExamPayloadTarget)) {
      content = content.replace(handleSaveExamPayloadTarget, handleSaveExamPayloadReplacement);
      console.log('Fixed Exam Payload in', file);
    }
    
    if (content.includes(mapExistingBooksTarget)) {
      content = content.replace(mapExistingBooksTarget, mapExistingBooksReplacement);
      console.log('Fixed UI mapping in', file);
    }
    
    fs.writeFileSync(file, content);
  }
}
