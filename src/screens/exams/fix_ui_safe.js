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

  // 2. showOptionsModal full screen layout
  content = content.replace(
    /<Modal visible=\{showOptionsModal\} transparent animationType="fade">/g,
    `<Modal visible={showOptionsModal} transparent animationType="slide" statusBarTranslucent={true} onRequestClose={() => setShowOptionsModal(false)}>`
  );

  content = content.replace(
    /<View style=\{\{ flex: 1, backgroundColor: 'rgba\(0,0,0,0\.5\)', justifyContent: 'center', alignItems: 'center' \}\}>/g,
    `<View style={{ flex: 1, backgroundColor: isDark ? theme.background : '#f8fafc' }}>`
  );

  const oldContainer = `<View style={[{ width: '92%', maxWidth: scale(400), borderRadius: scale(16), padding: scale(16), elevation: 8, maxHeight: '85%' }, { backgroundColor: theme.card }]}>`;
  const newHeaderAndScroll = `
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

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: scale(16), paddingBottom: scale(40) }} showsVerticalScrollIndicator={false}>`;
  
  content = content.replace(oldContainer, newHeaderAndScroll);

  const closeBtnRegex = /<TouchableOpacity\s*onPress=\{\(\) => setShowOptionsModal\(false\)\}\s*style=\{\{ position: 'absolute'[\s\S]*?<\/TouchableOpacity>/;
  content = content.replace(closeBtnRegex, '');

  content = content.replace(/<ScrollView showsVerticalScrollIndicator=\{false\} style=\{\{ flexShrink: 1 \}\}>/g, '');

  content = content.replace(/<\/ScrollView>\s*\{\/\* Action Buttons \*\/\}/, '{/* Action Buttons */}');

  content = content.replace(
    /<View style=\{\{ flexDirection: 'row', gap: scale\(8\), paddingTop: scale\(10\), marginTop: scale\(10\) \}\}>/g,
    `<View style={{ flexDirection: 'row', gap: scale(12), paddingTop: scale(10), marginTop: scale(20) }}>`
  );

  // Replace ONLY the very LAST `</View></View></Modal>` in the file.
  const lastModalIndex = content.lastIndexOf('</Modal>');
  if (lastModalIndex !== -1) {
    // find the `</View>`s before it.
    const searchString = content.substring(lastModalIndex - 50, lastModalIndex + 8);
    const regex = /<\/View>\s*<\/View>\s*<\/Modal>/;
    if (regex.test(searchString)) {
       const newEnd = searchString.replace(regex, '</ScrollView>\n        </View>\n      </Modal>');
       content = content.substring(0, lastModalIndex - 50) + newEnd + content.substring(lastModalIndex + 8);
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', f);
  } else {
    console.log('No changes needed for', f);
  }
});
