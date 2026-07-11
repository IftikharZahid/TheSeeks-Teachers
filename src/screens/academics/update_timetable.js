const fs = require('fs');
const file = 'd:/ZahidCodes/TheSeeks-Teachers/src/screens/academics/TimetableScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacementComponent = `const AnimatedLectureItem = ({ e, index, activeIndex, theme, isDark }: any) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay: index * 120,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 7,
        tension: 40,
        delay: index * 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [e]);

  const isActive = index === activeIndex;

  return (
    <Animated.View style={{ flexDirection: 'row', alignItems: 'stretch', opacity, transform: [{ translateY }] }}>
      <View style={{ flex: 1 }}>
        <View style={[
          styles.card, 
          { backgroundColor: theme.card, borderColor: theme.border },
          isActive && { borderTopWidth: 4, borderTopColor: theme.primary }
        ]}>
          {/* Period Badge */}
          <View style={[styles.periodBadge, { backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff', borderColor: theme.primary, borderWidth: 1 }]}>
            <Text style={[styles.periodLabel, { color: theme.primary }]}>Lec</Text>
            <Text style={[styles.periodNum, { color: theme.primary }]}>{e.period || '—'}</Text>
          </View>

          {/* Main Info */}
          <View style={styles.cardMain}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.subjectText, { color: theme.text }]} numberOfLines={1}>
                {e.subject}
              </Text>
              {isActive && <BlinkingActiveBadge isDark={isDark} />}
            </View>
            <View style={[styles.row, { marginTop: scale(4) }]}>
              <View style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff', paddingHorizontal: scale(6), paddingVertical: scale(3), borderRadius: scale(6), flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="time" size={scale(10)} color={theme.primary} style={{ marginRight: scale(4) }} />
                <Text style={{ fontSize: scale(10), color: theme.primary, fontWeight: '800' }}>
                  {(e.startTime || e.endTime)
                    ? \`\${formatTime12Hour(e.startTime)}\${e.endTime ? \` – \${formatTime12Hour(e.endTime)}\` : ''}\`
                    : e.time || 'Time not set'}
                </Text>
              </View>
              {e.room ? (
                <Text style={[styles.metaText, { color: theme.textSecondary, marginLeft: scale(6) }]}>Room {e.room}</Text>
              ) : null}
            </View>
          </View>

          {/* Right Side Info */}
          <View style={{ alignItems: 'flex-end', justifyContent: 'center', gap: scale(4) }}>
            <Text style={{ color: theme.text, fontSize: scale(12), fontWeight: '800' }}>{e.class || '—'}</Text>
            {e.gender && e.gender !== 'All' && (
              <View style={{
                backgroundColor: e.gender === 'Boys' ? 'rgba(37,99,235,0.10)' : 'rgba(219,39,119,0.10)',
                paddingHorizontal: scale(6), paddingVertical: scale(2), borderRadius: scale(4),
              }}>
                <Text style={{ fontSize: scale(8), fontWeight: '800', color: e.gender === 'Boys' ? '#3b82f6' : '#ec4899' }}>
                  {e.gender.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
};
`;

if (!content.includes('const AnimatedLectureItem')) {
  content = content.replace('export const AdminTimetableScreen: React.FC = () => {', replacementComponent + '\nexport const AdminTimetableScreen: React.FC = () => {');
}

const mapRegex = /\{filteredEntries\.map\(\(e: any, index: number\) => \{[\s\S]*?const isActive = index === activeIndex;[\s\S]*?return \([\s\S]*?<View key=\{e\.id \|\| index\} style=\{\{ flexDirection: 'row', alignItems: 'stretch' \}\}>[\s\S]*?\{e\.gender\.toUpperCase\(\)\}[\s\S]*?<\/Text>[\s\S]*?<\/View>[\s\S]*?\}[\s\S]*?<\/View>[\s\S]*?<\/View>[\s\S]*?<\/View>[\s\S]*?<\/View>[\s\S]*?\);[\s\S]*?\}\)\}/g;

const mapReplacement = `{filteredEntries.map((e: any, index: number) => (
              <AnimatedLectureItem 
                key={e.id ? e.id + selectedDay : index + selectedDay} 
                e={e} 
                index={index} 
                activeIndex={activeIndex} 
                theme={theme} 
                isDark={isDark} 
              />
            ))}`;

content = content.replace(mapRegex, mapReplacement);
fs.writeFileSync(file, content);
console.log('done');
