import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { scale } from '../../utils/responsive';
import { useAppSelector } from '../../store/hooks';

const CLASSES = [
  { id: '8th', name: '8th Class', icon: 'school-outline', color: '#0ea5e9', bg: '#f0f9ff' },
  { id: '9th', name: '9th Class', icon: 'school-outline', color: '#3b82f6', bg: '#eff6ff' },
  { id: '10th', name: '10th Class', icon: 'ribbon-outline', color: '#10b981', bg: '#ecfdf5' },
  { id: '1st Year', name: '1st Year', icon: 'book-outline', color: '#8b5cf6', bg: '#f5f3ff' },
  { id: '2nd Year', name: '2nd Year', icon: 'library-outline', color: '#f59e0b', bg: '#fffbeb' },
];

export const ClassesListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();

  const exams = useAppSelector((state) => state.admin.exams);

  const dynamicClasses = React.useMemo(() => {
    const existingIds = new Set(CLASSES.map(c => c.id.toLowerCase()));
    const classList = [...CLASSES];
    const uniqueExamClasses = new Set<string>();

    exams.forEach((e: any) => {
      const cls = (e.studentClass || '').trim();
      if (cls && !existingIds.has(cls.toLowerCase()) && !uniqueExamClasses.has(cls)) {
        uniqueExamClasses.add(cls);
        classList.push({
          id: cls,
          name: cls,
          icon: 'school-outline',
          color: '#3b82f6',
          bg: '#eff6ff'
        });
      }
    });
    
    // Sort logically
    const rankMap: Record<string, number> = {
      'playgroup': 1, 'nursery': 2, 'prep': 3,
      '1st': 4, '2nd': 5, '3rd': 6, '4th': 7, '5th': 8, '6th': 9, '7th': 10, '8th': 11, '9th': 12, '10th': 13,
      '1st year': 14, '2nd year': 15, '3rd year': 16, '4th year': 17
    };
    const getRank = (id: string) => {
      const normalized = id.toLowerCase().replace('class', '').trim();
      return rankMap[normalized] || 99;
    };

    return classList.sort((a, b) => {
      const rankA = getRank(a.id);
      const rankB = getRank(b.id);
      if (rankA !== rankB) return rankA - rankB;
      return a.name.localeCompare(b.name);
    });
  }, [exams]);

  const handleSelectClass = (className: string) => {
    let routeName = 'AdminExams';
    if (className === '9th') routeName = 'Class9thExamsScreen';
    else if (className === '10th') routeName = 'Class10thExamsScreen';
    else if (className === '1st Year') routeName = 'Class1stYearExamsScreen';
    else if (className === '2nd Year') routeName = 'Class2ndYearExamsScreen';
    
    navigation.navigate(routeName, { selectedClass: className });
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#f8fafc', paddingTop: StatusBar.currentHeight || 0 }]}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: StatusBar.currentHeight || 0, backgroundColor: theme.primary, zIndex: 999 }} />
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary, borderBottomColor: 'transparent' }]}>
        <TouchableOpacity
          style={{ 
            width: scale(38), 
            height: scale(38), 
            borderRadius: scale(12), 
            backgroundColor: 'rgba(255, 255, 255, 0.15)', 
            justifyContent: 'center', 
            alignItems: 'center', 
          }} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={scale(22)} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="document-text" size={scale(20)} color="#ffffff" style={{ marginRight: scale(6) }} />
          <Text style={[styles.headerTitle, { color: '#ffffff' }]} numberOfLines={1} adjustsFontSizeToFit>Manage Exams</Text>
        </View>

        <View style={{ width: scale(38) }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerArea}>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Select a class to view or add exam records.
          </Text>
        </View>

        <View style={styles.grid}>
          {dynamicClasses.map((cls) => {
            const uniqueStudents = new Set(
              exams.filter((e: any) => e.studentClass === cls.id).map((e: any) => e.studentId || e.studentName)
            ).size;
            
            return (
              <TouchableOpacity
                key={cls.id}
                style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
                activeOpacity={0.7}
                onPress={() => handleSelectClass(cls.id)}
              >
                <View style={[styles.iconContainer, { backgroundColor: isDark ? cls.color + '20' : cls.bg }]}>
                  <Ionicons name={cls.icon as any} size={scale(28)} color={cls.color} />
                </View>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{cls.name}</Text>
                
                <View style={[styles.badge, { backgroundColor: cls.color + '18' }]}>
                  <Text style={[styles.badgeText, { color: cls.color }]}>
                    {uniqueStudents} Students
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        </ScrollView>
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomLeftRadius: scale(24),
    borderBottomRightRadius: scale(24),
  },
  backBtn: {
    padding: scale(4),
  },
  headerTitle: {
    fontSize: scale(18),
    fontWeight: '700',
  },
  scrollContent: {
    padding: scale(16),
    paddingBottom: scale(40),
  },
  headerArea: {
    marginBottom: scale(24),
    alignItems: 'center',
    marginTop: scale(10),
  },
  title: {
    fontSize: scale(22),
    fontWeight: '800',
    marginBottom: scale(6),
  },
  subtitle: {
    fontSize: scale(13),
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: scale(12),
  },
  card: {
    width: '48%',
    borderRadius: scale(16),
    padding: scale(16),
    alignItems: 'center',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: scale(2) },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  iconContainer: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(12),
  },
  cardTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    marginBottom: scale(8),
    textAlign: 'center',
  },
  arrowContainer: {
    marginTop: scale(4),
    padding: scale(4),
    backgroundColor: 'transparent',
  },
  badge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(8),
    marginTop: scale(4),
  },
  badgeText: {
    fontSize: scale(11),
    fontWeight: '700',
  },
});

export default ClassesListScreen;

