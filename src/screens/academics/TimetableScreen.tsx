import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../api/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

import { useAppSelector } from '../../store/hooks';
import { scale } from '../../utils/responsive';

// ──────────────────────────────────────────────
// Types — mirrors Dashboard TimetablePage
// ──────────────────────────────────────────────
export interface TimetableEntry {
  id: string;
  day: string;
  period: string;
  subject: string;
  class: string;
  teacher: string;
  room: string;
  startTime: string;
  endTime: string;
  gender?: string;
}

const CLASS_OPTIONS = ['9th', '10th', '1st Year', '2nd Year'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const formatTime12Hour = (time24?: string) => {
  if (!time24 || time24 === '--:--') return time24;
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h.toString().padStart(2, '0')}:${mStr || '00'} ${ampm}`;
};

const emptyForm = (): Partial<TimetableEntry> => ({
  day: '', period: '', subject: '', class: '', teacher: '', room: '', startTime: '', endTime: '',
});

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────
export const AdminTimetableScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();

  const teachers = useAppSelector(state => state.teachers.list);
  const profile: any = useAppSelector(state => state.auth.profile);
  const user = useAppSelector(state => state.auth.user);
  const isTeacher = (profile?.role || '').toLowerCase() === 'teacher';
  const teacherSubject = profile?.class || profile?.subject || '';
  const teacherSubjectsList = profile?.subjects?.map((s: string) => s.toLowerCase()) || (teacherSubject ? teacherSubject.split(',').map((s: string) => s.trim().toLowerCase()) : []);
  const teacherName = profile?.fullname || user?.displayName || '';

  // ── Local state (flat entries, matches dashboard model) ──
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch flat timetable docs (same collection as Dashboard) ──
  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'timetable'));
      const parsedEntries: TimetableEntry[] = [];
      
      snap.docs.forEach(d => {
        const data = d.data();
        if (Array.isArray(data.classes)) {
          // New schema: timetable/{dayName} with classes[]
          data.classes.forEach((cls: any) => {
            parsedEntries.push({
              id: `${d.id}_${Math.random()}`,
              day: d.id,
              ...cls
            } as TimetableEntry);
          });
        } else {
          // Old schema fallback
          parsedEntries.push({ id: d.id, ...data } as TimetableEntry);
        }
      });
      setEntries(parsedEntries);
    } catch (e) {
      console.error('Failed to fetch timetable:', e);
    }
    setLoading(false);
  };

  // ── Filtering ──
  const todayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
  const targetDay = todayName;

  const filtered = entries.filter((e) => {
    if (isTeacher) {
      const eSubjectLower = e.subject?.toLowerCase() || '';
      const subjectMatch = teacherSubjectsList.includes(eSubjectLower);
      const nameMatch = teacherName && e.teacher?.toLowerCase() === teacherName.toLowerCase();
      
      // Teacher only sees their own assigned classes/periods
      if (!subjectMatch && !nameMatch) {
          return false;
      }
    }

    // Show only one day's lectures (today)
    if (e.day !== targetDay) return false;

    return true;
  });

  const sortedFiltered = [...filtered].sort((a, b) => {
    const numA = parseInt(a.period?.replace(/\D/g, '') || '0', 10);
    const numB = parseInt(b.period?.replace(/\D/g, '') || '0', 10);
    return numA - numB;
  });



  // ──────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      {/* ─── Header ─── */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Timetable ({targetDay})</Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]}>{filtered.length} periods scheduled</Text>
        </View>
      </View>

      {/* ─── Content ─── */}
      {targetDay === 'Sunday' ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: scale(30) }}>
          <View style={{ width: scale(80), height: scale(80), borderRadius: scale(40), backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: scale(16) }}>
            <Ionicons name="cafe-outline" size={scale(40)} color="#3b82f6" />
          </View>
          <Text style={{ fontSize: scale(20), fontWeight: '800', color: theme.text, marginBottom: scale(8) }}>Enjoy your Sunday!</Text>
          <Text style={{ fontSize: scale(14), color: theme.textSecondary, textAlign: 'center', lineHeight: scale(22) }}>There are no classes scheduled for today.{'\n'}Take this time to rest and recharge.</Text>
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={40} color={theme.border} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No timetable entries found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.listContainer}>
            {sortedFiltered.map((e) => (
              <View key={e.id} style={[styles.periodCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    {/* Period Number */}
                    <View style={styles.periodLeft}>
                      <View style={[styles.periodCircle, { backgroundColor: theme.primary + '15' }]}>
                        <Text style={[styles.periodNumber, { color: theme.primary }]}>{e.period || '—'}</Text>
                      </View>
                    </View>
                    
                    {/* Main Details (Subject, Time, Teacher) */}
                    <View style={styles.periodMain}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(6), marginBottom: scale(4) }}>
                        <Text style={[styles.subjectTitle, { color: theme.text, marginBottom: 0 }]} numberOfLines={1}>
                          {e.subject}
                        </Text>
                        {e.gender && e.gender !== 'All' && (
                          <View style={{ backgroundColor: e.gender === 'Boys' ? 'rgba(37,99,235,0.1)' : 'rgba(219,39,119,0.1)', paddingHorizontal: scale(6), paddingVertical: scale(2), borderRadius: scale(4) }}>
                            <Text style={{ fontSize: scale(10), fontWeight: '700', color: e.gender === 'Boys' ? '#3b82f6' : '#ec4899' }}>
                              {e.gender === 'Boys' ? 'Boys' : 'Girls'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.detailsRow}>
                        <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
                        <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                          {(e.startTime || e.endTime) ? `${formatTime12Hour(e.startTime)}${e.endTime ? ` - ${formatTime12Hour(e.endTime)}` : ''}` : 'Time not set'}
                        </Text>
                      </View>
                      <View style={styles.detailsRow}>
                        <Ionicons name="person-outline" size={12} color={theme.textSecondary} />
                        <Text style={[styles.detailText, { color: theme.textSecondary }]} numberOfLines={1}>
                          {e.teacher || 'Unassigned'}
                        </Text>
                      </View>
                    </View>

                    {/* Right Side (Class, Room) */}
                    <View style={styles.periodRight}>
                       <View style={[styles.classChipSmall, { backgroundColor: theme.primary, borderColor: theme.primary }]}>
                         <Text style={[styles.classChipText, { color: '#fff' }]}>{e.class || '—'}</Text>
                       </View>
                       {e.room ? (
                         <View style={styles.roomRow}>
                           <Text style={[styles.roomTextSmall, { color: theme.textSecondary }]} numberOfLines={1}>Class Room {e.room}</Text>
                         </View>
                       ) : null}
                    </View>
                  </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// ──────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(14),
    paddingVertical: scale(12),
    borderBottomWidth: 0.5,
    gap: scale(10),
  },
  backBtn: { padding: scale(2) },
  headerTitle: { fontSize: scale(17), fontWeight: '700' },
  headerSub: { fontSize: scale(12), marginTop: scale(1) },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(8),
    gap: scale(4),
  },
  addBtnText: { color: '#fff', fontSize: scale(13), fontWeight: '600' },

  // Filters
  filterBar: { paddingHorizontal: scale(14), paddingVertical: scale(10), gap: scale(8) },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scale(8),
    borderWidth: 1,
    paddingHorizontal: scale(10),
    gap: scale(6),
  },
  searchInput: { flex: 1, fontSize: scale(13), paddingVertical: scale(8) },
  chipRow: { flexDirection: 'row', marginTop: scale(4) },
  chip: {
    borderWidth: 1,
    borderRadius: scale(16),
    paddingHorizontal: scale(12),
    paddingVertical: scale(5),
    marginRight: scale(6),
  },
  chipText: { fontSize: scale(12), fontWeight: '600' },

  // Content
  content: { padding: scale(14), paddingBottom: scale(30) },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: scale(8) },
  loadingText: { fontSize: scale(13), marginTop: scale(4) },
  emptyText: { fontSize: scale(13), marginTop: scale(8) },

  // Day sections
  daySection: { marginBottom: scale(18) },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(8),
    gap: scale(6),
  },
  dayIcon: { fontSize: scale(14) },
  dayTitle: { fontSize: scale(13), fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  dayCount: { fontSize: scale(11), fontWeight: '500' },

  // Card List Styles
  listContainer: { gap: scale(6) },
  periodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(10),
    borderRadius: scale(10),
    borderWidth: 0.5,
  },
  periodLeft: {
    width: scale(38),
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodCircle: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodNumber: { fontSize: scale(12), fontWeight: '700' },
  periodMain: {
    flex: 1,
    paddingLeft: scale(10),
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(128,128,128,0.2)',
  },
  subjectTitle: { fontSize: scale(13), fontWeight: '700', marginBottom: scale(2) },
  detailsRow: { flexDirection: 'row', alignItems: 'center', gap: scale(4), marginTop: scale(2) },
  detailText: { fontSize: scale(11), fontWeight: '500' },
  periodRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: scale(6),
  },
  classChipSmall: {
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(4),
    borderWidth: 0.5,
    marginBottom: scale(4),
  },
  classChipText: { fontSize: scale(10), fontWeight: '700' },
  roomRow: { flexDirection: 'row', alignItems: 'center' },
  roomTextSmall: { fontSize: scale(10), fontWeight: '600' },

});

