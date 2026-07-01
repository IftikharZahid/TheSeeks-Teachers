const fs = require('fs');

function replaceHeader(file, newHeader) {
  let content = fs.readFileSync(file, 'utf8');
  let startIdx = content.indexOf('return (');
  let endIdx = content.indexOf('<ScrollView');
  
  if (startIdx === -1 || endIdx === -1) {
    console.log('Could not find bounds in ' + file);
    return;
  }
  
  const before = content.substring(0, startIdx + 'return ('.length);
  const after = content.substring(endIdx);
  
  fs.writeFileSync(file, before + '\n' + newHeader + '\n      ' + after, 'utf8');
  console.log('Fixed ' + file);
}

const attListHeader = `    <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#f8fafc', paddingTop: StatusBar.currentHeight || 0 }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} translucent={false} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary, borderBottomColor: 'transparent' }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: scale(8), padding: scale(4) }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#fff' }]}>Manage Attendance</Text>
        <View style={[styles.totalStrengthBadge, { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)' }]}>
          <Text style={[styles.totalStrengthText, { color: '#fff' }]}>
            {students.length} Total
          </Text>
        </View>
      </View>`;

const classesListHeader = `    <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#f8fafc', paddingTop: StatusBar.currentHeight || 0 }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} translucent={false} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary, borderBottomColor: 'transparent' }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: scale(8), padding: scale(4) }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#fff' }]}>Manage Exams</Text>
        <View style={{ width: scale(30) }} />
      </View>`;

replaceHeader('src/screens/academics/AttendanceClassesListScreen.tsx', attListHeader);
replaceHeader('src/screens/academics/ClassesListScreen.tsx', classesListHeader);

// Now for AttendanceScreen.tsx. It's more complex.
// Let's just string replace the LinearGradient manually here.
let attStr = fs.readFileSync('src/screens/academics/AttendanceScreen.tsx', 'utf8');

const oldAttHeaderRegex = /<StatusBar backgroundColor=\{isDark \? '#1e293b' : '#4338ca'\} barStyle="light-content" translucent=\{false\} \/>\s*<Animated\.View style=\{\{ opacity: fadeAnim \}\}>\s*\{\/\* Header \*\/\}\s*<LinearGradient[\s\S]*?style=\{styles\.header\}[\s\S]*?>\s*<TouchableOpacity style=\{styles\.backBtn\} onPress=\{.*?\}\>\s*<Ionicons name="arrow-back" size=\{18\} color="#fff" \/>\s*<\/TouchableOpacity>/m;

const newAttHeader = `<StatusBar backgroundColor={theme.primary} barStyle="light-content" translucent={false} />
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </TouchableOpacity>`;

attStr = attStr.replace(oldAttHeaderRegex, newAttHeader);
attStr = attStr.replace('</LinearGradient>', '</View>');

fs.writeFileSync('src/screens/academics/AttendanceScreen.tsx', attStr, 'utf8');
console.log('Fixed AttendanceScreen.tsx');
