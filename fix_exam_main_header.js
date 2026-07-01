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

  // Fix Main Header
  content = content.replace(
    /<SafeAreaView style=\{\[styles\.container, \{ backgroundColor: theme\.background \}\]\} edges=\{\['top', 'left', 'right'\]\}>\s*\{\/\* Header \*\/\}\s*<View style=\{\[styles\.header, \{ backgroundColor: theme\.card, borderBottomColor: theme\.border \}\]\}>/g,
    `<View style={[styles.container, { backgroundColor: isDark ? theme.background : '#f8fafc', paddingTop: StatusBar.currentHeight || 0 }]}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: StatusBar.currentHeight || 0, backgroundColor: theme.primary, zIndex: 999 }} />
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.primary, borderBottomColor: 'transparent' }]}>`
  );

  // Fix Main Header variant with ""?"? Header "?"?"
  content = content.replace(
    /<SafeAreaView style=\{\[styles\.container, \{ backgroundColor: theme\.background \}\]\} edges=\{\['top', 'left', 'right'\]\}>\s*\{\/\* \?"\?\?"\? Header \?"\?\?"\? \*\/\}\s*<View style=\{\[styles\.header, \{ backgroundColor: theme\.card, borderBottomColor: theme\.border \}\]\}>/g,
    `<View style={[styles.container, { backgroundColor: isDark ? theme.background : '#f8fafc', paddingTop: StatusBar.currentHeight || 0 }]}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: StatusBar.currentHeight || 0, backgroundColor: theme.primary, zIndex: 999 }} />
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.primary, borderBottomColor: 'transparent' }]}>`
  );

  // Replace back button in Main Header
  const backBtnRegex = /<TouchableOpacity onPress=\{\(\) => navigation\.goBack\(\)\} style=\{\[styles\.headerIconButton, \{ backgroundColor: theme\.background, borderColor: theme\.border \}\]\}>\s*<Ionicons name="chevron-back" size=\{22\} color=\{theme\.text\} \/>\s*<\/TouchableOpacity>/g;
  
  const newBackBtn = `<TouchableOpacity
            style={{ 
              width: scale(38), 
              height: scale(38), 
              borderRadius: scale(12), 
              backgroundColor: 'rgba(255, 255, 255, 0.15)', 
              justifyContent: 'center', 
              alignItems: 'center', 
              marginRight: scale(12) 
            }} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={scale(22)} color="#ffffff" />
          </TouchableOpacity>`;
  content = content.replace(backBtnRegex, newBackBtn);

  // Fix Main Header Title Color
  content = content.replace(
    /<Text style=\{\[styles\.headerTitle, \{ color: theme\.text \}\]\}>(\{targetClass\} Exams)<\/Text>/g,
    `<Text style={[styles.headerTitle, { color: '#ffffff' }]}>$1</Text>`
  );
  content = content.replace(
    /<Text style=\{\[styles\.headerSubtitle, \{ color: theme\.textSecondary \}\]\}>/g,
    `<Text style={[styles.headerSubtitle, { color: 'rgba(255,255,255,0.7)' }]}>`
  );

  // Replace primary button background
  content = content.replace(
    /<TouchableOpacity onPress=\{\(\) => openModal\(\)\} style=\{\[styles\.headerPrimaryButton, \{ backgroundColor: theme\.primary \}\]\}>/g,
    `<TouchableOpacity onPress={() => openModal()} style={[styles.headerPrimaryButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>`
  );

  // Replace ending SafeAreaView with View
  content = content.replace(
    /<\/SafeAreaView>/g,
    `</View>`
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed main header in', file);
  } else {
    console.log('No change in main header for', file);
  }
});
