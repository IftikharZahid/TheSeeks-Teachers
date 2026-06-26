const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\USER\\Desktop\\Mobile App Dev\\TheSeeks Projects\\TheSeeks-Teachers\\src\\screens\\exams';
const files = [
  'GenericExamsScreen.tsx',
  'Class9thExamsScreen.tsx',
  'Class10thExamsScreen.tsx',
  'Class1stYearExamsScreen.tsx',
  'Class2ndYearExamsScreen.tsx'
];

files.forEach(file => {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // --- KeyboardAvoidingView FIX ---
  if (!content.includes('KeyboardAvoidingView')) {
    content = content.replace(
      /import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Pressable, TextInput, Modal, Alert, ActivityIndicator, Platform, StatusBar, TouchableWithoutFeedback } from 'react-native';/,
      `import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Pressable, TextInput, Modal, Alert, ActivityIndicator, Platform, StatusBar, TouchableWithoutFeedback, KeyboardAvoidingView } from 'react-native';`
    );
    // There are some variations with a space before the comma in some files:
    content = content.replace(
      /import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Pressable, TextInput, Modal, Alert, ActivityIndicator, Platform , StatusBar} from 'react-native';/,
      `import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Pressable, TextInput, Modal, Alert, ActivityIndicator, Platform, StatusBar, TouchableWithoutFeedback, KeyboardAvoidingView } from 'react-native';`
    );
  }

  // Wrap the EDIT / ADD MODAL content in KeyboardAvoidingView
  content = content.replace(
    /<Modal visible={modalVisible} animationType="slide" transparent statusBarTranslucent>\s*<View style={{ flex: 1, backgroundColor: theme\.background }}>\s*<View style={{ flex: 1, paddingTop: Platform\.OS === 'ios' \? 48 : \(StatusBar\.currentHeight \|\| 30\) }}>/,
    `<Modal visible={modalVisible} animationType="slide" transparent statusBarTranslucent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="height">
          <View style={{ flex: 1, backgroundColor: theme.background }}>
            <View style={{ flex: 1, paddingTop: (StatusBar.currentHeight || 30) }}>`
  );

  // Close the KeyboardAvoidingView for EDIT / ADD MODAL
  content = content.replace(
    /<\/ScrollView>\s*<\/View>\s*<\/View>\s*<\/Modal>\s*{\/\* ══════════════════════════════════════════════════════════════════════\s*CHOICE MODAL/,
    `            </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          CHOICE MODAL`
  );

  // --- MULTIPLE SUBJECTS FIX ---
  content = content.replace(
    /canAddExamForSubject: \(\s*bookName: string,\s*isTeacher: boolean,\s*teacherSubject: string\s*\): AuthorizationError => {[\s\S]*?return { isUnauthorized: false, message: '' };\s*},/,
    `canAddExamForSubject: (
    bookName: string,
    isTeacher: boolean,
    teacherSubjectsList: string[]
  ): AuthorizationError => {
    if (!isTeacher) return { isUnauthorized: false, message: '' };

    const normalizedBook = normalizeSubjectName(bookName);
    const isAllowed = teacherSubjectsList.some(s => normalizeSubjectName(s) === normalizedBook);

    if (!isAllowed) {
      return {
        isUnauthorized: true,
        message: \`You can only add exam records for your assigned subjects.\`,
      };
    }

    return { isUnauthorized: false, message: '' };
  },`
  );

  content = content.replace(
    /const teacherSubject = profile\?\.subject \|\| profile\?\.class \|\| profile\?\.booktitle \|\| profile\?\.bookTitle \|\| '';/,
    `const teacherSubjectStr = profile?.subject || profile?.class || profile?.booktitle || profile?.bookTitle || '';
  const teacherSubjectsList = useMemo(() => {
    return profile?.subjects || (teacherSubjectStr ? teacherSubjectStr.split(',').map((s: string) => s.trim()) : []);
  }, [profile, teacherSubjectStr]);
  const defaultTeacherSubject = teacherSubjectsList.length > 0 ? teacherSubjectsList[0] : teacherSubjectStr;`
  );

  content = content.replace(
    /const \[title, setTitle\] = useState\(''\);/,
    `const [selectedTeacherSubject, setSelectedTeacherSubject] = useState<string>(defaultTeacherSubject);
  const [showTeacherSubjectDropdown, setShowTeacherSubjectDropdown] = useState(false);
  const teacherSubjectAnchorRef = useRef<View | null>(null);

  useEffect(() => {
    if (!selectedTeacherSubject && defaultTeacherSubject) {
      setSelectedTeacherSubject(defaultTeacherSubject);
    }
  }, [defaultTeacherSubject, selectedTeacherSubject]);

  const [title, setTitle] = useState('');`
  );

  content = content.replace(
    /setShowCategoryDropdown\(false\);/,
    `setShowCategoryDropdown(false);
    setShowTeacherSubjectDropdown(false);`
  );

  content = content.replace(
    /showTitleDropdown \|\| showClassDropdown \|\| showBookDropdown \|\| showStudentDropdown \|\| showCategoryDropdown;/,
    `showTitleDropdown || showClassDropdown || showBookDropdown || showStudentDropdown || showCategoryDropdown || showTeacherSubjectDropdown;`
  );

  content = content.replace(
    /const getTeacherSubjectBook = \(\): BookEntry => {\s*const subject = teacherSubject\.trim\(\);/,
    `const getTeacherSubjectBook = (): BookEntry => {
    const subject = selectedTeacherSubject.trim();`
  );

  content = content.replace(
    /const updateTeacherSubjectBook = \(field: 'totalMarks' \| 'obtainedMarks', value: string\) => {\s*if \(\!teacherSubject\.trim\(\)\) return;\s*setEntryBooks\(prev => {\s*const subject = teacherSubject\.trim\(\);/,
    `const updateTeacherSubjectBook = (field: 'totalMarks' | 'obtainedMarks', value: string) => {
    if (!selectedTeacherSubject.trim()) return;

    setEntryBooks(prev => {
      const subject = selectedTeacherSubject.trim();`
  );

  content = content.replace(
    /const scopedEntryBooks = isTeacher && teacherSubject\s*\?\s*entryBooks\.filter\(book => normalizeSubjectName\(book\.name\) === normalizeSubjectName\(teacherSubject\)\)\s*:\s*entryBooks;/,
    `const scopedEntryBooks = isTeacher && teacherSubjectsList.length > 0
      ? entryBooks.filter(book => teacherSubjectsList.some(s => normalizeSubjectName(s) === normalizeSubjectName(book.name)))
      : entryBooks;`
  );

  content = content.replace(
    /AUTHORIZATION\.canAddExamForSubject\(\s*book\.name,\s*isTeacher,\s*teacherSubject\s*\)/g,
    `AUTHORIZATION.canAddExamForSubject(
            book.name,
            isTeacher,
            teacherSubjectsList
          )`
  );
  content = content.replace(
    /AUTHORIZATION\.canAddExamForSubject\(\s*bookName,\s*isTeacher,\s*teacherSubject\s*\)/g,
    `AUTHORIZATION.canAddExamForSubject(
          bookName,
          isTeacher,
          teacherSubjectsList
        )`
  );
  
  content = content.replace(
    /if \(isTeacher && teacherSubject\) {\s*const normalizedBook = bookToRemove\.name\.trim\(\)\.toLowerCase\(\)\.replace\(\/_\/g, ' '\);\s*const normalizedSubject = teacherSubject\.trim\(\)\.toLowerCase\(\)\.replace\(\/_\/g, ' '\);\s*if \(normalizedBook !== normalizedSubject\) {\s*Alert\.alert\([\s\S]*?return;\s*}\s*}/,
    `if (isTeacher && teacherSubjectsList.length > 0) {
      const normalizedBook = bookToRemove.name.trim().toLowerCase().replace(/_/g, ' ');
      const isAllowed = teacherSubjectsList.some(s => s.trim().toLowerCase().replace(/_/g, ' ') === normalizedBook);
      
      if (!isAllowed) {
        Alert.alert(
          'Authorization Error',
          \`You can only modify exam records for your assigned subjects.\`
        );
        return;
      }
    }`
  );
  
  content = content.replace(
    /setCurrentBookName\(isTeacher && teacherSubject \? teacherSubject : ''\);/,
    `setCurrentBookName(isTeacher && selectedTeacherSubject ? selectedTeacherSubject : '');`
  );
  
  content = content.replace(
    /if \(isTeacher && teacherSubject\) {\s*setCurrentBookName\(teacherSubject\);\s*}/,
    `if (isTeacher && selectedTeacherSubject) {
      setCurrentBookName(selectedTeacherSubject);
    }`
  );
  
  content = content.replace(
    /{isTeacher && teacherSubject && \(\s*<View style={{ marginLeft: 'auto'[\s\S]*?Restricted to {teacherSubject}<\/Text>\s*<\/View>\s*\)}/,
    `{isTeacher && selectedTeacherSubject && (
                  <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary + '12', paddingHorizontal: scale(8), paddingVertical: scale(3), borderRadius: scale(10) }}>
                    <Ionicons name="lock-closed" size={10} color={theme.primary} style={{ marginRight: scale(3) }} />
                    <Text style={{ fontSize: scale(9), fontWeight: '700', color: theme.primary, textTransform: 'uppercase', letterSpacing: 0.3 }}>Restricted</Text>
                  </View>
                )}`
  );

  content = content.replace(
    /{\/\* ── Teacher View: Single locked subject with direct mark inputs ── \*\/}\s*{isTeacher && teacherSubject \? \(\s*<View style={styles\.teacherMarksPanel}>\s*{\/\* Info banner for teacher \*\/}\s*<View style=\[styles\.teacherSubjectPill, { backgroundColor: theme\.primary \+ '10', borderColor: theme\.primary \+ '25' }\]>\s*<View style=\[styles\.teacherSubjectIcon, { backgroundColor: theme\.primary \+ '16' }\]>\s*<Ionicons name="book-outline" size={14} color={theme\.primary} \/>\s*<\/View>\s*<View style={{ flex: 1, minWidth: 0 }}>\s*<Text style=\[styles\.teacherSubjectLabel, { color: theme\.textSecondary }\]>Selected Subject<\/Text>\s*<Text style=\[styles\.teacherSubjectName, { color: theme\.primary }\] numberOfLines={1}>\s*{teacherSubject}\s*<\/Text>\s*<\/View>\s*<Ionicons name="lock-closed" size={13} color={theme\.primary} \/>\s*<\/View>/,
    `{/* ── Teacher View: Single locked subject with direct mark inputs ── */}
              {isTeacher && selectedTeacherSubject ? (
                <View style={styles.teacherMarksPanel}>
                  {/* Info banner for teacher */}
                  <View style={[styles.teacherSubjectPill, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '25', zIndex: 3000 }]}>
                    <View style={[styles.teacherSubjectIcon, { backgroundColor: theme.primary + '16' }]}>
                      <Ionicons name="book-outline" size={14} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.teacherSubjectLabel, { color: theme.textSecondary }]}>Selected Subject</Text>
                      {teacherSubjectsList.length > 1 ? (
                        <TouchableOpacity
                          ref={teacherSubjectAnchorRef}
                          onPress={() => {
                            setShowTeacherSubjectDropdown(!showTeacherSubjectDropdown);
                            closeAllDropdowns();
                          }}
                          style={{ flexDirection: 'row', alignItems: 'center' }}
                        >
                          <Text style={[styles.teacherSubjectName, { color: theme.primary }]} numberOfLines={1}>
                            {selectedTeacherSubject}
                          </Text>
                          <Ionicons name={showTeacherSubjectDropdown ? "chevron-up" : "chevron-down"} size={14} color={theme.primary} style={{ marginLeft: scale(4) }} />
                        </TouchableOpacity>
                      ) : (
                        <Text style={[styles.teacherSubjectName, { color: theme.primary }]} numberOfLines={1}>
                          {selectedTeacherSubject}
                        </Text>
                      )}
                    </View>
                    {teacherSubjectsList.length <= 1 && <Ionicons name="lock-closed" size={13} color={theme.primary} />}
                  </View>

                  {/* Dropdown for Teacher Subjects */}
                  {showTeacherSubjectDropdown && teacherSubjectsList.length > 1 && (
                    <DropdownMenu
                      options={teacherSubjectsList.map(s => ({
                        label: s,
                        value: s,
                        icon: 'book-outline',
                      }))}
                      selectedValue={selectedTeacherSubject}
                      onSelect={(val) => {
                        setSelectedTeacherSubject(val);
                        setShowTeacherSubjectDropdown(false);
                      }}
                      theme={theme}
                      zIndex={3000}
                      anchorRef={teacherSubjectAnchorRef}
                      onClose={() => setShowTeacherSubjectDropdown(false)}
                    />
                  )}`
  );

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Successfully completed fix script.');
