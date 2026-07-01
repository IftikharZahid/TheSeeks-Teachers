const fs = require('fs');

const files = [
  { name: 'GenericExamsScreen.tsx', hasFooter: true },
  { name: 'Class9thExamsScreen.tsx', hasFooter: false },
  { name: 'Class10thExamsScreen.tsx', hasFooter: false },
  { name: 'Class1stYearExamsScreen.tsx', hasFooter: false },
  { name: 'Class2ndYearExamsScreen.tsx', hasFooter: false },
];

// ─── Fix GenericExamsScreen (has a footer outside ScrollView) ───────────────
function fixGeneric(content) {
  // 1. Fix the modal opening + wrapper structure
  const oldModalOpen = `      <Modal visible={modalVisible} animationType="slide" transparent={false} onRequestClose={() => { setModalVisible(false); resetForm(); }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ flex: 1, backgroundColor: theme.background }}>
            <View style={{ flex: 1 }}>`;

  const newModalOpen = `      <Modal visible={modalVisible} animationType="slide" transparent={false} onRequestClose={() => { setModalVisible(false); resetForm(); }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.primary} />
        <View style={{ flex: 1, backgroundColor: theme.background }}>`;

  content = content.replace(oldModalOpen, newModalOpen);

  // 2. Fix the mismatched closing tags and footer area
  const oldFooter = `              <View style={{ height: scale(20) }} />
            </ScrollView>

            {/* ── Fixed Footer: Save Button pinned to keyboard edge ── */}
            <View style={{ paddingHorizontal: scale(16), paddingTop: scale(16), paddingBottom: scale(12), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.1)', backgroundColor: theme.card }}>
              {/* Save Button */}
              <TouchableOpacity onPress={handleSaveExam} style={[styles.fsFormSaveButton, { backgroundColor: theme.primary, marginTop: 0 }]}>
                <Ionicons name={editingExam ? 'checkmark-circle' : 'save-outline'} size={18} color="#fff" />
                <Text style={styles.fsFormSaveButtonText}>{editingExam ? 'Update Record' : 'Save Record'}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }} style={[styles.fsFormCancelButton, { marginBottom: 0 }]}>
                <Text style={[styles.fsFormCancelText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>

              </View>
            </View>
          </KeyboardAvoidingView>
      </Modal>`;

  const newFooter = `              <View style={{ height: scale(20) }} />
            </ScrollView>

            {/* ── Fixed Footer ── */}
            <View style={{ paddingHorizontal: scale(16), paddingTop: scale(12), paddingBottom: scale(16), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border, backgroundColor: theme.card }}>
              <TouchableOpacity onPress={handleSaveExam} style={[styles.fsFormSaveButton, { backgroundColor: theme.primary, marginTop: 0 }]}>
                <Ionicons name={editingExam ? 'checkmark-circle' : 'save-outline'} size={18} color="#fff" />
                <Text style={styles.fsFormSaveButtonText}>{editingExam ? 'Update Record' : 'Save Record'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }} style={[styles.fsFormCancelButton, { marginBottom: 0 }]}>
                <Text style={[styles.fsFormCancelText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
      </Modal>`;

  content = content.replace(oldFooter, newFooter);

  // 3. Fix the header: replace current header with a modern colored one
  const oldHeader = `            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: scale(16), paddingVertical: scale(14), borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.card }}>
              <View>
                <Text style={{ fontSize: scale(16), fontWeight: '800', color: theme.text }}>{editingExam ? 'Edit Record' : 'New Record'}</Text>
                <Text style={{ fontSize: scale(11), color: theme.textSecondary, marginTop: scale(1) }}>{editingExam ? 'Update exam details' : 'Enter student exam details'}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: scale(8) }}>
                <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }} style={{ width: scale(32), height: scale(32), borderRadius: scale(16), backgroundColor: theme.error + '15', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="close" size={16} color={theme.error} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveExam} style={{ width: scale(32), height: scale(32), borderRadius: scale(16), backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>`;

  const newHeader = `            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(16), paddingVertical: scale(12), backgroundColor: theme.primary }}>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }} style={{ width: scale(36), height: scale(36), borderRadius: scale(18), backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: scale(12) }}>
                <Ionicons name="arrow-back" size={20} color="#fff" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: scale(17), fontWeight: '800', color: '#fff' }}>{editingExam ? 'Edit Record' : 'New Record'}</Text>
                <Text style={{ fontSize: scale(11), color: 'rgba(255,255,255,0.75)', marginTop: scale(1) }}>{editingExam ? 'Update exam details' : 'Enter student exam details'}</Text>
              </View>
              <TouchableOpacity onPress={handleSaveExam} style={{ paddingHorizontal: scale(14), paddingVertical: scale(8), borderRadius: scale(20), backgroundColor: 'rgba(255,255,255,0.2)', flexDirection: 'row', alignItems: 'center', gap: scale(4) }}>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={{ fontSize: scale(12), fontWeight: '700', color: '#fff' }}>Save</Text>
              </TouchableOpacity>
            </View>`;

  content = content.replace(oldHeader, newHeader);

  return content;
}

// ─── Fix Class screens (no separate footer, buttons are inside ScrollView) ────
function fixClass(content) {
  // 1. Fix modal opening
  const oldModalOpen = `      <Modal visible={modalVisible} animationType="slide" transparent={false} onRequestClose={() => { setModalVisible(false); resetForm(); }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ flex: 1, backgroundColor: theme.background }}>
            <View style={{ flex: 1 }}>`;

  const newModalOpen = `      <Modal visible={modalVisible} animationType="slide" transparent={false} onRequestClose={() => { setModalVisible(false); resetForm(); }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.primary} />
        <View style={{ flex: 1, backgroundColor: theme.background }}>`;

  content = content.replace(oldModalOpen, newModalOpen);

  // 2. Fix closing tags
  const oldModalClose = `                      </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>`;

  const newModalClose = `                      </ScrollView>
          </View>
      </Modal>`;

  content = content.replace(oldModalClose, newModalClose);

  // 3. Fix the header
  const oldHeader = `            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: scale(16), paddingVertical: scale(14), borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.card }}>
              <View>
                <Text style={{ fontSize: scale(16), fontWeight: '800', color: theme.text }}>{editingExam ? 'Edit Record' : 'New Record'}</Text>
                <Text style={{ fontSize: scale(11), color: theme.textSecondary, marginTop: scale(1) }}>{editingExam ? 'Update exam details' : 'Enter student exam details'}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: scale(8) }}>
                <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }} style={{ width: scale(32), height: scale(32), borderRadius: scale(16), backgroundColor: theme.error + '15', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="close" size={16} color={theme.error} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveExam} style={{ width: scale(32), height: scale(32), borderRadius: scale(16), backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>`;

  const newHeader = `            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(16), paddingVertical: scale(12), backgroundColor: theme.primary }}>
              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }} style={{ width: scale(36), height: scale(36), borderRadius: scale(18), backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: scale(12) }}>
                <Ionicons name="arrow-back" size={20} color="#fff" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: scale(17), fontWeight: '800', color: '#fff' }}>{editingExam ? 'Edit Record' : 'New Record'}</Text>
                <Text style={{ fontSize: scale(11), color: 'rgba(255,255,255,0.75)', marginTop: scale(1) }}>{editingExam ? 'Update exam details' : 'Enter student exam details'}</Text>
              </View>
              <TouchableOpacity onPress={handleSaveExam} style={{ paddingHorizontal: scale(14), paddingVertical: scale(8), borderRadius: scale(20), backgroundColor: 'rgba(255,255,255,0.2)', flexDirection: 'row', alignItems: 'center', gap: scale(4) }}>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={{ fontSize: scale(12), fontWeight: '700', color: '#fff' }}>Save</Text>
              </TouchableOpacity>
            </View>`;

  content = content.replace(oldHeader, newHeader);

  return content;
}

for (const { name, hasFooter } of files) {
  if (fs.existsSync(name)) {
    let content = fs.readFileSync(name, 'utf8');

    if (hasFooter) {
      content = fixGeneric(content);
    } else {
      content = fixClass(content);
    }

    fs.writeFileSync(name, content);
    console.log('✅ Fixed:', name);
  } else {
    console.log('⚠️  Not found:', name);
  }
}
