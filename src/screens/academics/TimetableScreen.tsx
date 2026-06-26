import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { subscribeTimetable } from '../../store/slices/timetableSlice';
import { scale } from '../../utils/responsive';

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_EMOJIS: Record<string, string> = {
  Monday: '📅', Tuesday: '📆', Wednesday: '📋',
  Thursday: '📌', Friday: '🕌', Saturday: '📚',
};

const formatTime12Hour = (time24?: string): string => {
  if (!time24 || time24 === '--:--') return time24 || '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h.toString().padStart(2, '0')}:${mStr || '00'} ${ampm}`;
};

/**
 * Strip honorific prefixes so "Sir Iftikhar Zahid" matches profile fullname "Iftikhar Zahid".
 * Also strips Miss / Mam / Mr / Mrs / Dr / Prof etc.
 */
const stripPrefix = (name: string): string =>
  name
    .trim()
    .replace(/^(sir|miss|mam|madam|mr\.?|mrs\.?|ms\.?|dr\.?|prof\.?)\s+/i, '')
    .trim()
    .toLowerCase();

const todayName = (): string =>
  ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];

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

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────
export const AdminTimetableScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { theme, isDark } = useTheme();

  const profile: any = useAppSelector(state => state.auth.profile);
  const user = useAppSelector(state => state.auth.user);

  // Redux timetable state
  const allEntries = useAppSelector((state: any) => state.timetable?.entries || []);
  const timetableStatus = useAppSelector((state: any) => state.timetable?.status || 'idle');

  const teacherFullname = (profile?.fullname || user?.displayName || '').trim();
  const teacherNameStripped = stripPrefix(teacherFullname);

  const [selectedDay, setSelectedDay] = useState<string>(todayName() === 'Sunday' ? 'Monday' : todayName());
  const [refreshing, setRefreshing] = useState(false);

  // Subscribe to timetable via Redux (real-time snapshot)
  useEffect(() => {
    if (timetableStatus === 'idle') {
      dispatch(subscribeTimetable());
    }
  }, [dispatch, timetableStatus]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(subscribeTimetable()).finally(() => setRefreshing(false));
  }, [dispatch]);

  // ── Filter entries for this teacher & selected day ──
  const filteredEntries = React.useMemo(() => {
    if (!teacherNameStripped || !allEntries.length) return [];

    // Get Monday entries to use as canonical dedup set
    const mondayEntries = allEntries.filter((e: any) => e.day === 'Monday');
    const mondayKeys = new Set(
      mondayEntries.map((e: any) =>
        `${(e.subject || '').toLowerCase()}|${(e.class || '').toLowerCase()}|${e.period || ''}`
      )
    );

    return allEntries
      .filter((e: any) => {
        if (!e.subject?.trim() || !e.class?.trim()) return false;
        if (e.day !== selectedDay) return false;

        // Match teacher by stripping honorific prefix from stored name
        const storedTeacher = e.instructor || e.teacher || '';
        const storedStripped = stripPrefix(storedTeacher);
        if (!storedStripped || !storedStripped.includes(teacherNameStripped) && !teacherNameStripped.includes(storedStripped)) {
          return false;
        }

        // Dedup against Monday (canonical truth)
        if (mondayEntries.length > 0 && selectedDay !== 'Monday') {
          const key = `${(e.subject || '').toLowerCase()}|${(e.class || '').toLowerCase()}|${e.period || ''}`;
          if (!mondayKeys.has(key)) return false;
        }

        return true;
      })
      .sort((a: any, b: any) => {
        const numA = parseInt((a.period || '0').replace(/\D/g, ''), 10);
        const numB = parseInt((b.period || '0').replace(/\D/g, ''), 10);
        return numA - numB;
      });
  }, [allEntries, teacherNameStripped, selectedDay]);

  const today = todayName();
  const loading = timetableStatus === 'loading';

  // ──────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={scale(22)} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>My Timetable</Text>
          <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
            {filteredEntries.length} period{filteredEntries.length !== 1 ? 's' : ''} — {selectedDay}
          </Text>
        </View>
        {loading && <ActivityIndicator size="small" color={theme.primary} />}
      </View>

      {/* ── Day Tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}
        contentContainerStyle={styles.tabBarContent}
      >
        {DAYS_ORDER.map(day => {
          const isSelected = day === selectedDay;
          const isToday = day === today;
          return (
            <TouchableOpacity
              key={day}
              onPress={() => setSelectedDay(day)}
              style={[
                styles.tab,
                isSelected && { backgroundColor: theme.primary + '1A' },
                isToday && !isSelected && { borderBottomWidth: 2, borderBottomColor: theme.primary + '55' },
              ]}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: scale(10), marginBottom: scale(1) }}>{DAY_EMOJIS[day]}</Text>
              <Text style={[
                styles.tabLabel,
                { color: isSelected ? theme.primary : theme.textSecondary },
                isSelected && { fontWeight: '800' },
              ]}>
                {day.slice(0, 3).toUpperCase()}
              </Text>
              {isToday && (
                <View style={[styles.todayDot, { backgroundColor: theme.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Content ── */}
      {loading && !allEntries.length ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading timetable...</Text>
        </View>
      ) : filteredEntries.length === 0 ? (
        <View style={styles.center}>
          <View style={[styles.emptyIcon, { backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : '#eff6ff' }]}>
            <Ionicons name="calendar-outline" size={scale(40)} color={theme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No Classes Today</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            No periods scheduled for {selectedDay}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
        >
          {/* Today badge */}
          {selectedDay === today && (
            <View style={[styles.todayBadge, { backgroundColor: theme.primary + '15' }]}>
              <Ionicons name="sunny-outline" size={scale(13)} color={theme.primary} />
              <Text style={[styles.todayBadgeText, { color: theme.primary }]}>Today's Schedule</Text>
            </View>
          )}

          <View style={styles.listContainer}>
            {filteredEntries.map((e: any, index: number) => {
              const isActive = false; // We can add current time check if needed, but for now just simple dots
              return (
                <View key={e.id || index} style={{ flexDirection: 'row', alignItems: 'stretch' }}>
                  {/* Timeline Left */}
                  <View style={{ width: scale(24), alignItems: 'center', marginRight: scale(4) }}>
                    <View style={[{ width: scale(10), height: scale(10), borderRadius: scale(5), marginTop: scale(20), zIndex: 2, backgroundColor: isDark ? '#3b82f6' : '#60a5fa', shadowColor: '#3b82f6', shadowOffset: {width: 0, height: 0}, shadowOpacity: 0.5, shadowRadius: 3, elevation: 2 }]} />
                    {index < filteredEntries.length - 1 && (
                      <View style={{ position: 'absolute', top: scale(30), bottom: -scale(14), width: 2, backgroundColor: isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.3)' }} />
                    )}
                  </View>

                  {/* Card Main */}
                  <View style={{ flex: 1, marginBottom: scale(12) }}>
                    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      {/* Period Badge */}
                      <View style={[styles.periodBadge, { backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff', borderColor: theme.primary, borderWidth: 1 }]}>
                        <Text style={[styles.periodLabel, { color: theme.primary }]}>Lec</Text>
                        <Text style={[styles.periodNum, { color: theme.primary }]}>{e.period || '—'}</Text>
                      </View>

                      {/* Main Info */}
                      <View style={styles.cardMain}>
                        <Text style={[styles.subjectText, { color: theme.text }]} numberOfLines={1}>
                          {e.subject}
                        </Text>
                        <View style={[styles.row, { marginTop: scale(4) }]}>
                          <View style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff', paddingHorizontal: scale(6), paddingVertical: scale(3), borderRadius: scale(6), flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="time" size={scale(10)} color={theme.primary} style={{ marginRight: scale(4) }} />
                            <Text style={{ fontSize: scale(10), color: theme.primary, fontWeight: '800' }}>
                              {(e.startTime || e.endTime)
                                ? `${formatTime12Hour(e.startTime)}${e.endTime ? ` – ${formatTime12Hour(e.endTime)}` : ''}`
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
                </View>
              );
            })}
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
  headerTitle: { fontSize: scale(17), fontWeight: '800' },
  headerSub: { fontSize: scale(11), marginTop: scale(1) },

  // Day Tabs
  tabBar: {
    maxHeight: scale(58),
    borderBottomWidth: 0.5,
  },
  tabBarContent: {
    paddingHorizontal: scale(8),
    alignItems: 'center',
  },
  tab: {
    alignItems: 'center',
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    borderRadius: scale(10),
    marginHorizontal: scale(2),
    minWidth: scale(52),
  },
  tabLabel: { fontSize: scale(11), fontWeight: '600', letterSpacing: 0.5 },
  todayDot: {
    width: scale(4), height: scale(4),
    borderRadius: scale(2),
    marginTop: scale(2),
  },

  // Today badge
  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(5),
    alignSelf: 'flex-start',
    paddingHorizontal: scale(12),
    paddingVertical: scale(5),
    borderRadius: scale(20),
    marginBottom: scale(12),
  },
  todayBadgeText: { fontSize: scale(11), fontWeight: '700' },

  // Content
  content: { padding: scale(14), paddingBottom: scale(30) },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: scale(10), padding: scale(30) },
  loadingText: { fontSize: scale(13), marginTop: scale(4) },
  emptyIcon: {
    width: scale(80), height: scale(80),
    borderRadius: scale(40),
    justifyContent: 'center', alignItems: 'center',
    marginBottom: scale(4),
  },
  emptyTitle: { fontSize: scale(18), fontWeight: '800' },
  emptySubtitle: { fontSize: scale(13), textAlign: 'center' },

  // List
  listContainer: { gap: scale(8) },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(12),
    borderRadius: scale(12),
    borderWidth: 0.5,
    gap: scale(10),
  },
  periodBadge: {
    width: scale(38), height: scale(38),
    borderRadius: scale(10),
    alignItems: 'center', justifyContent: 'center',
  },
  periodNum: { fontSize: scale(14), fontWeight: '800', lineHeight: scale(16) },
  periodLabel: { fontSize: scale(8), fontWeight: '700' },
  separator: { width: 1, height: scale(40), borderRadius: 1 },
  cardMain: { flex: 1 },
  subjectText: { fontSize: scale(13), fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: scale(4), marginTop: scale(2) },
  metaText: { fontSize: scale(11), fontWeight: '500' },
  classChip: {
    paddingHorizontal: scale(8), paddingVertical: scale(4),
    borderRadius: scale(8),
  },
  classChipText: { color: '#fff', fontSize: scale(11), fontWeight: '800' },
});
