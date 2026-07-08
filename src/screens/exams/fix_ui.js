const fs = require('fs');
const path = require('path');

const files = [
  'Class9thExamsScreen.tsx',
  'Class10thExamsScreen.tsx',
  'Class1stYearExamsScreen.tsx',
  'Class2ndYearExamsScreen.tsx',
  'GenericExamsScreen.tsx'
];

files.forEach(f => {
  const filePath = path.join(__dirname, f);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Adjust flex values
  content = content.replace(
    /<Text style=\{\[styles\.tableHeaderCell, \{ flex: 2\.2, color: theme\.textSecondary, fontSize: scale\(8\) \}\]\}>STUDENT<\/Text>/g,
    `<Text style={[styles.tableHeaderCell, { flex: 2.0, color: theme.textSecondary, fontSize: scale(8) }]}>STUDENT</Text>`
  );
  content = content.replace(
    /<Text style=\{\[styles\.tableHeaderCell, \{ flex: 0\.6, textAlign: 'center', color: theme\.textSecondary, fontSize: scale\(8\) \}\]\}>SUBJECTS<\/Text>/g,
    `<Text style={[styles.tableHeaderCell, { flex: 0.8, textAlign: 'center', color: theme.textSecondary, fontSize: scale(8) }]}>SUBJECTS</Text>`
  );
  
  content = content.replace(
    /<View style=\{\{ flex: 2\.2, flexDirection: 'row', alignItems: 'center' \}\}>/g,
    `<View style={{ flex: 2.0, flexDirection: 'row', alignItems: 'center' }}>`
  );
  content = content.replace(
    /<View style=\{\{ flex: 0\.6, alignItems: 'center' \}\}>([\s\S]*?)<Text style=\{\{ fontSize: scale\(11\), fontWeight: '600', color: theme\.text \}\}>/g,
    `<View style={{ flex: 0.8, alignItems: 'center' }}>$1<Text style={{ fontSize: scale(11), fontWeight: '600', color: theme.text }}>`
  );

  // 2. Rewrite showOptionsModal to be full screen
  const modalStartRegex = /<Modal visible=\{showOptionsModal\} transparent animationType="fade">[\s\S]*?<ScrollView showsVerticalScrollIndicator=\{false\} style=\{\{ flexShrink: 1 \}\}>/;
  
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

  // Remove the </ScrollView> before Action Buttons
  content = content.replace(/<\/ScrollView>\s*\{\/\* Action Buttons \*\/\}/, '{/* Action Buttons */}');

  // Modify action buttons styling
  // <View style={{ flexDirection: 'row', gap: scale(8), paddingTop: scale(10), marginTop: scale(10) }}>
  // becomes <View style={{ flexDirection: 'row', gap: scale(12), paddingTop: scale(10), marginTop: scale(20) }}>
  content = content.replace(
    /<View style=\{\{ flexDirection: 'row', gap: scale\(8\), paddingTop: scale\(10\), marginTop: scale\(10\) \}\}>/g,
    `<View style={{ flexDirection: 'row', gap: scale(12), paddingTop: scale(10), marginTop: scale(20) }}>`
  );

  // Add </ScrollView> at the end of modal content before </View></View></Modal>
  // The current end is: </View>\s*</View>\s*</Modal>
  // Wait, because it was `<View style={{ flex: 1 ...}}> <View style={[width: 92%...]}>` there were two Views closing.
  // Now there is `<View style={{ flex: 1 ...}}> <ScrollView>` so it should be `</ScrollView></View></Modal>`.
  // Let's replace the ending.
  content = content.replace(
    /<\/View>\s*<\/View>\s*<\/Modal>/g,
    `</ScrollView>\n        </View>\n      </Modal>`
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', f);
  } else {
    console.log('No changes needed for', f);
  }
});
