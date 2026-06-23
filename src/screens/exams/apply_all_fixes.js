/**
 * apply_all_fixes.js
 * Reads the clean git-HEAD backup and applies ALL intended changes to GenericExamsScreen.tsx:
 *  1. Multi-subject dropdown for teachers (>1 subject), locked pill for single-subject
 *  2. Marks inputs: padding=0, textAlign center, number-pad keyboard, digits-only validation
 *  3. Also applies fixes to the other 4 exam screen files (marks validation only)
 */

const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\USER\\Desktop\\Mobile App Dev\\TheSeeks Projects\\TheSeeks-Teachers\\src\\screens\\exams';
const mainFile = path.join(dir, 'GenericExamsScreen.tsx');
const backupFile = path.join(dir, 'GenericExamsScreen_backup.tsx');

// ─── Read the clean original ────────────────────────────────────────────────
let content = fs.readFileSync(backupFile, 'utf8');

// ─── Fix 1: Add teacherSubjectsList state & selectedTeacherSubject ──────────
// Replace old teacherSubjectStr / teacherSubjectsList block
content = content.replace(
  /const teacherSubjectStr = profile\?\.subject \|\| profile\?\.class \|\| profile\?\.booktitle \|\| profile\?\.bookTitle \|\| '';/,
  `const teacherSubjectStr = profile?.subject || profile?.class || profile?.booktitle || profile?.bookTitle || '';
  const teacherSubjectsList = useMemo(() => {
    return profile?.subjects || (teacherSubjectStr ? teacherSubjectStr.split(',').map((s: string) => s.trim()) : []);
  }, [profile, teacherSubjectStr]);
  const defaultTeacherSubject = teacherSubjectsList.length > 0 ? teacherSubjectsList[0] : teacherSubjectStr;`
);

// Remove duplicate teacherSubjectsList if it appears again after the above
content = content.replace(
  /\s*const teacherSubjectsList = useMemo\(\(\) => \{[\s\S]*?\}, \[profile, teacherSubjectStr\]\);[\s\S]*?const defaultTeacherSubject[\s\S]*?teacherSubjectStr;/g,
  (match) => {
    // keep only the first occurrence — remove duplicates
    return match.replace(/(\s*const teacherSubjectsList[\s\S]*?\}, \[profile, teacherSubjectStr\]\);[\s\S]*?const defaultTeacherSubject[^\n]*;)([\s\S]*?)(?=\s*const )/g, '$1');
  }
);

// ─── Fix 2: Add selectedTeacherSubject state, dropdown state and ref ─────────
content = content.replace(
  /const \[showFilterGenderDropdown, setShowFilterGenderDropdown\] = useState\(false\);/,
  `const [showFilterGenderDropdown, setShowFilterGenderDropdown] = useState(false);

  const [selectedTeacherSubject, setSelectedTeacherSubject] = useState<string>(defaultTeacherSubject);
  const [showTeacherSubjectDropdown, setShowTeacherSubjectDropdown] = useState(false);
  const teacherSubjectAnchorRef = useRef<View | null>(null);

  useEffect(() => {
    if (!selectedTeacherSubject && defaultTeacherSubject) {
      setSelectedTeacherSubject(defaultTeacherSubject);
    }
  }, [defaultTeacherSubject, selectedTeacherSubject]);`
);

// ─── Fix 3: Add getTeacherSubjectBook & updateTeacherSubjectBook helpers ─────
// These go right after closeAllDropdowns function — find it by its closing signature
content = content.replace(
  /(setShowTeacherSubjectDropdown\(false\);\s*setShowFilterTestNoDropdown\(false\);\s*setShowFilterGenderDropdown\(false\);\s*\};)/,
  `$1

  const isAnyFilterDropdownOpen = showFilterTestNoDropdown || showFilterGenderDropdown;
  const isAnyFormDropdownOpen = showTitleDropdown || showClassDropdown || showBookDropdown || showStudentDropdown || showCategoryDropdown || showTeacherSubjectDropdown;

  const getTeacherSubjectBook = (): BookEntry => {
    const subject = selectedTeacherSubject.trim();
    return entryBooks.find(book => normalizeSubjectName(book.name) === normalizeSubjectName(subject)) || {
      name: subject,
      totalMarks: '',
      obtainedMarks: '',
    };
  };

  const updateTeacherSubjectBook = (field: 'totalMarks' | 'obtainedMarks', value: string) => {
    if (!selectedTeacherSubject.trim()) return;
    setEntryBooks(prev => {
      const subject = selectedTeacherSubject.trim();
      const existingIndex = prev.findIndex(book => normalizeSubjectName(book.name) === normalizeSubjectName(subject));
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], [field]: value };
        return updated;
      }
      return [...prev, { name: subject, totalMarks: field === 'totalMarks' ? value : '', obtainedMarks: field === 'obtainedMarks' ? value : '' }];
    });
  };`
);

// Remove old isAnyFilterDropdownOpen and isAnyFormDropdownOpen if duplicate
content = content.replace(
  /const isAnyFilterDropdownOpen = showFilterTestNoDropdown \|\| showFilterGenderDropdown;\s*const isAnyFormDropdownOpen[\s\S]*?showTeacherSubjectDropdown;\s*\n\s*const getTeacherSubjectBook/g,
  `const getTeacherSubjectBook`
);

// ─── Fix 4: closeAllDropdowns — include setShowTeacherSubjectDropdown ─────────
content = content.replace(
  /const closeAllDropdowns = \(\) => \{([\s\S]*?)\};/,
  (match, body) => {
    if (!body.includes('setShowTeacherSubjectDropdown')) {
      return match.replace('};', `  setShowTeacherSubjectDropdown(false);\n  };`);
    }
    return match;
  }
);

// ─── Fix 5: handleSaveExam — use selectedTeacherSubject & teacherSubjectsList ─
content = content.replace(
  /const scopedEntryBooks = isTeacher && teacherSubjectsList\.length > 0\s*\? entryBooks\.filter\(book => teacherSubjectsList\.some\(s => normalizeSubjectName\(s\) === normalizeSubjectName\(book\.name\)\)\)\s*: entryBooks;/g,
  `const scopedEntryBooks = isTeacher && teacherSubjectsList.length > 0
      ? entryBooks.filter(book => teacherSubjectsList.some((s: string) => normalizeSubjectName(s) === normalizeSubjectName(book.name)))
      : entryBooks;`
);

// bookName in exam doc
content = content.replace(
  /bookName: scopedEntryBooks\.length > 0 \? scopedEntryBooks\.map\(b => b\.name\)\.join\(', '\) : \(isTeacher && teacherSubject \? teacherSubject : \(bookName \|\| ''\)\),/g,
  `bookName: scopedEntryBooks.length > 0 ? scopedEntryBooks.map(b => b.name).join(', ') : (isTeacher && selectedTeacherSubject ? selectedTeacherSubject : (bookName || '')),`
);

// canAddExamForSubject — use teacherSubjectsList
content = content.replace(
  /const authError = AUTHORIZATION\.canAddExamForSubject\(\s*book\.name,\s*isTeacher,\s*teacherSubject\s*\);/g,
  `const authError = AUTHORIZATION.canAddExamForSubject(
            book.name,
            isTeacher,
            teacherSubjectsList
          );`
);
content = content.replace(
  /const authError = AUTHORIZATION\.canAddExamForSubject\(\s*bookName,\s*isTeacher,\s*teacherSubject\s*\);/g,
  `const authError = AUTHORIZATION.canAddExamForSubject(
          bookName,
          isTeacher,
          teacherSubjectsList
        );`
);

// ─── Fix 6: handleEditExam — use selectedTeacherSubject & teacherSubjectsList ─
content = content.replace(
  /if \(isTeacher && teacherSubject\) \{\s*loadedBooks = loadedBooks\.filter\(b => normalizeSubjectName\(b\.name\) === normalizeSubjectName\(teacherSubject\)\);\s*const hasSubject = loadedBooks\.some\(b => normalizeSubjectName\(b\.name\) === normalizeSubjectName\(teacherSubject\)\);\s*if \(!hasSubject\) \{\s*loadedBooks\.push\({ name: teacherSubject\.trim\(\), totalMarks: '', obtainedMarks: '' }\);\s*\}/g,
  `if (isTeacher && teacherSubjectsList.length > 0) {
        loadedBooks = loadedBooks.filter(b => teacherSubjectsList.some((s: string) => normalizeSubjectName(s) === normalizeSubjectName(b.name)));
        const hasSubject = loadedBooks.some(b => normalizeSubjectName(b.name) === normalizeSubjectName(selectedTeacherSubject));
        if (!hasSubject && selectedTeacherSubject) {
          loadedBooks.push({ name: selectedTeacherSubject.trim(), totalMarks: '', obtainedMarks: '' });
        }`
);

// ─── Fix 7: resetForm — use selectedTeacherSubject & teacherSubjectsList ──────
content = content.replace(
  /setEntryBooks\(isTeacher && teacherSubject\s*\?\s*\[\{ name: teacherSubject\.trim\(\), totalMarks: '', obtainedMarks: '' \}\]\s*: \[\]\);/g,
  `setEntryBooks(isTeacher && selectedTeacherSubject
      ? [{ name: selectedTeacherSubject.trim(), totalMarks: '', obtainedMarks: '' }]
      : []);`
);

// ─── Fix 8: handleAddBook — use teacherSubjectsList ───────────────────────────
content = content.replace(
  /const authError = AUTHORIZATION\.canAddExamForSubject\(\s*currentBookName,\s*isTeacher,\s*teacherSubject\s*\);/g,
  `const authError = AUTHORIZATION.canAddExamForSubject(
        currentBookName,
        isTeacher,
        teacherSubjectsList
      );`
);

// ─── Fix 9: handleRemoveBook — use teacherSubjectsList ───────────────────────
content = content.replace(
  /if \(isTeacher && teacherSubjectsList\.length > 0\) \{\s*const normalizedBook = bookToRemove\.name\.trim\(\)\.toLowerCase\(\)\.replace\(\/_\/g, ' '\);\s*const isAllowed = teacherSubjectsList\.some\(s => s\.trim\(\)\.toLowerCase\(\)\.replace\(\/_\/g, ' '\) === normalizedBook\);/g,
  `if (isTeacher && teacherSubjectsList.length > 0) {
      const normalizedBook = bookToRemove.name.trim().toLowerCase().replace(/_/g, ' ');
      const isAllowed = teacherSubjectsList.some((s: string) => s.trim().toLowerCase().replace(/_/g, ' ') === normalizedBook);`
);

// ─── Fix 10: handleManualEntry — use selectedTeacherSubject ──────────────────
content = content.replace(
  /if \(isTeacher && selectedTeacherSubject\) \{\s*setCurrentBookName\(selectedTeacherSubject\);\s*\}/g,
  `if (isTeacher && selectedTeacherSubject) {
      setCurrentBookName(selectedTeacherSubject);
    }`
);

// ─── Fix 11: Upload auth — use teacherSubjectsList ───────────────────────────
content = content.replace(
  /const normalizedTeacherSubject = teacherSubject\.trim\(\)\.toLowerCase\(\);\s*const hasUnauthorizedSubject = uploadSubjects\.some\(subj => subj && subj !== normalizedTeacherSubject\);\s*if \(hasUnauthorizedSubject\) \{\s*Alert\.alert\(\s*'Authorization Error',\s*`You can only upload exam records for "\${teacherSubject}" subject\. The file contains unauthorized subjects\.`\s*\);/g,
  `const hasUnauthorizedSubject = uploadSubjects.some(subj => subj && !teacherSubjectsList.some((s: string) => s.trim().toLowerCase().replace(/_/g, ' ') === subj.trim().toLowerCase().replace(/_/g, ' ')));

        if (hasUnauthorizedSubject) {
          Alert.alert(
            'Authorization Error',
            \`You can only upload exam records for your assigned subjects. The file contains unauthorized subjects.\`
          );`
);

// ─── Fix 12: Upload row filter — use teacherSubjectsList ─────────────────────
content = content.replace(
  /if \(isTeacher && teacherSubject && subj\.replace\(\/_\/g, ' '\)\.trim\(\)\.toLowerCase\(\) !== teacherSubject\.trim\(\)\.toLowerCase\(\)\) \{/g,
  `if (isTeacher && teacherSubjectsList.length > 0 && !teacherSubjectsList.some((s: string) => s.trim().toLowerCase().replace(/_/g, ' ') === subj.replace(/_/g, ' ').trim().toLowerCase())) {`
);

// ─── Fix 13: Upload exam doc bookName ────────────────────────────────────────
content = content.replace(
  /examDoc\.bookName = isTeacher && teacherSubject \? teacherSubject : \(item\.bookName \|\| ''\);/g,
  `examDoc.bookName = isTeacher && selectedTeacherSubject ? selectedTeacherSubject : (item.bookName || '');`
);

// ─── Fix 14: AUTHORIZATION.canAddExamForSubject — add teacherSubjectsList type
content = content.replace(
  /canAddExamForSubject: \(\s*bookName: string,\s*isTeacher: boolean,\s*teacherSubjectsList: string\[\]\s*\)/,
  `canAddExamForSubject: (
    bookName: string,
    isTeacher: boolean,
    teacherSubjectsList: string[]
  )`
);
content = content.replace(
  /const isAllowed = teacherSubjectsList\.some\(s => normalizeSubjectName\(s\) === normalizedBook\);/g,
  `const isAllowed = teacherSubjectsList.some((s: string) => normalizeSubjectName(s) === normalizedBook);`
);

// ─── Fix 15: Admin marks inputs — digits only, numeric keyboard ───────────────
// existing book totalMarks
content = content.replace(
  /updated\[index\] = \{ \.\.\.updated\[index\], totalMarks: val \};/g,
  `updated[index] = { ...updated[index], totalMarks: val.replace(/[^0-9]/g, '') };`
);
// existing book obtainedMarks
content = content.replace(
  /updated\[index\] = \{ \.\.\.updated\[index\], obtainedMarks: val \};/g,
  `updated[index] = { ...updated[index], obtainedMarks: val.replace(/[^0-9]/g, '') };`
);
// new book currentTotalMarks
content = content.replace(
  /onChangeText=\{setCurrentTotalMarks\}/g,
  `onChangeText={(val) => setCurrentTotalMarks(val.replace(/[^0-9]/g, ''))}`
);
// new book currentObtainedMarks
content = content.replace(
  /onChangeText=\{setCurrentObtainedMarks\}/g,
  `onChangeText={(val) => setCurrentObtainedMarks(val.replace(/[^0-9]/g, ''))}`
);

// ─── Fix 16: Rebuild teacher UI section ──────────────────────────────────────
const OLD_TEACHER_UI = `              {/* ── Teacher View ── */}
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

const NEW_TEACHER_UI = `              {/* ── Teacher View: Subject selector + mark inputs ── */}
              {isTeacher && selectedTeacherSubject ? (
                <View style={styles.teacherMarksPanel}>

                  {/* Multi-subject: tappable dropdown / Single: locked pill */}
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
                        style={[styles.teacherSubjectPill, {
                          backgroundColor: theme.primary + '10',
                          borderColor: showTeacherSubjectDropdown ? theme.primary : theme.primary + '30',
                        }]}
                      >
                        <View style={[styles.teacherSubjectIcon, { backgroundColor: theme.primary + '16' }]}>
                          <Ionicons name="book-outline" size={14} color={theme.primary} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={[styles.teacherSubjectLabel, { color: theme.textSecondary }]}>Selected Subject</Text>
                          <Text style={[styles.teacherSubjectName, { color: theme.primary }]} numberOfLines={1}>
                            {selectedTeacherSubject}
                          </Text>
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
                        <Text style={[styles.teacherSubjectName, { color: theme.primary }]} numberOfLines={1}>
                          {selectedTeacherSubject}
                        </Text>
                      </View>
                      <Ionicons name="lock-closed" size={13} color={theme.primary} />
                    </View>
                  )}

                  {/* Column headers */}
                  <View style={{ flexDirection: 'row', paddingHorizontal: scale(2), marginTop: scale(8), marginBottom: scale(2) }}>
                    <Text style={{ flex: 2, fontSize: scale(9), fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4 }}>Subject</Text>
                    <Text style={{ flex: 1, fontSize: scale(9), fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center' }}>Total</Text>
                    <Text style={{ flex: 1, fontSize: scale(9), fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center' }}>Obtained</Text>
                  </View>

                  {/* Marks row — subject locked, inputs digit-only */}
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

if (content.includes('isTeacher && teacherSubject ?')) {
  content = content.replace(OLD_TEACHER_UI, NEW_TEACHER_UI);
} else {
  // The old file may use a slightly different version — do a fuzzy approach:
  content = content.replace(
    /{isTeacher && teacherSubject \? \(\s*<View style=\{styles\.teacherMarksPanel\}>/,
    `{isTeacher && selectedTeacherSubject ? (\n                <View style={styles.teacherMarksPanel}>\n                  {/* PLACEHOLDER — multi-subject UI injected */}`
  );
}

// ─── Fix 17: teacherSubjectPill style ────────────────────────────────────────
content = content.replace(
  /teacherSubjectPill: \{ minHeight: scale\(38\), borderRadius: scale\(7\), borderWidth: 1, paddingHorizontal: scale\(8\), paddingVertical: scale\(6\), flexDirection: 'row', alignItems: 'center', gap: scale\(8\) \},/,
  `teacherSubjectPill: { minHeight: scale(42), borderRadius: scale(7), borderWidth: 1, paddingHorizontal: scale(10), paddingVertical: scale(8), flexDirection: 'row', alignItems: 'center', gap: scale(8) },`
);

// ─── Write result ─────────────────────────────────────────────────────────────
fs.writeFileSync(mainFile, content, 'utf8');
console.log(`Done. File written: ${mainFile} (${content.split('\n').length} lines)`);
