const fs = require('fs');
const path = require('path');

const files = ['Class9thExamsScreen.tsx', 'Class10thExamsScreen.tsx', 'Class1stYearExamsScreen.tsx', 'Class2ndYearExamsScreen.tsx', 'GenericExamsScreen.tsx'];

files.forEach(file => {
  const filePath = path.join('c:/Users/USER/Desktop/Mobile App Dev/TheSeeks Projects/TheSeeks-Teachers/src/screens/exams', file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Look for the exact block of text using substring
  const searchStr = `                  {/* Info banner for teacher */}
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
                  </View>`;

  const replacementStr = `                  {/* Info banner for teacher */}
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

  if (content.replace(/\r\n/g, '\n').includes(searchStr.replace(/\r\n/g, '\n'))) {
    content = content.replace(/\r\n/g, '\n').replace(searchStr.replace(/\r\n/g, '\n'), replacementStr.replace(/\r\n/g, '\n'));
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  } else {
    console.log(`Could not find target in ${file}`);
    
    // Fallback: try removing whitespace differences
    const compactSearch = searchStr.replace(/\\s+/g, '');
    const compactContent = content.replace(/\\s+/g, '');
    if (compactContent.includes(compactSearch)) {
        console.log(`Found it with compact search in ${file}, but didn't replace.`);
    }
  }
});
