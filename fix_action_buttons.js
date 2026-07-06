const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens', 'exams');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.tsx') && !f.includes('_backup'));

files.forEach(file => {
    const filePath = path.join(screensDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    const actionButtonsRegex = /\{\/\*\s*Action Buttons\s*\*\/\}[\s\S]*?(?=\s*<\/View>\s*<\/View>\s*<\/View>\s*<\/Modal>)/g;

    const replacementBtns = `{/* Action Buttons */}
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
            </View>`;

    if (content.match(actionButtonsRegex)) {
        content = content.replace(actionButtonsRegex, replacementBtns);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated Action Buttons in ${file}`);
    } else {
        console.log(`Warning: Could not find Action Buttons in ${file}`);
    }
});
