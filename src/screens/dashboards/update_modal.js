const fs = require('fs');
const file = 'd:/ZahidCodes/TheSeeks-Teachers/src/screens/dashboards/TeacherDashboardScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace Modal
const startModal = '{/* Notifications Dropdown Overlay */}';
const endModal = '</Modal>';
if (content.includes(startModal) && content.includes(endModal)) {
  const modalRegex = new RegExp(startModal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\S]*?' + endModal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');

  const newModal = `{/* Notifications Dropdown Overlay */}
      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
        statusBarTranslucent={true}
      >
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        >
          <View style={[styles.dropdownWrapper, { top: insets.top + scale(50), right: scale(16) }]}>
            {/* Caret pointing up */}
            <View style={[styles.caret, { borderBottomColor: theme.border }]} />
            <View style={[styles.caretInner, { borderBottomColor: theme.card }]} />

            <View style={[styles.dropdownContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.dropdownHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.dropdownTitle, { color: theme.text }]}>Recent Updates</Text>
              </View>

              <ScrollView style={{ maxHeight: scale(300), flexGrow: 0 }} showsVerticalScrollIndicator={false}>
                {topUpdates.length > 0 ? (
                  topUpdates.map(update => {
                    if (update.type === 'notice') {
                      const n = update.item;
                      return (
                        <TouchableOpacity
                          key={update.id}
                          style={[styles.dropdownItem, { borderBottomColor: theme.border }]}
                          onPress={() => { setShowDropdown(false); navigation.navigate('Home' as never, { screen: 'LibraryScreen', params: { noticeId: n.id } } as never) }}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.iconBox, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}>
                            <Ionicons name="megaphone-outline" size={scale(16)} color={theme.primary} />
                          </View>
                          <View style={styles.dropdownContent}>
                            <View style={styles.itemTitleRow}>
                              <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>{n.title}</Text>
                              <Text style={[styles.itemTime, { color: theme.textTertiary }]}>{formatRelativeTime(update.timeMs)}</Text>
                            </View>
                            <Text style={[styles.itemText, { color: theme.textSecondary }]} numberOfLines={1}>{n.message}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    } else {
                      const m = update.item;
                      return (
                        <TouchableOpacity
                          key={update.id}
                          style={[styles.dropdownItem, { borderBottomColor: theme.border }]}
                          onPress={() => { setShowDropdown(false); navigation.navigate('Home' as never, { screen: 'MessagesScreen', params: { groupId: m.groupId } } as never) }}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.iconBox, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}>
                            <Ionicons name="chatbubbles-outline" size={scale(16)} color={theme.primary} />
                          </View>
                          <View style={styles.dropdownContent}>
                            <View style={styles.itemTitleRow}>
                              <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>{m.sender}</Text>
                              <Text style={[styles.itemTime, { color: theme.textTertiary }]}>{formatRelativeTime(update.timeMs)}</Text>
                            </View>
                            <Text style={[styles.itemText, { color: theme.textSecondary }]} numberOfLines={1}>{m.text}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    }
                  })
                ) : (
                  <View style={{ padding: scale(20), alignItems: 'center' }}>
                    <Ionicons name="notifications-off-outline" size={32} color={theme.textTertiary} />
                    <Text style={{ color: theme.textSecondary, marginTop: 8 }}>No recent updates</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>`;
  content = content.replace(modalRegex, newModal);
}

const styleStart = '  dropdownOverlay: {';
if (content.includes(styleStart)) {
    if (!content.includes('caretInner: {')) {
        content = content.replace('  dropdownContainer: {', `  dropdownWrapper: {
    position: 'absolute',
    alignItems: 'flex-end',
    width: scale(280),
  },
  caret: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: scale(8),
    borderRightWidth: scale(8),
    borderBottomWidth: scale(8),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginRight: scale(10),
  },
  caretInner: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: scale(7),
    borderRightWidth: scale(7),
    borderBottomWidth: scale(7),
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginRight: scale(11),
    position: 'absolute',
    top: scale(1.5),
    zIndex: 2,
  },
  dropdownContainer: {`);
    }

    content = content.replace('padding: scale(16)', 'paddingVertical: scale(12),\n    paddingHorizontal: scale(14)');
    content = content.replace("width: Math.min(width * 0.85, 340),", "width: '100%',");
}

fs.writeFileSync(file, content);
console.log('updated');
