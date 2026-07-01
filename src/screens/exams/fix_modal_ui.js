const fs = require('fs');
const files = [
  'Class9thExamsScreen.tsx',
  'Class10thExamsScreen.tsx',
  'Class1stYearExamsScreen.tsx',
  'Class2ndYearExamsScreen.tsx'
];

const modalHeaderTarget = `<Modal visible={modalVisible} animationType="slide" transparent={true} statusBarTranslucent={true} onRequestClose={() => { setModalVisible(false); resetForm(); }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent={true} />
        <View style={{ flex: 1, backgroundColor: theme.card }}>
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>`;

const modalHeaderReplacement = `<Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => { setModalVisible(false); resetForm(); }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.card} translucent={false} />
        <View style={{ flex: 1, backgroundColor: theme.card }}>
          <SafeAreaView style={{ flex: 1 }} edges={['top']}>`;

const modalFooterTarget = `            {/* ── Fixed Footer: Save Button pinned to keyboard edge ── */}
            <View style={{ padding: scale(16), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.1)', backgroundColor: theme.card }}>`;

const modalFooterReplacement = `            {/* ── Fixed Footer: Save Button pinned to keyboard edge ── */}
            <View style={{ paddingHorizontal: scale(16), paddingTop: scale(16), paddingBottom: scale(12), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.1)', backgroundColor: theme.card }}>`;

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    if (content.includes(modalHeaderTarget)) {
      content = content.replace(modalHeaderTarget, modalHeaderReplacement);
      console.log('Fixed header in', file);
    } else {
      console.log('Header NOT FOUND in', file);
    }
    
    if (content.includes(modalFooterTarget)) {
      content = content.replace(modalFooterTarget, modalFooterReplacement);
      console.log('Fixed footer in', file);
    } else {
      console.log('Footer NOT FOUND in', file);
    }
    
    fs.writeFileSync(file, content);
  }
}
