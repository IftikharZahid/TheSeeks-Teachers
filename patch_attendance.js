const fs = require('fs');

function patchList(pathStr, listName) {
  let content = fs.readFileSync(pathStr, 'utf8');
  let search = `    <View style={[styles.container, { backgroundColor: theme.background }]}>\n      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={false} />\n      {/* Header */}\n      <View style={[styles.header, { borderBottomColor: theme.border }]}>\n        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>\n          <Ionicons name="arrow-back" size={22} color={theme.text} />\n        </TouchableOpacity>\n        <Text style={[styles.headerTitle, { color: theme.text }]}>${listName}</Text>`;
  
  if (!content.includes(search)) {
    console.log('Failed to match ' + listName);
    return;
  }
  
  // Notice I use paddingTop: StatusBar.currentHeight in the outer View just like in ClassListDiaryScreen.
  // Wait, the files already have paddingTop in styles.container, so I can just remove padding from the outer View.
  // Actually, wait, styles.container HAS paddingTop. If I change the background color of styles.container, the top padding area gets that color.
  // BUT we don't want the container to be primary color! We only want the status bar to be primary.
  // In Android with translucent={false}, StatusBar component's backgroundColor forces the system status bar color!
  // It doesn't rely on the container's background color in the padded area.
  // Wait, if translucent={false}, StatusBar doesn't float over the content. The padding in the container is EXTRA!
  // If we remove paddingTop from styles.container, we're good. But let's just keep it exactly as we did before, which worked.
  // We'll replace the JSX:
  let replace = `    <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#f8fafc' }]}>\n      <StatusBar barStyle="light-content" backgroundColor={theme.primary} translucent={false} />\n      {/* Header */}\n      <View style={[styles.header, { backgroundColor: theme.primary, borderBottomColor: 'transparent' }]}>\n        <TouchableOpacity style={[styles.backBtn, { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 4 }]} onPress={() => navigation.goBack()}>\n          <Ionicons name="arrow-back" size={22} color="#fff" />\n        </TouchableOpacity>\n        <Text style={[styles.headerTitle, { color: '#fff' }]}>${listName}</Text>`;
  
  content = content.replace(search, replace);

  // also replace the totalStrengthBadge if it exists:
  if (listName === 'Manage Attendance') {
    content = content.replace(
      `<View style={[styles.totalStrengthBadge, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '30' }]}><Text style={[styles.totalStrengthText, { color: theme.primary }]>`,
      `<View style={[styles.totalStrengthBadge, { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)' }]}><Text style={[styles.totalStrengthText, { color: '#fff' }]>`
    );
  }

  // we also need to change the style from `padding: scale(4)` to `padding: 4` in replace block
  fs.writeFileSync(pathStr, content, 'utf8');
}

patchList('src/screens/academics/AttendanceClassesListScreen.tsx', 'Manage Attendance');
patchList('src/screens/academics/ClassesListScreen.tsx', 'Manage Exams');

// Now for AttendanceScreen.tsx
let attStr = fs.readFileSync('src/screens/academics/AttendanceScreen.tsx', 'utf8');
const oldAttHeader = `    <View style={[styles.container, { backgroundColor: theme.background }]}>\n      <StatusBar backgroundColor={isDark ? '#1e293b' : '#4338ca'} barStyle="light-content" translucent={false} />\n      <Animated.View style={{ opacity: fadeAnim }}>\n        {/* Header */}\n        <LinearGradient\n          colors={isDark ? ['#1e293b','#0f172a'] : ['#4338ca','#6366f1']}\n          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}\n        >\n          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>\n            <Ionicons name="arrow-back" size={18} color="#fff" />\n          </TouchableOpacity>`;

const newAttHeader = `    <View style={[styles.container, { backgroundColor: theme.background }]}>\n      <StatusBar backgroundColor={theme.primary} barStyle="light-content" translucent={false} />\n      <Animated.View style={{ opacity: fadeAnim }}>\n        {/* Header */}\n        <View style={[styles.header, { backgroundColor: theme.primary }]}>\n          <TouchableOpacity style={[styles.backBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]} onPress={() => navigation.goBack()}>\n            <Ionicons name="arrow-back" size={18} color="#fff" />\n          </TouchableOpacity>`;

attStr = attStr.replace(oldAttHeader, newAttHeader);
attStr = attStr.replace('</LinearGradient>', '</View>');

fs.writeFileSync('src/screens/academics/AttendanceScreen.tsx', attStr, 'utf8');
console.log('done');
