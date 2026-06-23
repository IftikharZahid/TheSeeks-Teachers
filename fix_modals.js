const fs = require('fs');

function fixModal(file) {
    let c = fs.readFileSync(file, 'utf8');

    // Add StatusBar import if not there
    if (!c.includes('import {') || !c.includes('StatusBar')) {
        c = c.replace(/import \{ View, Text, StyleSheet, /g, 'import { View, Text, StyleSheet, StatusBar, ');
        if (!c.includes('StatusBar,')) {
            c = c.replace(/import \{ View, /g, 'import { View, StatusBar, ');
        }
    }

    if (file.includes('ClassDiaryScreen')) {
        const target = `<Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent={false}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setModalVisible(false)} />
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>`;

        const replacement = `<Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent={true}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={{ flex: 1, backgroundColor: theme.background }}>
            <View style={{ flex: 1, paddingTop: Platform.OS === 'ios' ? 48 : (StatusBar.currentHeight || 30) }}>
            <View style={[styles.modalContent, { backgroundColor: theme.card, flex: 1, borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>`;

        c = c.replace(target, replacement);

        // Remove one closing view
        const closingTarget = `            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>`;

        const closingReplacement = `            </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>`;

        c = c.replace(closingTarget, closingReplacement);
    } 
    
    if (file.includes('TeacherAssignmentsScreen')) {
        const target = `<Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)} statusBarTranslucent={false}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowModal(false)} />
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>`;

        const replacement = `<Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)} statusBarTranslucent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: theme.background }}>
            <View style={{ flex: 1, paddingTop: Platform.OS === 'ios' ? 48 : (StatusBar.currentHeight || 30) }}>
            <View style={[styles.modalContent, { backgroundColor: theme.card, flex: 1, borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>`;

        c = c.replace(target, replacement);

        const closingTarget = `            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>`;

        const closingReplacement = `            </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>`;
      
        c = c.replace(closingTarget, closingReplacement);
    }

    fs.writeFileSync(file, c);
}

fixModal('src/screens/diary/ClassDiaryScreen.tsx');
fixModal('src/screens/academics/TeacherAssignmentsScreen.tsx');
console.log('Fixed modals to full screen correctly');
