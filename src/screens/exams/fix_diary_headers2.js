const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\USER\\Desktop\\Mobile App Dev\\TheSeeks Projects\\TheSeeks-Teachers\\src\\screens\\diary\\ClassDiaryScreen.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const mainHeaderTarget = `  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={scale(24)} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>{selectedClass} Diary</Text>
        <TouchableOpacity 
          style={styles.headerAddButton}
          onPress={() => {
            setEditingEntryId(null);
            setTitle('');
            setDetails('');
            setDate(new Date());
            setModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle" size={scale(28)} color="#6366f1" />
        </TouchableOpacity>
      </View>`;

const mainHeaderReplacement = `  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.primary }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary, borderBottomColor: 'transparent' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={scale(24)} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#fff' }]} numberOfLines={1} adjustsFontSizeToFit>{selectedClass} Diary</Text>
        <TouchableOpacity 
          style={styles.headerAddButton}
          onPress={() => {
            setEditingEntryId(null);
            setTitle('');
            setDetails('');
            setDate(new Date());
            setModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle" size={scale(28)} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, backgroundColor: theme.background }}>`;

if (content.includes(mainHeaderTarget)) {
  content = content.replace(mainHeaderTarget, mainHeaderReplacement);
  // Replace the final </SafeAreaView> with </View></SafeAreaView>
  const closingTarget = `      </Modal>
    </SafeAreaView>
  );
};`;
  const closingReplacement = `      </Modal>
      </View>
    </SafeAreaView>
  );
};`;
  if (content.includes(closingTarget)) {
    content = content.replace(closingTarget, closingReplacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Main header color changes applied successfully.');
  } else {
    console.log('Closing target NOT found.');
  }
} else {
  console.log('Main header target NOT found.');
}
