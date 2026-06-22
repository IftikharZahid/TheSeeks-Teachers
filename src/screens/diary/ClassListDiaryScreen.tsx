import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { scale } from '../../utils/responsive';
import { useAppSelector } from '../../store/hooks';

const CLASSES = [
  { id: '9th', name: '9th Class', icon: 'school-outline', color: '#3b82f6', bg: '#eff6ff' },
  { id: '10th', name: '10th Class', icon: 'ribbon-outline', color: '#10b981', bg: '#ecfdf5' },
  { id: '1st Year', name: '1st Year', icon: 'book-outline', color: '#8b5cf6', bg: '#f5f3ff' },
  { id: '2nd Year', name: '2nd Year', icon: 'library-outline', color: '#f59e0b', bg: '#fffbeb' },
];

export const DiaryScreen: React.FC = () => {
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Class Diary</Text>
        <View style={{ width: scale(30) }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerArea}>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Select a class to view or add daily diaries.
          </Text>
        </View>

        <View style={styles.grid}>
          {dynamicClasses.map((cls) => {
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
                    Manage Diary
                  </Text>
                </View>
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
    paddingVertical: scale(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    elevation: 2,
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
