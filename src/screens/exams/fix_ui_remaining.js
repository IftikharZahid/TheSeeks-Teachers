const fs = require('fs');
const path = require('path');

const files = [
  'Class10thExamsScreen.tsx',
  'Class1stYearExamsScreen.tsx',
  'Class2ndYearExamsScreen.tsx'
];

files.forEach(f => {
  const filePath = path.join(__dirname, f);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Because the previous script missed the Modal start for these 3 files,
  // their ends were incorrectly changed to </ScrollView> while the start was untouched.
  
  // First, find the start of the showOptionsModal
  const modalStartRegex = /<Modal visible=\{showOptionsModal\}[\s\S]*?<ScrollView showsVerticalScrollIndicator=\{false\} style=\{\{ flexShrink: 1 \}\}>/;
  
  const fullScreenModalStart = `<Modal visible={showOptionsModal} transparent animationType="slide" statusBarTranslucent={true} onRequestClose={() => setShowOptionsModal(false)}>
        <View style={{ flex: 1, backgroundColor: isDark ? theme.background : '#f8fafc' }}>
          
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(16), paddingTop: (StatusBar.currentHeight || 0) + scale(12), paddingBottom: scale(12), backgroundColor: theme.primary }}>
            <TouchableOpacity
              style={{ width: scale(38), height: scale(38), borderRadius: scale(12), backgroundColor: isDark ? theme.border : 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: scale(12) }}
              activeOpacity={0.7}
              onPress={() => setShowOptionsModal(false)}
            >
              <Ionicons name="arrow-back" size={scale(22)} color={isDark ? theme.text : '#ffffff'} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: scale(17), fontWeight: '800', color: '#fff' }}>Student Record</Text>
              <Text style={{ fontSize: scale(11), color: 'rgba(255,255,255,0.75)', marginTop: scale(1) }}>View or modify exam record</Text>
            </View>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: scale(16), paddingBottom: scale(40) }} showsVerticalScrollIndicator={false}>
            {/* The avatar block */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scale(16), padding: scale(12), backgroundColor: theme.card, borderRadius: scale(12), borderWidth: 1, borderColor: theme.border }}>
              <View style={{ width: scale(48), height: scale(48), borderRadius: scale(24), backgroundColor: theme.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: scale(12) }}>
                <Ionicons name="person" size={24} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: scale(18), fontWeight: '700', color: theme.text }} numberOfLines={1}>{selectedExamForOptions?.studentName || 'Student'}</Text>
                <Text style={{ fontSize: scale(13), color: theme.textSecondary, marginTop: scale(2) }}>
                  ID: {selectedExamForOptions?.rollNo || 'N/A'} • {selectedExamForOptions?.studentClass || 'N/A'}
                </Text>
              </View>
            </View>`;

  content = content.replace(modalStartRegex, fullScreenModalStart);

  const closeBtnRegex = /<TouchableOpacity\s*onPress=\{\(\) => setShowOptionsModal\(false\)\}\s*style=\{\{ position: 'absolute'[\s\S]*?<\/TouchableOpacity>/;
  content = content.replace(closeBtnRegex, '');

  content = content.replace(/<ScrollView showsVerticalScrollIndicator=\{false\} style=\{\{ flexShrink: 1 \}\}>/g, '');

  content = content.replace(/<\/ScrollView>\s*\{\/\* Action Buttons \*\/\}/, '{/* Action Buttons */}');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed', f);
});
