const fs = require('fs');
const files = [
  'Class9thExamsScreen.tsx',
  'Class10thExamsScreen.tsx',
  'Class1stYearExamsScreen.tsx',
  'Class2ndYearExamsScreen.tsx'
];

const modalHeaderTarget = `<Modal visible={modalVisible} animationType="slide" transparent statusBarTranslucent onRequestClose={() => { setModalVisible(false); resetForm(); }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="height">
          <View style={{ flex: 1, backgroundColor: theme.background }}>
            <View style={{ flex: 1, paddingTop: (StatusBar.currentHeight || 30) }}>`;

const modalHeaderReplacement = `<Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => { setModalVisible(false); resetForm(); }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} translucent={false} />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="height">
          <View style={{ flex: 1, backgroundColor: theme.background }}>
            <View style={{ flex: 1 }}>`;

const scrollViewTarget = `<ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: scale(12), paddingBottom: scale(30) }}`;

const scrollViewReplacement = `<ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: scale(12), paddingBottom: scale(10) }}`;

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    if (content.includes(modalHeaderTarget)) {
      content = content.replace(modalHeaderTarget, modalHeaderReplacement);
      console.log('Fixed header in', file);
    } else {
      console.log('Header NOT FOUND in', file);
    }
    
    if (content.includes(scrollViewTarget)) {
      content = content.replace(scrollViewTarget, scrollViewReplacement);
      console.log('Fixed ScrollView padding in', file);
    } else {
      console.log('ScrollView padding NOT FOUND in', file);
    }
    
    fs.writeFileSync(file, content);
  }
}
