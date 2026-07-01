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

    // GenericExamsScreen has this specific pattern
    const genericTarget = `<Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => { setModalVisible(false); resetForm(); }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.card} translucent={false} />
        <View style={{ flex: 1, backgroundColor: theme.card }}>
          <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
              <View style={{ flex: 1, backgroundColor: theme.background }}>
                <View style={{ flex: 1, paddingTop: scale(10) }}>`;

    const genericReplacement = `<Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => { setModalVisible(false); resetForm(); }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} translucent={false} />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ flex: 1, backgroundColor: theme.background }}>
            <View style={{ flex: 1 }}>`;

    // The other class screens have this pattern (after the previous script)
    const classTarget = `<Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => { setModalVisible(false); resetForm(); }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} translucent={false} />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="height">
          <View style={{ flex: 1, backgroundColor: theme.background }}>
            <View style={{ flex: 1 }}>`;

    const classReplacement = `<Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => { setModalVisible(false); resetForm(); }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} translucent={false} />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ flex: 1, backgroundColor: theme.background }}>
            <View style={{ flex: 1 }}>`;

    if (content.includes(genericTarget)) {
      content = content.replace(genericTarget, genericReplacement);
      console.log('Fixed Generic UI in', file);
    }
    
    if (content.includes(classTarget)) {
      content = content.replace(classTarget, classReplacement);
      console.log('Fixed Class UI in', file);
    }

    // Fix the scroll enablement (so scroll bar works even if a dropdown was closed incorrectly or something)
    content = content.replace(/scrollEnabled=\{!isAnyFormDropdownOpen\}/g, 'scrollEnabled={true}');

    fs.writeFileSync(file, content);
  }
}
