const fs = require('fs');
const path = require('path');

const files = ['GenericExamsScreen.tsx', 'Class9thExamsScreen.tsx', 'Class10thExamsScreen.tsx', 'Class1stYearExamsScreen.tsx', 'Class2ndYearExamsScreen.tsx'];

files.forEach(file => {
  const filePath = path.join('c:/Users/USER/Desktop/Mobile App Dev/TheSeeks Projects/TheSeeks-Teachers/src/screens/exams', file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Find the Teacher Marks Panel Pill
  const targetRegex = /{\/\* Info banner for teacher \*\/}\s*<View style=\[styles\.teacherSubjectPill, { backgroundColor: theme\.primary \+ '10', borderColor: theme\.primary \+ '25' }\]>\s*<View style=\[styles\.teacherSubjectIcon, { backgroundColor: theme\.primary \+ '16' }\]>\s*<Ionicons name="book-outline" size={14} color={theme\.primary} \/>\s*<\/View>\s*<View style={{ flex: 1, minWidth: 0 }}>\s*<Text style=\[styles\.teacherSubjectLabel, { color: theme\.textSecondary }\]>Selected Subject<\/Text>\s*<Text style=\[styles\.teacherSubjectName, { color: theme\.primary }\] numberOfLines={1}>\s*{selectedTeacherSubject}\s*<\/Text>\s*<\/View>\s*<Ionicons name="lock-closed" size={13} color={theme\.primary} \/>\s*<\/View>/g;

  const replacement = `{/* Info banner for teacher */}
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
                          <Ionicons name={showTeacherSubjectDropdown ? "chevron-up" : "chevron-down"} size={14} color={theme.primary} style={{ marginLeft: 4 }} />
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
                      options={teacherSubjectsList.map((s: string) => ({
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
                  )}`;

  if (content.match(targetRegex)) {
    content = content.replace(targetRegex, replacement);
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  } else {
    console.log(`Could not find target in ${file}`);
  }
});
