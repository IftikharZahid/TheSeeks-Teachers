const fs = require('fs');

const files = [
  'GenericExamsScreen.tsx',
  'Class9thExamsScreen.tsx',
  'Class10thExamsScreen.tsx',
  'Class1stYearExamsScreen.tsx',
  'Class2ndYearExamsScreen.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Make the Modal opaque so it acts as a true full screen Activity on Android
    // Generic has transparent={true}
    content = content.replace(
      /<Modal visible=\{modalVisible\} animationType="slide" transparent=\{true\} onRequestClose=\{\(\) => \{ setModalVisible\(false\); resetForm\(\); \}\}>/g,
      `<Modal visible={modalVisible} animationType="slide" transparent={false} onRequestClose={() => { setModalVisible(false); resetForm(); }}>`
    );

    // Classes have transparent
    content = content.replace(
      /<Modal visible=\{modalVisible\} animationType="slide" transparent onRequestClose=\{\(\) => \{ setModalVisible\(false\); resetForm\(\); \}\}>/g,
      `<Modal visible={modalVisible} animationType="slide" transparent={false} onRequestClose={() => { setModalVisible(false); resetForm(); }}>`
    );
    
    // Ensure no status bar overlapping issues
    content = content.replace(
      /<StatusBar barStyle=\{isDark \? 'light-content' : 'dark-content'\} backgroundColor=\{theme\.background\} translucent=\{false\} \/>/g,
      `<StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />`
    );

    fs.writeFileSync(file, content);
    console.log('Fixed Android Full Screen Modal in', file);
  }
}
