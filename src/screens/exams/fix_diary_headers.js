const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\USER\\Desktop\\Mobile App Dev\\TheSeeks Projects\\TheSeeks-Teachers\\src\\screens\\diary\\ClassDiaryScreen.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Modal Header
const modalHeaderTarget = `      {/* Header */}
      <View style={[styles.modalHeader, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
        <View style={styles.modalHeaderLeft}>
          <View style={[styles.modalIconWrap, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
            <Ionicons name={editingEntryId ? 'pencil' : 'book'} size={scale(15)} color="#6366f1" />
          </View>
          <View>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingEntryId ? 'Edit Entry' : 'New Diary Entry'}
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>{selectedClass}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(8) }}>
          <TouchableOpacity
            style={{
              paddingHorizontal: scale(14),
              paddingVertical: scale(6),
              borderRadius: scale(20),
              backgroundColor: theme.primary,
              flexDirection: 'row',
              alignItems: 'center',
              gap: scale(4),
              opacity: submitting ? 0.6 : 1,
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              elevation: 3
            }}
            onPress={handleSave}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="checkmark" size={scale(16)} color="#fff" />
            )}
            <Text style={{ fontSize: scale(12), fontWeight: '700', color: '#fff' }}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}
            onPress={() => { setModalVisible(false); setEditingEntryId(null); setTitle(''); setDetails(''); setShowSubjectPicker(false); }}
          >
            <Ionicons name="close" size={scale(17)} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>`;

const modalHeaderReplacement = `      {/* Header */}
      <View style={[styles.modalHeader, { borderBottomColor: 'transparent', backgroundColor: theme.primary }]}>
        <View style={styles.modalHeaderLeft}>
          <View style={[styles.modalIconWrap, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Ionicons name={editingEntryId ? 'pencil' : 'book'} size={scale(15)} color="#fff" />
          </View>
          <View>
            <Text style={[styles.modalTitle, { color: '#fff' }]}>
              {editingEntryId ? 'Edit Entry' : 'New Diary Entry'}
            </Text>
            <Text style={[styles.modalSubtitle, { color: 'rgba(255,255,255,0.7)' }]}>{selectedClass}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(8) }}>
          <TouchableOpacity
            style={{
              paddingHorizontal: scale(14),
              paddingVertical: scale(6),
              borderRadius: scale(20),
              backgroundColor: 'rgba(255,255,255,0.2)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: scale(4),
              opacity: submitting ? 0.6 : 1,
            }}
            onPress={handleSave}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="checkmark" size={scale(16)} color="#fff" />
            )}
            <Text style={{ fontSize: scale(12), fontWeight: '700', color: '#fff' }}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
            onPress={() => { setModalVisible(false); setEditingEntryId(null); setTitle(''); setDetails(''); setShowSubjectPicker(false); }}
          >
            <Ionicons name="close" size={scale(17)} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>`;

// 2. Main Screen Header
const mainHeaderTarget = `    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={scale(24)} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>{selectedClass} Diary</Text>
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

const mainHeaderReplacement = `    <SafeAreaView style={[styles.container, { backgroundColor: theme.primary }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary, borderBottomColor: 'transparent' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={scale(24)} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#fff' }]} numberOfLines={1}>{selectedClass} Diary</Text>
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

if (content.includes(modalHeaderTarget)) {
  content = content.replace(modalHeaderTarget, modalHeaderReplacement);
  console.log('Modal header replaced.');
} else {
  console.log('Modal header target NOT found.');
}

if (content.includes(mainHeaderTarget)) {
  content = content.replace(mainHeaderTarget, mainHeaderReplacement);
  // Also need to close the <View style={{ flex: 1, backgroundColor: theme.background }}> we just opened.
  // It should be closed right before the closing </SafeAreaView>
  content = content.replace(/    <\/SafeAreaView>/, '      </View>\n    </SafeAreaView>');
  console.log('Main header replaced.');
} else {
  console.log('Main header target NOT found.');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully completed header color changes.');
