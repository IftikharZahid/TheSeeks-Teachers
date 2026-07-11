const fs = require('fs');

const file = 'd:/ZahidCodes/TheSeeks-Teachers/src/screens/dashboards/TeacherDashboardScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

const marker = 'const [showSideMenu, setShowSideMenu] = useState(false);';
if (!content.includes('const messagesList =')) {
  const newStates = `
  const messagesList = useAppSelector(state => state.messages.list);
  const noticesList = useAppSelector(state => state.notifications.notices);

  const recentUpdates: any[] = [];
  const getNoticeTime = (n: any) => {
    if (n.createdAt?.toMillis) return n.createdAt.toMillis();
    if (n.createdAt?.seconds) return n.createdAt.seconds * 1000;
    return 0;
  };
  
  if (noticesList && noticesList.length > 0) {
    noticesList.forEach((n: any) => {
      recentUpdates.push({ id: \`notice-\${n.id}\`, type: 'notice', item: n, timeMs: getNoticeTime(n) });
    });
  }
  if (messagesList && messagesList.length > 0) {
    messagesList.forEach((m: any) => {
      recentUpdates.push({ id: \`msg-\${m.id}\`, type: 'message', item: m, timeMs: (m as any).createdAtMs || 0 });
    });
  }
  
  recentUpdates.sort((a, b) => b.timeMs - a.timeMs);
  const topUpdates = recentUpdates.slice(0, 4);
  const [showDropdown, setShowDropdown] = useState(false);
`;
  content = content.replace(marker, marker + '\n' + newStates);
}

// Ensure formatRelativeTime exists
if (!content.includes('const formatRelativeTime')) {
  const formatTimeFunc = `
const formatRelativeTime = (timeMs: number): string => {
  if (!timeMs) return '';
  const diffMs = Date.now() - timeMs;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return \`\${diffMins}m ago\`;
  if (diffHours < 24) return \`\${diffHours}h ago\`;
  if (diffDays === 1) return 'Yesterday';
  return new Date(timeMs).toLocaleDateString([], { month: 'short', day: 'numeric' });
};
`;
  content = content.replace('const selectTotalClasses', formatTimeFunc + '\nconst selectTotalClasses');
}

// Update the onPress and add the Modal
const oldBell = `<TouchableOpacity
              onPress={() => handleNavigate('LibraryScreen')}
              style={styles.headerIconBtnTransparent}
            >`;
const newBell = `<TouchableOpacity
              onPress={() => setShowDropdown(!showDropdown)}
              style={styles.headerIconBtnTransparent}
            >`;

content = content.replace(oldBell, newBell);

const modalCode = `
      {/* Notifications Dropdown Overlay */}
      <Modal visible={showDropdown} transparent animationType="fade" onRequestClose={() => setShowDropdown(false)}>
        <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
          <View style={styles.notifDropdownOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.notifDropdownContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.notifDropdownHeader, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.notifDropdownTitle, { color: theme.text }]}>Recent Updates</Text>
                  <TouchableOpacity onPress={() => { setShowDropdown(false); handleNavigate('LibraryScreen'); }}>
                    <Text style={[styles.notifViewAllText, { color: theme.primary }]}>View All</Text>
                  </TouchableOpacity>
                </View>

                {/* Dynamic Updates List */}
                {topUpdates.length > 0 ? (
                  topUpdates.map(update => {
                    if (update.type === 'notice') {
                      const n = update.item;
                      return (
                        <TouchableOpacity
                          key={update.id}
                          style={[styles.notifDropdownItem, { borderBottomColor: theme.border }]}
                          onPress={() => { setShowDropdown(false); navigation.navigate('Home' as never, { screen: 'LibraryScreen', params: { noticeId: n.id } } as never) }}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.notifIconBox, { backgroundColor: n.iconBgColor || 'rgba(139,92,246,0.1)' }]}>
                            <Ionicons name={(n.iconName as any) || 'notifications'} size={18} color={n.iconColor || theme.primary} />
                          </View>
                          <View style={styles.notifDropdownContent}>
                            <View style={styles.notifItemTitleRow}>
                              <Text style={[styles.notifItemTitle, { color: theme.text }]} numberOfLines={1}>{n.title}</Text>
                              <Text style={[styles.notifItemTime, { color: theme.textTertiary }]}>{formatRelativeTime(update.timeMs)}</Text>
                            </View>
                            <Text style={[styles.notifItemText, { color: theme.textSecondary }]} numberOfLines={1}>{n.message}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    } else {
                      const m = update.item;
                      return (
                        <TouchableOpacity
                          key={update.id}
                          style={[styles.notifDropdownItem, { borderBottomColor: theme.border }]}
                          onPress={() => { setShowDropdown(false); navigation.navigate('Home' as never, { screen: 'MessagesScreen', params: { groupId: m.groupId } } as never) }}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.notifIconBox, { backgroundColor: 'rgba(6,182,212,0.1)' }]}>
                            <Ionicons name="chatbubbles" size={18} color={theme.accent} />
                          </View>
                          <View style={styles.notifDropdownContent}>
                            <View style={styles.notifItemTitleRow}>
                              <Text style={[styles.notifItemTitle, { color: theme.text }]} numberOfLines={1}>{m.sender}</Text>
                              <Text style={[styles.notifItemTime, { color: theme.textTertiary }]}>{formatRelativeTime(update.timeMs)}</Text>
                            </View>
                            <Text style={[styles.notifItemText, { color: theme.textSecondary }]} numberOfLines={1}>{m.text}</Text>
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
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
`;

const sideMenuMarker = '{/* ─── Professional Side Drawer ─── */}';
if (!content.includes('Notifications Dropdown Overlay')) {
  content = content.replace(sideMenuMarker, modalCode + '\n          ' + sideMenuMarker);
}

// Add Dropdown Styles
const stylesMarker = 'const styles = StyleSheet.create({';
if (!content.includes('notifDropdownOverlay:')) {
  const newStyles = `
  notifDropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  notifDropdownContainer: {
    position: 'absolute',
    top: scale(70), // Below header
    right: scale(16),
    width: Math.min(width * 0.85, 340),
    borderRadius: scale(16),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 20,
    overflow: 'hidden',
  },
  notifDropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
    borderBottomWidth: 1,
  },
  notifDropdownTitle: {
    fontSize: scale(16),
    fontWeight: '700',
  },
  notifViewAllText: {
    fontSize: scale(13),
    fontWeight: '600',
  },
  notifDropdownItem: {
    flexDirection: 'row',
    padding: scale(16),
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  notifIconBox: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  notifDropdownContent: {
    flex: 1,
  },
  notifItemTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifItemTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  notifItemTime: {
    fontSize: scale(11),
  },
  notifItemText: {
    fontSize: scale(13),
    lineHeight: scale(18),
  },
`;
  content = content.replace(stylesMarker, stylesMarker + '\n' + newStyles);
}

fs.writeFileSync(file, content);
console.log('TeacherDashboardScreen successfully updated');
