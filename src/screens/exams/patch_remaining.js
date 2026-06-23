/**
 * patch_remaining.js
 * Patches all remaining `teacherSubject` usages in GenericExamsScreen.tsx
 * after the manual state/logic fixes have already been applied.
 */
const fs = require('fs');
const p = 'c:\\Users\\USER\\Desktop\\Mobile App Dev\\TheSeeks Projects\\TheSeeks-Teachers\\src\\screens\\exams\\GenericExamsScreen.tsx';
let c = fs.readFileSync(p, 'utf8');

// handleSaveExam: bookName field
c = c.replace(
  /bookName: scopedEntryBooks\.length > 0 \? scopedEntryBooks\.map\(b => b\.name\)\.join\(', '\) : \(isTeacher && teacherSubject \? teacherSubject : \(bookName \|\| ''\)\),/g,
  `bookName: scopedEntryBooks.length > 0 ? scopedEntryBooks.map(b => b.name).join(', ') : (isTeacher && selectedTeacherSubject ? selectedTeacherSubject : (bookName || '')),`
);

// canAddExamForSubject calls with teacherSubject (last arg)
c = c.replace(
  /AUTHORIZATION\.canAddExamForSubject\(\s*([^,]+),\s*isTeacher,\s*teacherSubject\s*\)/g,
  (_, book) => `AUTHORIZATION.canAddExamForSubject(\n            ${book.trim()},\n            isTeacher,\n            teacherSubjectsList\n          )`
);

// handleEditExam: loadedBooks filter
c = c.replace(
  /if \(isTeacher && teacherSubject\) \{\s*loadedBooks = loadedBooks\.filter\(b => normalizeSubjectName\(b\.name\) === normalizeSubjectName\(teacherSubject\)\);\s*const hasSubject = loadedBooks\.some\(b => normalizeSubjectName\(b\.name\) === normalizeSubjectName\(teacherSubject\)\);\s*if \(!hasSubject\) \{\s*loadedBooks\.push\(\{ name: teacherSubject\.trim\(\), totalMarks: '', obtainedMarks: '' \}\);\s*\}/g,
  `if (isTeacher && teacherSubjectsList.length > 0) {
        loadedBooks = loadedBooks.filter(b => teacherSubjectsList.some((s: string) => normalizeSubjectName(s) === normalizeSubjectName(b.name)));
        const hasSubject = loadedBooks.some(b => normalizeSubjectName(b.name) === normalizeSubjectName(selectedTeacherSubject));
        if (!hasSubject && selectedTeacherSubject) {
          loadedBooks.push({ name: selectedTeacherSubject.trim(), totalMarks: '', obtainedMarks: '' });
        }`
);

// resetForm: entryBooks init
c = c.replace(
  /setEntryBooks\(isTeacher && teacherSubject\s*\?\s*\[\{ name: teacherSubject\.trim\(\), totalMarks: '', obtainedMarks: '' \}\]\s*: \[\]\);/g,
  `setEntryBooks(isTeacher && selectedTeacherSubject
      ? [{ name: selectedTeacherSubject.trim(), totalMarks: '', obtainedMarks: '' }]
      : []);`
);

// handleAddBook: auth check with teacherSubject
c = c.replace(
  /AUTHORIZATION\.canAddExamForSubject\(\s*currentBookName,\s*isTeacher,\s*teacherSubjectsList\s*\)/g,
  `AUTHORIZATION.canAddExamForSubject(\n        currentBookName,\n        isTeacher,\n        teacherSubjectsList\n      )`
);

// handleRemoveBook: some(s => with teacherSubjectsList
c = c.replace(
  /const isAllowed = teacherSubjectsList\.some\(s => s\.trim\(\)\.toLowerCase\(\)/g,
  `const isAllowed = teacherSubjectsList.some((s: string) => s.trim().toLowerCase()`
);

// handleManualEntry: setCurrentBookName
c = c.replace(
  /if \(isTeacher && teacherSubject\) \{\s*setCurrentBookName\(teacherSubject\);/g,
  `if (isTeacher && selectedTeacherSubject) {\n      setCurrentBookName(selectedTeacherSubject);`
);

// Upload auth
c = c.replace(
  /const normalizedTeacherSubject = teacherSubject\.trim\(\)\.toLowerCase\(\);\s*const hasUnauthorizedSubject = uploadSubjects\.some\(subj => subj && subj !== normalizedTeacherSubject\);/g,
  `const hasUnauthorizedSubject = uploadSubjects.some(subj => subj && !teacherSubjectsList.some((s: string) => s.trim().toLowerCase().replace(/_/g, ' ') === subj.trim().toLowerCase().replace(/_/g, ' ')));`
);
c = c.replace(
  /`You can only upload exam records for "\${teacherSubject}" subject\. The file contains unauthorized subjects\.`/g,
  '`You can only upload exam records for your assigned subjects. The file contains unauthorized subjects.`'
);

// Upload row filtering
c = c.replace(
  /if \(isTeacher && teacherSubject && subj\.replace\(\/\_\/g, ' '\)\.trim\(\)\.toLowerCase\(\) !== teacherSubject\.trim\(\)\.toLowerCase\(\)\)/g,
  `if (isTeacher && teacherSubjectsList.length > 0 && !teacherSubjectsList.some((s: string) => s.trim().toLowerCase().replace(/_/g, ' ') === subj.replace(/_/g, ' ').trim().toLowerCase()))`
);

// Upload: examDoc.bookName
c = c.replace(
  /examDoc\.bookName = isTeacher && teacherSubject \? teacherSubject : \(item\.bookName \|\| ''\);/g,
  `examDoc.bookName = isTeacher && selectedTeacherSubject ? selectedTeacherSubject : (item.bookName || '');`
);

// Admin marks: digits only
c = c.replace(
  /updated\[index\] = \{ \.\.\.updated\[index\], totalMarks: val \};/g,
  `updated[index] = { ...updated[index], totalMarks: val.replace(/[^0-9]/g, '') };`
);
c = c.replace(
  /updated\[index\] = \{ \.\.\.updated\[index\], obtainedMarks: val \};/g,
  `updated[index] = { ...updated[index], obtainedMarks: val.replace(/[^0-9]/g, '') };`
);
c = c.replace(
  /onChangeText=\{setCurrentTotalMarks\}/g,
  `onChangeText={(val) => setCurrentTotalMarks(val.replace(/[^0-9]/g, ''))}`
);
c = c.replace(
  /onChangeText=\{setCurrentObtainedMarks\}/g,
  `onChangeText={(val) => setCurrentObtainedMarks(val.replace(/[^0-9]/g, ''))}`
);

// AUTHORIZATION.canAddExamForSubject — teacherSubjectsList.some(s =>
c = c.replace(
  /teacherSubjectsList\.some\(s => normalizeSubjectName\(s\) === normalizedBook\)/g,
  `teacherSubjectsList.some((s: string) => normalizeSubjectName(s) === normalizedBook)`
);

// Teacher UI: {isTeacher && teacherSubject ? (
// Replace the whole teacher UI section
const OLD_UI = `              {/* ── Teacher View ── */}
              {isTeacher && teacherSubject ? (
                <View style={styles.teacherMarksPanel}>
                  <View style={[styles.teacherSubjectPill, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '25' }]}>
                    <View style={[styles.teacherSubjectIcon, { backgroundColor: theme.primary + '16' }]}>
                      <Ionicons name="book-outline" size={14} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.teacherSubjectLabel, { color: theme.textSecondary }]}>Selected Subject</Text>
                      <Text style={[styles.teacherSubjectName, { color: theme.primary }]} numberOfLines={1}>{teacherSubject}</Text>
                    </View>
                    <Ionicons name="lock-closed" size={13} color={theme.primary} />
                  </View>

                  <View style={{ flexDirection: 'row', paddingHorizontal: scale(2), marginBottom: scale(2) }}>
                    <Text style={{ flex: 2, fontSize: scale(9), fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4 }}>Subject</Text>
                    <Text style={{ flex: 1, fontSize: scale(9), fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center' }}>Total</Text>
                    <Text style={{ flex: 1, fontSize: scale(9), fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center' }}>Obtained</Text>
                  </View>

                  {entryBooks.filter(b => normalizeSubjectName(b.name) === normalizeSubjectName(teacherSubject)).concat(
                    entryBooks.some(b => normalizeSubjectName(b.name) === normalizeSubjectName(teacherSubject)) ? [] : [{ name: teacherSubject, totalMarks: '', obtainedMarks: '' }]
                  ).map((book, index) => (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: scale(6) }}>
                      <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', height: scale(36), paddingHorizontal: scale(8), borderRadius: scale(7), borderWidth: 1, backgroundColor: theme.primary + '12', borderColor: theme.primary + '35' }}>
                        <Ionicons name="book" size={13} color={theme.primary} style={{ marginRight: scale(6) }} />
                        <Text style={{ fontSize: scale(13), fontWeight: '700', color: theme.primary, flex: 1 }} numberOfLines={1}>{book.name}</Text>
                        <Ionicons name="lock-closed" size={11} color={theme.primary + '60'} />
                      </View>
                      <TextInput
                        style={{ flex: 1, height: scale(36), borderWidth: 1, borderRadius: scale(7), paddingHorizontal: scale(8), fontSize: scale(13), fontWeight: '700', textAlign: 'center', backgroundColor: theme.card, color: theme.text, borderColor: theme.border }}
                        placeholder="—"
                        placeholderTextColor={theme.textTertiary}
                        value={book.totalMarks}
                        onChangeText={(val) => {
                          const updated = [...entryBooks];
                          const idx = updated.findIndex(b => normalizeSubjectName(b.name) === normalizeSubjectName(teacherSubject));
                          if (idx >= 0) { updated[idx] = { ...updated[idx], totalMarks: val }; setEntryBooks(updated); }
                          else setEntryBooks([...entryBooks, { name: teacherSubject, totalMarks: val, obtainedMarks: '' }]);
                        }}
                        keyboardType="numeric"
                      />
                      <TextInput
                        style={{ flex: 1, height: scale(36), borderWidth: 1, borderRadius: scale(7), paddingHorizontal: scale(8), fontSize: scale(13), fontWeight: '800', textAlign: 'center', backgroundColor: theme.primary + '08', color: theme.primary, borderColor: theme.primary + '30' }}
                        placeholder="—"
                        placeholderTextColor={theme.primary + '60'}
                        value={book.obtainedMarks}
                        onChangeText={(val) => {
                          const updated = [...entryBooks];
                          const idx = updated.findIndex(b => normalizeSubjectName(b.name) === normalizeSubjectName(teacherSubject));
                          if (idx >= 0) { updated[idx] = { ...updated[idx], obtainedMarks: val }; setEntryBooks(updated); }
                          else setEntryBooks([...entryBooks, { name: teacherSubject, totalMarks: '', obtainedMarks: val }]);
                        }}
                        keyboardType="numeric"
                      />
                    </View>
                  ))}
                </View>`;

const NEW_UI = `              {/* ── Teacher View: multi-subject dropdown + marks inputs ── */}
              {isTeacher && selectedTeacherSubject ? (
                <View style={styles.teacherMarksPanel}>

                  {teacherSubjectsList.length > 1 ? (
                    <View>
                      <TouchableOpacity
                        ref={teacherSubjectAnchorRef}
                        onPress={() => {
                          setShowTeacherSubjectDropdown(prev => !prev);
                          setShowTitleDropdown(false);
                          setShowClassDropdown(false);
                          setShowCategoryDropdown(false);
                          setShowBookDropdown(false);
                          setShowStudentDropdown(false);
                        }}
                        activeOpacity={0.8}
                        style={[styles.teacherSubjectPill, { backgroundColor: theme.primary + '10', borderColor: showTeacherSubjectDropdown ? theme.primary : theme.primary + '30' }]}
                      >
                        <View style={[styles.teacherSubjectIcon, { backgroundColor: theme.primary + '16' }]}>
                          <Ionicons name="book-outline" size={14} color={theme.primary} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={[styles.teacherSubjectLabel, { color: theme.textSecondary }]}>Selected Subject</Text>
                          <Text style={[styles.teacherSubjectName, { color: theme.primary }]} numberOfLines={1}>{selectedTeacherSubject}</Text>
                        </View>
                        <Ionicons name={showTeacherSubjectDropdown ? 'chevron-up' : 'chevron-down'} size={14} color={theme.primary} />
                      </TouchableOpacity>
                      {showTeacherSubjectDropdown && (
                        <DropdownMenu
                          options={teacherSubjectsList.map((s: string) => ({ label: s, value: s, icon: 'book-outline' }))}
                          selectedValue={selectedTeacherSubject}
                          onSelect={(val) => { setSelectedTeacherSubject(val); setShowTeacherSubjectDropdown(false); }}
                          theme={theme}
                          zIndex={2000}
                          anchorRef={teacherSubjectAnchorRef}
                          onClose={() => setShowTeacherSubjectDropdown(false)}
                        />
                      )}
                    </View>
                  ) : (
                    <View style={[styles.teacherSubjectPill, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '25' }]}>
                      <View style={[styles.teacherSubjectIcon, { backgroundColor: theme.primary + '16' }]}>
                        <Ionicons name="book-outline" size={14} color={theme.primary} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.teacherSubjectLabel, { color: theme.textSecondary }]}>Selected Subject</Text>
                        <Text style={[styles.teacherSubjectName, { color: theme.primary }]} numberOfLines={1}>{selectedTeacherSubject}</Text>
                      </View>
                      <Ionicons name="lock-closed" size={13} color={theme.primary} />
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', paddingHorizontal: scale(2), marginTop: scale(8), marginBottom: scale(2) }}>
                    <Text style={{ flex: 2, fontSize: scale(9), fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4 }}>Subject</Text>
                    <Text style={{ flex: 1, fontSize: scale(9), fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center' }}>Total</Text>
                    <Text style={{ flex: 1, fontSize: scale(9), fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center' }}>Obtained</Text>
                  </View>

                  {[getTeacherSubjectBook()].map((book, index) => (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: scale(6) }}>
                      <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', height: scale(38), paddingHorizontal: scale(8), borderRadius: scale(7), borderWidth: 1, backgroundColor: theme.primary + '12', borderColor: theme.primary + '35' }}>
                        <Ionicons name="book" size={13} color={theme.primary} style={{ marginRight: scale(6) }} />
                        <Text style={{ fontSize: scale(13), fontWeight: '700', color: theme.primary, flex: 1 }} numberOfLines={1}>{book.name}</Text>
                        <Ionicons name="lock-closed" size={11} color={theme.primary + '60'} />
                      </View>
                      <TextInput
                        style={{ flex: 1, height: scale(38), borderWidth: 1, borderRadius: scale(7), padding: 0, fontSize: scale(14), fontWeight: '700', textAlign: 'center', backgroundColor: theme.card, color: theme.text, borderColor: theme.border }}
                        placeholder="—"
                        placeholderTextColor={theme.textTertiary || theme.textSecondary}
                        value={book.totalMarks}
                        onChangeText={(val) => updateTeacherSubjectBook('totalMarks', val.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        maxLength={4}
                      />
                      <TextInput
                        style={{ flex: 1, height: scale(38), borderWidth: 1, borderRadius: scale(7), padding: 0, fontSize: scale(14), fontWeight: '800', textAlign: 'center', backgroundColor: theme.primary + '08', color: theme.primary, borderColor: theme.primary + '40' }}
                        placeholder="—"
                        placeholderTextColor={theme.primary + '55'}
                        value={book.obtainedMarks}
                        onChangeText={(val) => updateTeacherSubjectBook('obtainedMarks', val.replace(/[^0-9]/g, ''))}
                        keyboardType="number-pad"
                        maxLength={4}
                      />
                    </View>
                  ))}
                </View>`;

if (c.includes(OLD_UI)) {
  c = c.replace(OLD_UI, NEW_UI);
  console.log('✓ Teacher UI replaced');
} else {
  console.log('⚠ Teacher UI pattern not found — may need manual check');
}

fs.writeFileSync(p, c, 'utf8');
console.log('Done. Lines:', c.split('\n').length);
