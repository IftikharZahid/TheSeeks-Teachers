const fs = require('fs');

// ─── Fix ClassDiaryScreen ───────────────────────────────────────────────────
{
  const file = 'ClassDiaryScreen.tsx';
  let content = fs.readFileSync(file, 'utf8');

  // 1. Add StatusBar.currentHeight to container style
  content = content.replace(
    /container:\s*\{\s*flex:\s*1\s*\}/,
    'container: { flex: 1, paddingTop: StatusBar.currentHeight || 0 }'
  );

  // 2. Fix the modal: transparent={true} + statusBarTranslucent → transparent={false}
  content = content.replace(
    `<Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent={true}
      >
        <View style={{ flex: 1, backgroundColor: theme.card }}>
          <View style={{ flex: 1 }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior="height"
            keyboardVerticalOffset={0}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.card, flex: 1 }]}>
              {renderModalContent()}
            </View>
          </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>`,
    `<Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: theme.card }}
          behavior="height"
          keyboardVerticalOffset={0}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card, flex: 1 }]}>
            {renderModalContent()}
          </View>
        </KeyboardAvoidingView>
      </Modal>`
  );

  // 3. Fix the modal header: replace old small-icon header with modern colored header
  content = content.replace(
    `      {/* Header */}
      <View style={[styles.modalHeader, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
        <View style={styles.modalHeaderLeft}>
          <View style={[styles.modalIconWrap, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
            <Ionicons name={editingEntryId ? 'pencil' : 'book'} size={scale(15)} color="#6366f1" />
          </View>
          <View>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingEntryId ? 'Edit Entry' : 'New Diary Entry'}
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>{selectedClass}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}
          onPress={() => { setModalVisible(false); setEditingEntryId(null); setTitle(''); setDetails(''); setShowSubjectPicker(false); }}
        >
          <Ionicons name="close" size={scale(17)} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>`,
    `      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(16), paddingVertical: scale(12), backgroundColor: '#6366f1' }}>
        <TouchableOpacity
          style={{ width: scale(36), height: scale(36), borderRadius: scale(18), backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: scale(12) }}
          onPress={() => { setModalVisible(false); setEditingEntryId(null); setTitle(''); setDetails(''); setShowSubjectPicker(false); }}
        >
          <Ionicons name="arrow-back" size={scale(20)} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.modalTitle, { color: '#fff' }]}>
            {editingEntryId ? 'Edit Entry' : 'New Diary Entry'}
          </Text>
          <Text style={[styles.modalSubtitle, { color: 'rgba(255,255,255,0.75)' }]}>{selectedClass}</Text>
        </View>
        <TouchableOpacity
          style={{ paddingHorizontal: scale(14), paddingVertical: scale(8), borderRadius: scale(20), backgroundColor: 'rgba(255,255,255,0.2)', flexDirection: 'row', alignItems: 'center', gap: scale(4) }}
          onPress={handleSave}
        >
          <Ionicons name="checkmark" size={scale(16)} color="#fff" />
          <Text style={{ fontSize: scale(12), fontWeight: '700', color: '#fff' }}>Save</Text>
        </TouchableOpacity>
      </View>`
  );

  fs.writeFileSync(file, content);
  console.log('✅ Fixed ClassDiaryScreen.tsx');
}

// ─── Fix TeacherAssignmentsScreen ───────────────────────────────────────────
const assignFile = '../academics/TeacherAssignmentsScreen.tsx';
{
  let content = fs.readFileSync(assignFile, 'utf8');

  // 1. Fix modal transparent + statusBarTranslucent  
  content = content.replace(
    `<Modal visible={showModal} transparent={true} animationType="slide" onRequestClose={() => setShowModal(false)} statusBarTranslucent={true}>
        <View style={{ flex: 1, backgroundColor: theme.card }}>
          <View style={{ flex: 1 }}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior="height" keyboardVerticalOffset={0}>
              <View style={[styles.modalContentFullScreen, { backgroundColor: theme.card }]}>
                <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Add Assignment</Text>
                  <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
                    <Ionicons name="close" size={scale(24)} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>`,
    `<Modal visible={showModal} transparent={false} animationType="slide" onRequestClose={() => setShowModal(false)}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.primary} />
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.card }} behavior="height" keyboardVerticalOffset={0}>
          <View style={[styles.modalContentFullScreen, { backgroundColor: theme.card }]}>
            {/* Modern Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(16), paddingVertical: scale(12), backgroundColor: theme.primary }}>
              <TouchableOpacity
                style={{ width: scale(36), height: scale(36), borderRadius: scale(18), backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: scale(12) }}
                onPress={() => setShowModal(false)}
              >
                <Ionicons name="arrow-back" size={scale(20)} color="#fff" />
              </TouchableOpacity>
              <Text style={{ flex: 1, fontSize: scale(17), fontWeight: '800', color: '#fff' }}>Add Assignment</Text>
              <TouchableOpacity
                style={{ paddingHorizontal: scale(14), paddingVertical: scale(8), borderRadius: scale(20), backgroundColor: 'rgba(255,255,255,0.2)', flexDirection: 'row', alignItems: 'center', gap: scale(4) }}
                onPress={handleSave}
                disabled={saving}
              >
                <Ionicons name="checkmark" size={scale(16)} color="#fff" />
                <Text style={{ fontSize: scale(12), fontWeight: '700', color: '#fff' }}>{saving ? '...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>`
  );

  // 2. Fix the closing tag mismatch caused by removing the extra <View> wrappers
  content = content.replace(
    `              </View>\r\n            </View>\r\n          </KeyboardAvoidingView>\r\n        </View>\r\n      </View>\r\n      </Modal>`,
    `              </View>\r\n          </KeyboardAvoidingView>\r\n      </Modal>`
  );

  // Also try LF version
  content = content.replace(
    `              </View>\n            </View>\n          </KeyboardAvoidingView>\n        </View>\n      </View>\n      </Modal>`,
    `              </View>\n          </KeyboardAvoidingView>\n      </Modal>`
  );

  fs.writeFileSync(assignFile, content);
  console.log('✅ Fixed TeacherAssignmentsScreen.tsx');
}
