const fs = require('fs');
const path = require('path');

const baseDir = 'C:\\Users\\USER\\Desktop\\Mobile App Dev\\TheSeeks Projects\\TheSeeks-Teachers\\src\\screens\\exams';

const targets = [
  'Class9thExamsScreen.tsx',
  'Class10thExamsScreen.tsx',
  'Class1stYearExamsScreen.tsx',
  'Class2ndYearExamsScreen.tsx'
];

const newHeader = `<Modal visible={modalVisible} animationType="slide" transparent={true} statusBarTranslucent={true} onRequestClose={() => { setModalVisible(false); resetForm(); }}>
          <View style={{ flex: 1, backgroundColor: isDark ? theme.background : '#f8fafc', paddingTop: StatusBar.currentHeight || 0 }}>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: StatusBar.currentHeight || 0, backgroundColor: isDark ? theme.card : theme.primary, zIndex: 999 }} />
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(16), paddingVertical: scale(12), backgroundColor: theme.primary }}>
              <TouchableOpacity
                style={{ width: scale(38), height: scale(38), borderRadius: scale(12), backgroundColor: isDark ? theme.border : 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center', marginRight: scale(12) }} 
                activeOpacity={0.7}
                onPress={() => { setModalVisible(false); resetForm(); }}
              >
                <Ionicons name="arrow-back" size={scale(22)} color={isDark ? theme.text : '#ffffff'} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: scale(17), fontWeight: '800', color: '#fff' }}>{editingExam ? 'Edit Record' : 'New Record'}</Text>
                <Text style={{ fontSize: scale(11), color: 'rgba(255,255,255,0.75)', marginTop: scale(1) }}>{editingExam ? 'Update exam details' : 'Enter student exam details'}</Text>
              </View>
              <TouchableOpacity onPress={handleSaveExam} style={{ paddingHorizontal: scale(14), paddingVertical: scale(8), borderRadius: scale(20), backgroundColor: isDark ? theme.primary + '30' : 'rgba(255,255,255,0.2)', flexDirection: 'row', alignItems: 'center', gap: scale(4) }}>
                <Ionicons name="checkmark" size={16} color={isDark ? theme.text : '#fff'} />
                <Text style={{ fontSize: scale(12), fontWeight: '700', color: '#fff' }}>Save</Text>
              </TouchableOpacity>
            </View>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>`;

for (let target of targets) {
  let p = path.join(baseDir, target);
  let content = fs.readFileSync(p, 'utf8');

  // We need to replace from `<Modal visible={modalVisible}` up to `</View>\n              </View>\n`
  // basically before `<ScrollView` begins.
  
  // Let's use regex
  const regex = /<Modal visible=\{modalVisible\}[^>]*>[\s\S]*?(?=<ScrollView)/;
  
  const match = content.match(regex);
  if (match) {
    // console.log(`Matched block in ${target}:`);
    // console.log(match[0]);
    let newContent = content.replace(regex, newHeader + '\n              ');
    
    // BUT we also need to fix the closing tags!
    // The original closing tags were:
    //             </View>
    //           </KeyboardAvoidingView>
    //         </Modal>
    // Or:
    //               </View>
    //             </View>
    //           </KeyboardAvoidingView>
    //         </Modal>
    // We need to change it to:
    //             </KeyboardAvoidingView>
    //           </View>
    //         </Modal>
    
    // We can do a regex to replace the closing part of this modal.
    // Since it's the EDIT / ADD MODAL, it is right before the CHOICE MODAL or UPLOAD INSTRUCTIONS MODAL
    // Wait, replacing closing tags with a regex could be tricky. 
    // Let's look for:
    const closingRegex = /<\/ScrollView>\s*<\/View>\s*<\/View>\s*<\/KeyboardAvoidingView>\s*<\/Modal>/;
    if (closingRegex.test(newContent)) {
       newContent = newContent.replace(closingRegex, '</ScrollView>\n            </KeyboardAvoidingView>\n          </View>\n        </Modal>');
       fs.writeFileSync(p, newContent, 'utf8');
       console.log(`Updated ${target}`);
    } else {
       console.log(`Could not find closing tags in ${target}. Checking alternative closing tags...`);
       // Alternative closing
       const closingRegex2 = /<\/ScrollView>\s*<\/View>\s*<\/KeyboardAvoidingView>\s*<\/Modal>/;
       if (closingRegex2.test(newContent)) {
           newContent = newContent.replace(closingRegex2, '</ScrollView>\n            </KeyboardAvoidingView>\n          </View>\n        </Modal>');
           fs.writeFileSync(p, newContent, 'utf8');
           console.log(`Updated ${target} (using alternative closing regex)`);
       } else {
           console.log(`FAILED to find closing tags in ${target}!`);
       }
    }
  } else {
    console.log(`Could not find opening tags in ${target}!`);
  }
}
