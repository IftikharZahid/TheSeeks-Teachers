import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { scale } from '../../utils/responsive';
import { useAppSelector } from '../../store/hooks';

const CLASSES = [
  { id: '8th', name: '8th Class', icon: 'library-outline', color: '#f59e0b', bg: '#fffbeb' },
  { id: '9th', name: '9th Class', icon: 'school-outline', color: '#3b82f6', bg: '#eff6ff' },
  { id: '10th', name: '10th Class', icon: 'ribbon-outline', color: '#10b981', bg: '#ecfdf5' },
  { id: '1st Year', name: '1st Year', icon: 'book-outline', color: '#8b5cf6', bg: '#f5f3ff' },
  { id: '2nd Year', name: '2nd Year', icon: 'library-outline', color: '#f59e0b', bg: '#fffbeb' },
];

export const DiaryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();

  const exams = useAppSelector((state: any) => state.admin.exams);
  const students = useAppSelector((state: any) => state.admin.students) || [];

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
    // Sort the classes logically
    classList.sort((a, b) => {
      const getOrder = (name: string) => {
        const lower = name.toLowerCase();
        const match = lower.match(/^(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (lower.includes('year')) {
            if (num === 1) return 11;
            if (num === 2) return 12;
          }
          return num;
        }
        if (lower.includes('1st year') || lower.includes('first')) return 11;
        if (lower.includes('2nd year') || lower.includes('second')) return 12;
        return 999;
      };
      
      return getOrder(a.name) - getOrder(b.name);
    });

    return classList;
  }, [exams]);

  const handleSelectClass = (className: string) => {
    navigation.navigate('ClassDiaryScreen', { selectedClass: className });
  };

  const getStudentCount = (classId: string) => {
    return students.filter((s: any) => {
      const sClass = (s.class || s.grade || s.studentClass || '').trim().toLowerCase();
      return sClass === classId.trim().toLowerCase();
    }).length;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? theme.background : '#fafafa' }]} edges={['top', 'left', 'right']}>
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
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerArea}>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Select a class to view or add daily diaries.
          </Text>
        </View>

        <View style={styles.grid}>
          {dynamicClasses.map((cls, idx) => {
            const count = getStudentCount(cls.id);
            return (
              <TouchableOpacity
                key={cls.id}
                style={[styles.card, { backgroundColor: theme.card, borderColor: isDark ? theme.border : '#f1f5f9' }]}
                activeOpacity={0.7}
                onPress={() => handleSelectClass(cls.id)}
              >
                <View style={[styles.iconContainer, { backgroundColor: isDark ? cls.color + '20' : cls.bg }]}>
                  <Ionicons name={cls.icon as any} size={scale(24)} color={cls.color} />
                </View>
                
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>{cls.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: scale(2) }}>
                    <Ionicons name="people-outline" size={scale(12)} color={theme.textTertiary || '#94a3b8'} />
                    <Text style={[styles.studentCount, { color: theme.textTertiary || '#94a3b8' }]}> {count} {count === 1 ? 'Student' : 'Students'}</Text>
                  </View>
                </View>

                <View style={[styles.badge, { backgroundColor: isDark ? cls.color + '20' : cls.bg }]}>
                  <Text style={[styles.badgeText, { color: cls.color }]}>Manage Diary</Text>
                </View>
                
                <Ionicons name="chevron-forward" size={scale(18)} color={theme.textTertiary || '#94a3b8'} style={{ marginLeft: scale(8) }} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingTop: scale(16),
    paddingBottom: scale(16),
  },
  backButton: {
    padding: scale(4),
  },
  iconCircle: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRightBtn: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  headerTitle: {
    fontSize: scale(18),
    fontWeight: '800',
  },
  scrollContent: {
    padding: scale(16),
    paddingBottom: scale(100),
  },
  headerArea: {
    marginBottom: scale(24),
    alignItems: 'center',
    marginTop: scale(4),
  },
  subtitle: {
    fontSize: scale(13),
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'column',
    gap: scale(12),
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scale(12),
    padding: scale(12),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  iconContainer: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(14),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(14),
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: scale(15),
    fontWeight: '700',
  },
  studentCount: {
    fontSize: scale(11),
  },
  badge: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(8),
  },
  badgeText: {
    fontSize: scale(11),
    fontWeight: '700',
  },
});
