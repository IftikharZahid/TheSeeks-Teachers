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

  // 1. Ensure Modal has onRequestClose
  content = content.replace(
    /<Modal visible=\{modalVisible\} animationType="slide" transparent=\{true\} statusBarTranslucent=\{true\}>/g,
    `<Modal visible={modalVisible} animationType="slide" transparent={true} statusBarTranslucent={true} onRequestClose={() => { setModalVisible(false); resetForm(); }}>`
  );

  // 2. Fix outermost view background color for Modal to match theme.primary for the SafeArea top edge
  content = content.replace(
    /<Modal visible=\{modalVisible\}([^>]*?)>\s*<View style=\{\{ flex: 1, backgroundColor: theme\.card \}\}>/g,
    `<Modal visible={modalVisible}$1>\n          <View style={{ flex: 1, backgroundColor: theme.primary }}>`
  );

  // 3. Replace the old Modal Header with the new primary one
  const oldHeaderPattern = /\{\/\* Header \*\/\}\s*<View style=\{\{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',[\s\S]*?<Ionicons name="checkmark" size=\{16\} color="#fff" \/>\s*<\/TouchableOpacity>\s*<\/View>\s*<\/View>/g;
  
  const newHeader = `{/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(16), paddingVertical: scale(12), backgroundColor: theme.primary }}>
                <TouchableOpacity
                  style={{ 
                    width: scale(38), 
                    height: scale(38), 
                    borderRadius: scale(12), 
                    backgroundColor: 'rgba(255, 255, 255, 0.15)', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    marginRight: scale(12) 
                  }} 
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
              </View>`;

  content = content.replace(oldHeaderPattern, newHeader);

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully updated ${file}`);
  }
});
