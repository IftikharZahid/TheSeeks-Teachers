import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { scale } from '../../utils/responsive';
import { useAppSelector } from '../../store/hooks';
import { db } from '../../api/firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';

const getColorForClass = (index: number) => {
  const colors = [
    { color: '#3b82f6', bg: '#eff6ff', icon: 'school-outline' },
    { color: '#10b981', bg: '#ecfdf5', icon: 'ribbon-outline' },
    { color: '#8b5cf6', bg: '#f5f3ff', icon: 'book-outline' },
    { color: '#f59e0b', bg: '#fffbeb', icon: 'library-outline' },
    { color: '#ec4899', bg: '#fdf2f8', icon: 'albums-outline' },
    { color: '#14b8a6', bg: '#f0fdfa', icon: 'analytics-outline' },
  ];
  return colors[index % colors.length];
};

export const AttendanceClassesListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();

  const students = useAppSelector((state) => state.admin.students);
  const [dynamicClasses, setDynamicClasses] = useState<string[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      const unsubscribe = onSnapshot(doc(db, 'appSettings', 'classes'), (snap) => {
        if (snap.exists() && snap.data().list) {
          setDynamicClasses(snap.data().list);
        }
      });
      return () => unsubscribe();
    }, [])
  );

  const handleSelectClass = (className: string) => {
    navigation.navigate('AdminAttendanceScreen', { selectedClass: className });
  };

  const sortedClasses = [...dynamicClasses].sort((a, b) => {
    const getWeight = (cls: string) => {
      const lower = cls.toLowerCase();
      if (lower.includes('1st year')) return 11;
      if (lower.includes('2nd year')) return 12;
      if (lower.includes('prep')) return 0;
      if (lower.includes('nursery')) return -1;
      const match = cls.match(/(\d+)/);
      if (match) return parseInt(match[1], 10);
      return 99;
    };
    return getWeight(a) - getWeight(b);
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: StatusBar.currentHeight || 0 }]}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: StatusBar.currentHeight || 0, backgroundColor: theme.primary, zIndex: 999 }} />
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent={true} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary, borderBottomColor: 'transparent' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#ffffff' }]}>Manage Attendance</Text>
        <View style={[styles.totalStrengthBadge, { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)' }]}>
          <Text style={[styles.totalStrengthText, { color: '#ffffff' }]}>
            {students.length} Total
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerArea}>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Select a class to view or add attendance records.
          </Text>
        </View>

        <View style={styles.grid}>
          {sortedClasses.map((className, index) => {
            const classStudentsCount = students.filter((s: any) => (s.class || s.grade) === className).length;
            const styleTheme = getColorForClass(index);
            
            return (
              <TouchableOpacity
                key={className}
                style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
                activeOpacity={0.7}
                onPress={() => handleSelectClass(className)}
              >
                <View style={[styles.iconContainer, { backgroundColor: isDark ? styleTheme.color + '20' : styleTheme.bg }]}>
                  <Ionicons name={styleTheme.icon as any} size={scale(28)} color={styleTheme.color} />
                </View>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{className}</Text>
                
                <View style={[styles.badge, { backgroundColor: styleTheme.color + '18' }]}>
                  <Text style={[styles.badgeText, { color: styleTheme.color }]}>
                    {classStudentsCount} Students
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
    marginTop: -1,
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
  totalStrengthBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  totalStrengthText: {
    fontSize: scale(11),
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

export default AttendanceClassesListScreen;

