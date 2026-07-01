import os
import re

exams_dir = 'src/screens/exams'
files_to_fix = [
    'GenericExamsScreen.tsx',
    'Class9thExamsScreen.tsx',
    'Class10thExamsScreen.tsx',
    'Class1stYearExamsScreen.tsx',
    'Class2ndYearExamsScreen.tsx'
]

for filename in files_to_fix:
    filepath = os.path.join(exams_dir, filename)
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original_content = content

    # 1. Main Header
    main_header_regex = r'<SafeAreaView style=\{\[styles\.container, \{ backgroundColor: theme\.background \}\]\} edges=\{\[\'top\', \'left\', \'right\'\]\}>\s*\{/\*.*Header.*\*/\}\s*<View style=\{\[styles\.header, \{ backgroundColor: theme\.card, borderBottomColor: theme\.border \}\]\}>[\s\S]*?<TouchableOpacity onPress=\{\(\) => openModal\(\)\} style=\{\[styles\.headerPrimaryButton, \{ backgroundColor: theme\.primary \}\]\}>\s*<Ionicons name="add" size=\{18\} color="#fff" />\s*<Text style=\{styles\.headerPrimaryButtonText\}>New</Text>\s*</TouchableOpacity>\s*</View>'

    main_header_replacement = '''<View style={[styles.container, { backgroundColor: isDark ? theme.background : '#f8fafc', paddingTop: StatusBar.currentHeight || 0 }]}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: StatusBar.currentHeight || 0, backgroundColor: theme.primary, zIndex: 999 }} />
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.primary, borderBottomColor: 'transparent' }]}>
          <TouchableOpacity
            style={{ width: scale(38), height: scale(38), borderRadius: scale(12), backgroundColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: scale(12) }} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={scale(22)} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerTitleBlock}>
            <Text style={[styles.headerTitle, { color: '#ffffff' }]}>{targetClass} Exams</Text>
            <Text style={[styles.headerSubtitle, { color: 'rgba(255,255,255,0.7)' }]}>Results, marks, and student progress</Text>
          </View>
          <TouchableOpacity onPress={() => openModal()} style={[styles.headerPrimaryButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={[styles.headerPrimaryButtonText, { color: '#ffffff' }]}>New</Text>
          </TouchableOpacity>
        </View>'''

    content = re.sub(main_header_regex, main_header_replacement, content)

    # 2. Modal Header & Wrapper
    modal_regex = r'<Modal visible=\{modalVisible\} animationType="slide" transparent=\{true\} statusBarTranslucent=\{true\}>\s*<View style=\{\{ flex: 1, backgroundColor: theme\.card \}\}>\s*<SafeAreaView style=\{\{ flex: 1 \}\} edges=\{\[\'top\', \'bottom\'\]\}>\s*<KeyboardAvoidingView style=\{\{ flex: 1 \}\} behavior="padding">\s*<View style=\{\{ flex: 1, backgroundColor: theme\.background \}\}>\s*<View style=\{\{ flex: 1, paddingTop: scale\(10\) \}\}>\s*\{/\* Header \*/\}\s*<View style=\{\{ flexDirection: \'row\', alignItems: \'center\', justifyContent: \'space-between\', paddingHorizontal: scale\(16\), paddingVertical: scale\(14\), borderBottomWidth: 1, borderBottomColor: theme\.border, backgroundColor: theme\.card \}\}>[\s\S]*?<TouchableOpacity onPress=\{handleSaveExam\} style=\{\{ width: scale\(32\), height: scale\(32\), borderRadius: scale\(16\), backgroundColor: theme\.primary, alignItems: \'center\', justifyContent: \'center\' \}\}>\s*<Ionicons name="checkmark" size=\{16\} color="#fff" />\s*</TouchableOpacity>\s*</View>\s*</View>'

    modal_replacement = '''<Modal visible={modalVisible} animationType="slide" transparent={true} statusBarTranslucent={true} onRequestClose={() => { setModalVisible(false); resetForm(); }}>
        <View style={{ flex: 1, backgroundColor: isDark ? theme.background : '#f8fafc', paddingTop: StatusBar.currentHeight || 0 }}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: StatusBar.currentHeight || 0, backgroundColor: theme.primary, zIndex: 999 }} />
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(16), paddingVertical: scale(12), backgroundColor: theme.primary }}>
            <TouchableOpacity
              style={{ width: scale(38), height: scale(38), borderRadius: scale(12), backgroundColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: scale(12) }} 
              activeOpacity={0.7}
              onPress={() => { setModalVisible(false); resetForm(); }}
            >
              <Ionicons name="arrow-back" size={scale(22)} color="#ffffff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: scale(17), fontWeight: '800', color: '#fff' }}>{editingExam ? 'Edit Record' : 'New Record'}</Text>
              <Text style={{ fontSize: scale(11), color: 'rgba(255,255,255,0.75)', marginTop: scale(1) }}>{editingExam ? 'Update exam details' : 'Enter student exam details'}</Text>
            </View>
            <TouchableOpacity onPress={handleSaveExam} style={{ paddingHorizontal: scale(14), paddingVertical: scale(8), borderRadius: scale(20), backgroundColor: 'rgba(255,255,255,0.2)', flexDirection: 'row', alignItems: 'center', gap: scale(4) }}>
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={{ fontSize: scale(12), fontWeight: '700', color: '#fff' }}>Save</Text>
            </TouchableOpacity>
          </View>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>'''

    content = re.sub(modal_regex, modal_replacement, content)

    # 3. Modal Closing Tags
    modal_close_regex = r'</View>\s*</View>\s*</View>\s*</KeyboardAvoidingView>\s*</SafeAreaView>\s*</View>\s*</Modal>'
    modal_close_replacement = '''  </KeyboardAvoidingView>
        </View>
      </Modal>'''
    content = re.sub(modal_close_regex, modal_close_replacement, content)

    # 4. compactInput
    compact_input_regex = r"compactInput: \{ borderWidth: 1, borderRadius: scale\(8\), paddingHorizontal: 0, height: scale\(40\), fontSize: scale\(13\), textAlign: 'center' \},"
    compact_input_replacement = "compactInput: { borderWidth: 1, borderRadius: scale(8), padding: 0, height: scale(40), fontSize: scale(13), textAlign: 'center', textAlignVertical: 'center' },"
    content = re.sub(compact_input_regex, compact_input_replacement, content)

    # 5. End of file SafeAreaView -> View
    end_view_regex = r'</ScrollView>\s*</SafeAreaView>'
    end_view_replacement = '''</ScrollView>
    </View>'''
    content = re.sub(end_view_regex, end_view_replacement, content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {filename}")
    else:
        print(f"No changes made to {filename}")
