const fs = require('fs');
const path = require('path');

const filePath = path.join('c:/Users/USER/Desktop/Mobile App Dev/TheSeeks Projects/TheSeeks-Teachers/src/screens/diary/ClassListDiaryScreen.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? theme.background : '#fafafa' }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? theme.background : '#fafafa'} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? theme.background : '#fafafa' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <View style={[styles.iconCircle, { backgroundColor: isDark ? '#334155' : '#F3F4F6' }]}>
            <Ionicons name="chevron-back" size={scale(24)} color={theme.text} />
          </View>
        </TouchableOpacity>
        
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Class Diary</Text>
          <View style={{ width: scale(24), height: scale(3), backgroundColor: theme.primary, borderRadius: scale(2), marginTop: scale(4) }} />
        </View>

        <TouchableOpacity style={[styles.headerRightBtn, { backgroundColor: theme.primary }]}>
          <Ionicons name="document-text-outline" size={scale(18)} color="#fff" />
          <Ionicons name="add-circle" size={scale(12)} color="#fff" style={{ position: 'absolute', bottom: scale(6), right: scale(6), backgroundColor: theme.primary, borderRadius: scale(6), overflow: 'hidden' }} />
        </TouchableOpacity>
      </View>`;

const replacementStr = `    <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#f8fafc', paddingTop: StatusBar.currentHeight || 0 }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} translucent={false} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name="chevron-back" size={scale(24)} color="#fff" />
          </View>
        </TouchableOpacity>
        
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: '#fff' }]}>Class Diary</Text>
        </View>

        <TouchableOpacity style={[styles.headerRightBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Ionicons name="document-text-outline" size={scale(18)} color="#fff" />
          <Ionicons name="add-circle" size={scale(12)} color={theme.primary} style={{ position: 'absolute', bottom: scale(6), right: scale(6), backgroundColor: '#fff', borderRadius: scale(6), overflow: 'hidden' }} />
        </TouchableOpacity>
      </View>`;

content = content.replace(targetStr, replacementStr);
content = content.replace('</SafeAreaView>', '</View>');
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed ClassListDiaryScreen.tsx properly');
