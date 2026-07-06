const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\USER\\Desktop\\Mobile App Dev\\TheSeeks Projects\\TheSeeks-Teachers\\src\\screens\\academics\\AttendanceScreen.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace main wrapper and header
const targetContent = `  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar backgroundColor={isDark ? '#1e293b' : '#4338ca'} barStyle="light-content" translucent={false} />
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Header */}
        <LinearGradient
          colors={isDark ? ['#1e293b','#0f172a'] : ['#4338ca','#6366f1']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>Attendance Register{classFilter !== 'All' ? \` - \${classFilter}\` : ''}</Text>
            <Text style={styles.headerSub}>{selectedDate || 'Select a date'}</Text>
          </View>
          {selectedDate && Object.keys(changes[selectedDate] || {}).length > 0
            ? <TouchableOpacity style={[styles.pctBadge, { backgroundColor: '#4ade8020' }]} onPress={() => saveChanges(selectedDate)}>
                <Text style={[styles.pctNum, { color: '#4ade80' }]}>Save</Text>
                <Text style={styles.pctLabel}>{Object.keys(changes[selectedDate] || {}).length} Chg</Text>
              </TouchableOpacity>
            : <View style={styles.pctBadge}>
                <Text style={styles.pctNum}>{presentPct}%</Text>
                <Text style={styles.pctLabel}>Present</Text>
              </View>
          }
        </LinearGradient>`;

const replacementContent = `  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: StatusBar.currentHeight || 0 }]}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: StatusBar.currentHeight || 0, backgroundColor: isDark ? theme.card : theme.primary, zIndex: 999 }} />
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent={true} />
      <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: isDark ? theme.card : theme.primary, borderBottomColor: isDark ? theme.border : 'transparent', borderBottomLeftRadius: scale(24), borderBottomRightRadius: scale(24) }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>Attendance Register{classFilter !== 'All' ? \` - \${classFilter}\` : ''}</Text>
            <Text style={styles.headerSub}>{selectedDate || 'Select a date'}</Text>
          </View>
          {selectedDate && Object.keys(changes[selectedDate] || {}).length > 0
            ? <TouchableOpacity style={[styles.pctBadge, { backgroundColor: '#4ade8020' }]} onPress={() => saveChanges(selectedDate)}>
                <Text style={[styles.pctNum, { color: '#4ade80' }]}>Save</Text>
                <Text style={styles.pctLabel}>{Object.keys(changes[selectedDate] || {}).length} Chg</Text>
              </TouchableOpacity>
            : <View style={styles.pctBadge}>
                <Text style={styles.pctNum}>{presentPct}%</Text>
                <Text style={styles.pctLabel}>Present</Text>
              </View>
          }
        </View>`;

content = content.replace(targetContent, replacementContent);

// Replace closing tags
const targetClosing = `    </SafeAreaView>
  );
};`;

const replacementClosing = `    </View>
  );
};`;

content = content.replace(targetClosing, replacementClosing);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated AttendanceScreen.tsx');
