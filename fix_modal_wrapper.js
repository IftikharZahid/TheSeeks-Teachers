const fs = require('fs');
const path = require('path');
const examsDir = path.join(__dirname, 'src', 'screens', 'exams');
const filesToFix = [
  'GenericExamsScreen.tsx',
  'Class9thExamsScreen.tsx',
  'Class10thExamsScreen.tsx',
  'Class1stYearExamsScreen.tsx',
  'Class2ndYearExamsScreen.tsx'
];

filesToFix.forEach(file => {
  const filePath = path.join(examsDir, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Replace Modal top wrapper
  const topWrapperRegex = /<Modal visible=\{modalVisible\} animationType=\"slide\" transparent=\{true\} statusBarTranslucent=\{true\} onRequestClose=\{\(\) => \{ setModalVisible\(false\); resetForm\(\); \}\}>\s*<View style=\{\{ flex: 1, backgroundColor: theme\.primary \}\}>\s*<SafeAreaView style=\{\{ flex: 1 \}\} edges=\{\['top', 'bottom'\]\}>\s*<KeyboardAvoidingView style=\{\{ flex: 1 \}\} behavior=\"padding\">\s*<View style=\{\{ flex: 1, backgroundColor: theme\.background \}\}>\s*<View style=\{\{ flex: 1, paddingTop: scale\(10\) \}\}>/g;
  
  content = content.replace(
    topWrapperRegex,
    `<Modal visible={modalVisible} animationType="slide" transparent={true} statusBarTranslucent={true} onRequestClose={() => { setModalVisible(false); resetForm(); }}>
          <View style={{ flex: 1, backgroundColor: isDark ? theme.background : '#f8fafc', paddingTop: StatusBar.currentHeight || 0 }}>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: StatusBar.currentHeight || 0, backgroundColor: theme.primary, zIndex: 999 }} />`
  );

  // 2. Insert KeyboardAvoidingView after Header
  const headerEndRegex = /(<Text style=\{\{ fontSize: scale\(12\), fontWeight: '700', color: '#fff' \}\}>Save<\/Text>\s*<\/TouchableOpacity>\s*<\/View>)/g;
  content = content.replace(headerEndRegex, `$1\n\n              <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>`);

  // 3. Replace Modal bottom wrapper
  const bottomWrapperRegex = /<\/TouchableOpacity>\s*<\/View>\s*<\/View>\s*<\/View>\s*<\/KeyboardAvoidingView>\s*<\/SafeAreaView>\s*<\/View>\s*<\/Modal>/g;
  
  content = content.replace(
    bottomWrapperRegex,
    `</TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>`
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed Modal wrapper in', file);
  } else {
    console.log('No change in Modal wrapper for', file);
  }
});
