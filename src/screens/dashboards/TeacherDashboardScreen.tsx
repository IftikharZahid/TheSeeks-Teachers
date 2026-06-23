import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, RefreshControl, Linking, Dimensions, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useTheme } from '../../context/ThemeContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../api/firebaseConfig';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { scale } from '../../utils/responsive';
import type { RootState } from '../../store/store';

import {
  initExamsListener,
  initTimetableListener,
  initStudentsListener,
  initExamSettingsListener,
} from "../../store/slices/adminSlice";
import { selectUnreadMessagesCount, loadLastReadTimestamp, initMessagesListener } from '../../store/slices/messagesSlice';
import { fetchTeacherAssignments } from '../../store/slices/assignmentsSlice';
import { initAppSettingsListener } from '../../store/slices/appSettingsSlice';
import { initNotificationsListener } from '../../store/slices/notificationsSlice';
import { fetchAllAttendanceRecords } from '../../store/slices/attendanceSlice';

const { width } = Dimensions.get('window');

const selectTotalClasses = (state: RootState) => {
  const exams = state.admin.exams || [];
  const uniqueClasses = new Set<string>(['8th', '9th', '10th', '1st Year', '2nd Year']);
  exams.forEach((e: any) => {
    const cls = (e.studentClass || '').trim();
    if (cls) {
      // Standardize the casing when checking uniqueness to match ClassesListScreen
      const isKnown = Array.from(uniqueClasses).some(k => k.toLowerCase() === cls.toLowerCase());
      if (!isKnown) {
        uniqueClasses.add(cls);
      }
    }
  });
  return uniqueClasses.size;
};

const selectUnreadNotices = (state: RootState) => {
  const notices = state.notifications.notices;
  const readIds = state.notifications.readIds;
  return notices.filter((n: any) => !readIds.includes(n.id)).length;
};

const selectTotalMessages = (state: RootState) => state.messages.list.length;

const quickActions = [
  { key: 'attendance', label: 'Attendance', icon: 'people' as const, color: '#f43f5e', bg: '#ffe4e6', screen: 'AttendanceClassesListScreen', root: true },
  { key: 'diary', label: 'Diary', icon: 'book' as const, color: '#3b82f6', bg: '#eff6ff', screen: 'DiaryScreen', root: true },
  { key: 'results', label: 'Exams', icon: 'document-text' as const, color: '#8b5cf6', bg: '#f5f3ff', screen: 'ClassesListScreen', root: true },
  { key: 'timetable', label: 'Timetable', icon: 'time' as const, color: '#10b981', bg: '#ecfdf5', screen: 'AdminTimetable', root: true },
  { key: 'notices', label: 'e-Library', icon: 'library' as const, color: '#f59e0b', bg: '#fffbeb', screen: 'LibraryScreen', root: true },
  { key: 'assignments', label: 'Assignments', icon: 'clipboard' as const, color: '#ec4899', bg: '#fdf2f8', screen: 'TeacherAssignmentsScreen', root: true },
  { key: 'messages', label: 'Messages', icon: 'mail' as const, color: '#0ea5e9', bg: '#f0f9ff', screen: 'MessagesScreen', root: true },
  { key: 'suggestions', label: 'Suggestions', icon: 'bulb' as const, color: '#f59e0b', bg: '#fffbeb', screen: 'TeacherSuggestionsScreen', root: true },
];

export const TeacherDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { theme, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();

  const profileData = useAppSelector(s => s.auth.profile);
  const user = useAppSelector(s => s.auth.user);

  const examsLoading = useAppSelector(s => s.admin.examsLoading);
  const timetableLoading = useAppSelector(s => s.admin.timetableLoading);
  const [refreshing, setRefreshing] = useState(false);
  const unsubsRef = useRef<(() => void)[]>([]);
  const [showSideMenu, setShowSideMenu] = useState(false);

  const handleLogout = async () => {
    try {
      setShowSideMenu(false);
      await signOut(auth);
    } catch (e) {
      console.log('Error signing out', e);
    }
  };

  useEffect(() => {
    const unsubs = [
      initExamsListener(dispatch),
      initTimetableListener(dispatch),
      initStudentsListener(dispatch),
      initExamSettingsListener(dispatch),
      initNotificationsListener(dispatch),
      initAppSettingsListener(dispatch),
      initMessagesListener(dispatch, profileData),
    ];
    dispatch(loadLastReadTimestamp());
    dispatch(fetchAllAttendanceRecords());
    
    const rawTeacherName = profileData?.fullname || user?.displayName || 'Teacher';
    if (rawTeacherName) {
      dispatch(fetchTeacherAssignments({ teacherName: rawTeacherName, forceRefresh: false }));
    }

    unsubsRef.current = unsubs;

    return () => {
      unsubs.forEach(u => {
        if (typeof u === 'function') u();
      });
    };
  }, [dispatch, profileData?.fullname, user?.displayName]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    unsubsRef.current.forEach(u => {
      if (typeof u === 'function') u();
    });
    unsubsRef.current = [
      initExamsListener(dispatch),
      initTimetableListener(dispatch),
      initStudentsListener(dispatch),
      initExamSettingsListener(dispatch),
      initNotificationsListener(dispatch),
      initAppSettingsListener(dispatch),
      initMessagesListener(dispatch, profileData),
    ];
    dispatch(loadLastReadTimestamp());
    dispatch(fetchAllAttendanceRecords());
    
    const rawTeacherName = profileData?.fullname || user?.displayName || 'Teacher';
    dispatch(fetchTeacherAssignments({ teacherName: rawTeacherName, forceRefresh: true }));

    await new Promise(resolve => setTimeout(resolve, 800));
    setRefreshing(false);
  }, [dispatch, profileData, user]);

  const totalClasses = useAppSelector(selectTotalClasses);
  const timetableData = useAppSelector(s => s.admin.timetable);
  
  const teacherUniqueClassesCount = React.useMemo(() => {
    const classesSet = new Set<string>();
    const teacherNameLower = (profileData?.fullname || user?.displayName || '').trim().toLowerCase();
    if (!teacherNameLower) return 0;
    Object.values(timetableData).forEach(arr => {
      arr.forEach(session => {
        if ((session.instructor || '').trim().toLowerCase() === teacherNameLower) {
          const className = (session.className || (session as any).class || '').trim();
          if (className) classesSet.add(className);
        }
      });
    });
    return classesSet.size;
  }, [timetableData, profileData?.fullname, user?.displayName]);

  // Today's schedule calculation
  const todaysSchedule = React.useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayStr = days[new Date().getDay()];
    const teacherName = (profileData?.fullname || user?.displayName || '').trim().toLowerCase();
    
    if (!teacherName || !timetableData[todayStr]) return [];

    // Build a canonical key set from Monday (master list used by admin dashboard).
    // Orphaned entries deleted from Monday but still in other day documents
    // are excluded to keep the schedule in sync with the admin panel.
    const mondaySessions = timetableData['Monday'] || [];
    const mondayKeys = new Set(
      mondaySessions.map(s => `${(s.subject || '').toLowerCase()}|${(s.className || (s as any).class || '').toLowerCase()}|${s.lectureNumber || ''}`)
    );

    return timetableData[todayStr].filter(session => {
        const hasInstructor = (session.instructor || '').trim().toLowerCase() === teacherName;
        const hasSubject = !!(session.subject || (session as any).subjectName || '').trim();
        const hasClass = !!(session.className || (session as any).class || '').trim();
        if (!hasInstructor || !hasSubject || !hasClass) return false;

        // Cross-reference against Monday if Monday data is available
        if (mondaySessions.length > 0 && todayStr !== 'Monday') {
          const key = `${(session.subject || '').toLowerCase()}|${(session.className || (session as any).class || '').toLowerCase()}|${session.lectureNumber || ''}`;
          if (!mondayKeys.has(key)) return false; // Orphaned entry — skip
        }
        return true;
    })
      .sort((a, b) => {
        // Simple string compare of start time assuming HH:MM format
        return (a.time || '').localeCompare(b.time || '');
      });
  }, [timetableData, profileData?.fullname, user?.displayName]);

  const unreadNotices = useAppSelector(selectUnreadNotices);
  const totalLibraryItems = useAppSelector((state: RootState) => state.notifications.notices.length);
  const unreadMessagesCount = useAppSelector(selectUnreadMessagesCount);
  const totalMessages = useAppSelector(selectTotalMessages);
  const totalNotifications = unreadNotices + unreadMessagesCount;

  const students = useAppSelector(s => s.admin.students);
  const assignments = useAppSelector(s => s.assignments?.assignments || []);
  const assignmentsLoading = useAppSelector(s => s.assignments?.isLoading);

  // Attendance from Redux adminDb — keyed by studentId => { date => status }
  const attendanceDb = useAppSelector(s => s.attendance.adminDb);
  const attendanceLoading = useAppSelector(s => s.attendance.adminLoading);

  // Compute today's present count across all classes the teacher teaches
  const todaysPresentCount = React.useMemo(() => {
    const teacherNameLower = (profileData?.fullname || user?.displayName || '').trim().toLowerCase();
    if (!teacherNameLower) return 0;

    // 1. Collect all classes assigned to this teacher in the timetable
    const teacherClassesSet = new Set<string>();
    Object.values(timetableData).forEach(arr => {
      arr.forEach(session => {
        if ((session.instructor || '').trim().toLowerCase() === teacherNameLower) {
          const cls = (session.className || (session as any).class || '').trim().toLowerCase();
          if (cls) teacherClassesSet.add(cls);
        }
      });
    });

    if (teacherClassesSet.size === 0) return 0;

    // 2. Build a set of studentIds whose class matches the teacher's classes
    const teacherStudentIds = new Set<string>();
    students.forEach(s => {
      const cls = (s.class || (s as any).grade || '').trim().toLowerCase();
      if (cls && teacherClassesSet.has(cls)) {
        const sid = s.uid?.trim() || s.authUid?.trim() || s.id;
        if (sid) teacherStudentIds.add(sid);
      }
    });

    if (teacherStudentIds.size === 0) return 0;

    // 3. Count how many of those students are marked 'present' today
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    let presentCount = 0;
    teacherStudentIds.forEach(sid => {
      if (attendanceDb[sid]?.[todayStr] === 'present') presentCount++;
    });
    return presentCount;
  }, [timetableData, students, attendanceDb, profileData?.fullname, user?.displayName]);

  const prevNoticesRef = useRef(unreadNotices);
  const prevMessagesRef = useRef(unreadMessagesCount);
  const bellSoundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let hasNew = false;
    if (unreadNotices > prevNoticesRef.current) hasNew = true;
    if (unreadMessagesCount > prevMessagesRef.current) hasNew = true;

    prevNoticesRef.current = unreadNotices;
    prevMessagesRef.current = unreadMessagesCount;

    if (hasNew) {
      (async () => {
        try {
          if (bellSoundRef.current) {
            await bellSoundRef.current.unloadAsync().catch(() => {});
            bellSoundRef.current = null;
          }
          const { sound } = await Audio.Sound.createAsync(
            require('../../assets/bell.wav')
          );
          bellSoundRef.current = sound;
          await sound.playAsync();
          sound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.isLoaded && status.didJustFinish) {
              sound.unloadAsync().catch(() => {});
              bellSoundRef.current = null;
            }
          });
        } catch (e) {
          console.log('Bell sound error:', e);
        }
      })();
    }

    return () => {
      if (bellSoundRef.current) {
        bellSoundRef.current.unloadAsync().catch(() => {});
        bellSoundRef.current = null;
      }
    };
  }, [unreadNotices, unreadMessagesCount]);

  const statMap: Record<string, { value: string; loading: boolean }> = {
    results: { value: `${totalClasses} Classes`, loading: examsLoading },
    timetable: { value: `${todaysSchedule.length} Lectures`, loading: timetableLoading },
    notices: { value: unreadNotices > 0 ? `${unreadNotices} New` : 'All Read', loading: false },
    messages: { value: unreadMessagesCount > 0 ? `${unreadMessagesCount} New` : 'All Read', loading: false },
    attendance: { value: 'Manage', loading: false },
    assignments: { value: `${assignments.length} Total`, loading: assignmentsLoading },
    diary: { value: 'Manage', loading: false },
    suggestions: { value: 'Submit', loading: false },
  };

  const displayName = profileData?.fullname || user?.displayName || 'Teacher';
  const displayRole = profileData?.role
    ? profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1)
    : 'Senior Teacher';
  const displaySubject = profileData?.class || 'Computer Science';
  const displayImage =
    profileData?.image && profileData.image.trim() !== ''
      ? profileData.image
      : user?.photoURL && user.photoURL.trim() !== ''
        ? user.photoURL
        : null;

  const handleNavigate = (screen: string, params?: any) => {
    (navigation as any).navigate(screen, params);
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const startYear = currentMonth >= 3 ? currentYear : currentYear - 1;
  const academicYearText = `Academic Year ${startYear}-${(startYear + 1).toString().slice(-2)}`;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#f8fafc' }]}>
      {/* Top Banner: The Seeks academy style - using the exact provided background image */}
      <Image
        source={require('../../../assets/header_bg.png')}
        style={styles.headerBackground}
        resizeMode="cover"
      />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* Header Content */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerIconBtnTransparent} onPress={() => setShowSideMenu(true)}>
            <Ionicons name="menu" size={scale(26)} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Image
              source={require('../../../assets/the-seeks-logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View style={{ justifyContent: 'center' }}>
              <Text style={styles.headerTitle}>THE SEEKS ACADEMY</Text>
              <Text style={styles.headerSubtitle}>FORT ABBAS</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(5) }}>
            <TouchableOpacity onPress={toggleTheme} style={styles.headerIconBtnTransparent}>
              <Ionicons name={isDark ? "sunny" : "moon"} size={scale(24)} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => handleNavigate('LibraryScreen')}
              style={styles.headerIconBtnTransparent}
            >
              <Ionicons name="notifications-outline" size={scale(24)} color="#fff" />
              {totalNotifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{totalNotifications > 99 ? '99+' : totalNotifications}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* ─── Professional Side Drawer ─── */}
          <Modal visible={showSideMenu} transparent animationType="slide" statusBarTranslucent>
            <View style={{ flex: 1, flexDirection: 'row' }}>
              {/* Backdrop */}
              <TouchableWithoutFeedback onPress={() => setShowSideMenu(false)}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.48)' }} />
              </TouchableWithoutFeedback>

              {/* Drawer panel */}
              <View style={{
                position: 'absolute', top: 0, bottom: 0, left: 0,
                width: scale(252),
                backgroundColor: theme.card,
                borderTopRightRadius: scale(20),
                borderBottomRightRadius: scale(20),
                shadowColor: '#000', shadowOffset: { width: 6, height: 0 },
                shadowOpacity: 0.18, shadowRadius: 16, elevation: 18,
                overflow: 'hidden',
              }}>
                <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>

                  {/* ── Avatar / Profile header ── */}
                  <View style={{
                    backgroundColor: isDark ? '#0f172a' : '#1e3a8a',
                    paddingHorizontal: scale(16), paddingTop: scale(20), paddingBottom: scale(16),
                  }}>
                    {/* Institute name row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scale(14) }}>
                      <Image
                        source={require('../../../assets/the-seeks-logo.png')}
                        style={{ width: scale(26), height: scale(26), resizeMode: 'contain', marginRight: scale(8) }}
                      />
                      <View>
                        <Text style={{ color: '#fff', fontSize: scale(12), fontWeight: '800', letterSpacing: 0.2 }}>The Seeks Academy</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: scale(9), fontWeight: '500' }}>{academicYearText}</Text>
                      </View>
                    </View>

                    {/* Teacher info row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Image
                        source={displayImage ? { uri: displayImage } : require('../../../assets/icon.png')}
                        style={{ width: scale(42), height: scale(42), borderRadius: scale(21), marginRight: scale(10), borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#fff', fontSize: scale(13), fontWeight: '700', marginBottom: scale(3) }} numberOfLines={1}>{displayName}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(6) }}>
                          <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: scale(7), paddingVertical: scale(2), borderRadius: scale(10) }}>
                            <Text style={{ color: '#fff', fontSize: scale(9), fontWeight: '700', letterSpacing: 0.3 }}>{displayRole.toUpperCase()}</Text>
                          </View>
                        </View>
                        {!!profileData?.class && (
                          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: scale(9), marginTop: scale(2) }} numberOfLines={1}>{profileData.class}</Text>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* ── Navigation sections ── */}
                  <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: scale(8) }}>

                    {/* ACADEMIC */}
                    <View style={{ paddingHorizontal: scale(16), paddingTop: scale(14), paddingBottom: scale(4) }}>
                      <Text style={{ fontSize: scale(9), fontWeight: '700', color: theme.placeholder, letterSpacing: 1.0 }}>ACADEMIC</Text>
                    </View>
                    {[
                      { icon: 'time-outline',          label: 'Timetable',    screen: 'AdminTimetable',              color: '#10b981' },
                      { icon: 'people-outline',        label: 'Attendance',   screen: 'AttendanceClassesListScreen', color: '#f43f5e' },
                      { icon: 'clipboard-outline',     label: 'Assignments',  screen: 'TeacherAssignmentsScreen',    color: '#ec4899' },
                      { icon: 'document-text-outline', label: 'Exams',        screen: 'ClassesListScreen',           color: '#8b5cf6' },
                      { icon: 'library-outline',       label: 'e-Library',    screen: 'LibraryScreen',              color: '#f59e0b' },
                      { icon: 'book-outline',          label: 'Diary',        screen: 'DiaryScreen',                color: '#3b82f6' },
                    ].map(item => (
                      <TouchableOpacity
                        key={item.screen}
                        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: scale(10), paddingHorizontal: scale(16) }}
                        activeOpacity={0.7}
                        onPress={() => { setShowSideMenu(false); handleNavigate(item.screen); }}
                      >
                        <View style={{ width: scale(30), height: scale(30), borderRadius: scale(8), backgroundColor: isDark ? item.color + '22' : item.color + '14', justifyContent: 'center', alignItems: 'center', marginRight: scale(12) }}>
                          <Ionicons name={item.icon as any} size={scale(16)} color={item.color} />
                        </View>
                        <Text style={{ flex: 1, fontSize: scale(13), fontWeight: '500', color: theme.text }}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={scale(13)} color={theme.placeholder} />
                      </TouchableOpacity>
                    ))}

                    {/* Divider */}
                    <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.border, marginHorizontal: scale(16), marginVertical: scale(8) }} />

                    {/* COMMUNICATION */}
                    <View style={{ paddingHorizontal: scale(16), paddingBottom: scale(4) }}>
                      <Text style={{ fontSize: scale(9), fontWeight: '700', color: theme.placeholder, letterSpacing: 1.0 }}>COMMUNICATION</Text>
                    </View>
                    {[
                      { icon: 'mail-outline',     label: 'Messages',    screen: 'MessagesScreen',          color: '#0ea5e9' },
                      { icon: 'bulb-outline',     label: 'Suggestions', screen: 'TeacherSuggestionsScreen', color: '#f59e0b' },
                    ].map(item => (
                      <TouchableOpacity
                        key={item.screen}
                        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: scale(10), paddingHorizontal: scale(16) }}
                        activeOpacity={0.7}
                        onPress={() => { setShowSideMenu(false); handleNavigate(item.screen); }}
                      >
                        <View style={{ width: scale(30), height: scale(30), borderRadius: scale(8), backgroundColor: isDark ? item.color + '22' : item.color + '14', justifyContent: 'center', alignItems: 'center', marginRight: scale(12) }}>
                          <Ionicons name={item.icon as any} size={scale(16)} color={item.color} />
                        </View>
                        <Text style={{ flex: 1, fontSize: scale(13), fontWeight: '500', color: theme.text }}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={scale(13)} color={theme.placeholder} />
                      </TouchableOpacity>
                    ))}

                    {/* Divider */}
                    <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.border, marginHorizontal: scale(16), marginVertical: scale(8) }} />

                    {/* ACCOUNT */}
                    <View style={{ paddingHorizontal: scale(16), paddingBottom: scale(4) }}>
                      <Text style={{ fontSize: scale(9), fontWeight: '700', color: theme.placeholder, letterSpacing: 1.0 }}>ACCOUNT</Text>
                    </View>
                    {[
                      { icon: 'person-outline',   label: 'My Profile', screen: 'ProfileScreen',  color: '#64748b' },
                      { icon: 'settings-outline', label: 'Settings',   screen: 'SettingsScreen', color: '#64748b' },
                    ].map(item => (
                      <TouchableOpacity
                        key={item.screen}
                        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: scale(10), paddingHorizontal: scale(16) }}
                        activeOpacity={0.7}
                        onPress={() => { setShowSideMenu(false); handleNavigate(item.screen); }}
                      >
                        <View style={{ width: scale(30), height: scale(30), borderRadius: scale(8), backgroundColor: isDark ? '#1e293b' : '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: scale(12) }}>
                          <Ionicons name={item.icon as any} size={scale(16)} color={isDark ? theme.placeholder : '#475569'} />
                        </View>
                        <Text style={{ flex: 1, fontSize: scale(13), fontWeight: '500', color: theme.text }}>{item.label}</Text>
                        <Ionicons name="chevron-forward" size={scale(13)} color={theme.placeholder} />
                      </TouchableOpacity>
                    ))}

                    {/* Dark mode toggle row */}
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: scale(10), paddingHorizontal: scale(16) }}
                      activeOpacity={0.7}
                      onPress={toggleTheme}
                    >
                      <View style={{ width: scale(30), height: scale(30), borderRadius: scale(8), backgroundColor: isDark ? '#1e293b' : '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: scale(12) }}>
                        <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={scale(16)} color={isDark ? '#f59e0b' : '#475569'} />
                      </View>
                      <Text style={{ flex: 1, fontSize: scale(13), fontWeight: '500', color: theme.text }}>{isDark ? 'Light Mode' : 'Dark Mode'}</Text>
                      <View style={{ width: scale(36), height: scale(20), borderRadius: scale(10), backgroundColor: isDark ? theme.primary : '#e2e8f0', justifyContent: 'center', paddingHorizontal: scale(2) }}>
                        <View style={{ width: scale(16), height: scale(16), borderRadius: scale(8), backgroundColor: '#fff', alignSelf: isDark ? 'flex-end' : 'flex-start', elevation: 2 }} />
                      </View>
                    </TouchableOpacity>
                  </ScrollView>

                  {/* ── Logout footer ── */}
                  <View style={{ paddingHorizontal: scale(14), paddingVertical: scale(12), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border }}>
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#ef444415' : '#fef2f2', borderRadius: scale(10), paddingVertical: scale(11), paddingHorizontal: scale(14), borderWidth: 1, borderColor: '#ef444430' }}
                      activeOpacity={0.75}
                      onPress={handleLogout}
                    >
                      <Ionicons name="log-out-outline" size={scale(18)} color="#ef4444" />
                      <Text style={{ flex: 1, fontSize: scale(13), fontWeight: '700', color: '#ef4444', marginLeft: scale(10) }}>Sign Out</Text>
                      <Ionicons name="chevron-forward" size={scale(14)} color="#ef444480" />
                    </TouchableOpacity>
                  </View>

                </SafeAreaView>
              </View>
            </View>
          </Modal>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: scale(20) + insets.bottom }}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        >
          {/* Profile Card */}
          <View style={[styles.profileCard, { backgroundColor: theme.card }]}>
            <View style={styles.profileLeft}>
              <View style={styles.avatarWrap}>
                <Image
                  source={
                    displayImage
                      ? { uri: displayImage }
                      : require('../../../assets/icon.png')
                  }
                  defaultSource={require('../../../assets/icon.png')}
                  style={styles.avatar}
                />
                <View style={styles.onlineDot} />
              </View>
              <Text style={[styles.profileName, { color: theme.text }]}>{displayName}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{displayRole}</Text>
              </View>
              <Text style={styles.idText}>ID: {profileData?.rollno || 'N/A'}</Text>
            </View>

            <View style={[styles.profileDividerVertical, { backgroundColor: theme.border }]} />

            <View style={styles.profileRight}>
              <View style={styles.profileGridItem}>
                <View style={[styles.detailIcon, { backgroundColor: '#eff6ff' }]}>
                  <Ionicons name="book" size={14} color="#3b82f6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Subject</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={1}>{(profileData as any)?.subject || profileData?.class || 'N/A'}</Text>
                </View>
              </View>
              <View style={[styles.profileDividerHorizontal, { backgroundColor: theme.border }]} />
              <View style={styles.profileGridItem}>
                <View style={[styles.detailIcon, { backgroundColor: '#f3e8ff' }]}>
                  <Ionicons name="school" size={14} color="#a855f7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Qualification</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={1}>{(profileData as any)?.qualification || profileData?.section || 'N/A'}</Text>
                </View>
              </View>
              <View style={[styles.profileDividerHorizontal, { backgroundColor: theme.border }]} />
              <View style={styles.profileGridItem}>
                <View style={[styles.detailIcon, { backgroundColor: '#ecfdf5' }]}>
                  <Ionicons name="briefcase" size={14} color="#10b981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Experience</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={1}>{(profileData as any)?.experience || profileData?.session || 'N/A'}</Text>
                </View>
              </View>
              <View style={[styles.profileDividerHorizontal, { backgroundColor: theme.border }]} />
              <View style={styles.profileGridItem}>
                <View style={[styles.detailIcon, { backgroundColor: '#fff7ed' }]}>
                  <Ionicons name="mail" size={14} color="#f97316" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Email</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={1}>{profileData?.email || 'N/A'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Overview Section */}
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(6) }}>
              <Ionicons name="bar-chart" size={16} color="#3b82f6" />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Overview</Text>
            </View>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: scale(4) }} onPress={() => handleNavigate('AdminTimetable')}>
              <Ionicons name="calendar-outline" size={14} color="#3b82f6" />
              <Text style={styles.linkText}>View Calendar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.overviewScroll}>
            {/* Card 1 — Classes Today (from timetable Redux) */}
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => handleNavigate('AdminTimetable')}
              style={[styles.overviewCard, { backgroundColor: isDark ? theme.card : '#faf5ff', borderColor: isDark ? theme.border : '#f3e8ff' }]}
            >
              <View style={[styles.overviewIconWrap, { backgroundColor: isDark ? 'rgba(168,85,247,0.1)' : '#f3e8ff' }]}>
                <Ionicons name="calendar" size={18} color="#a855f7" />
              </View>
              {timetableLoading
                ? <ActivityIndicator size="small" color="#a855f7" style={{ marginVertical: scale(4) }} />
                : <Text style={[styles.overviewValue, { color: theme.text }]}>{todaysSchedule.length}</Text>
              }
              <Text style={[styles.overviewLabel, { color: theme.textSecondary }]}>Classes Today</Text>
              <Text style={[styles.overviewStatus, { color: '#a855f7' }]}>Scheduled</Text>
            </TouchableOpacity>

            {/* Card 2 — Present Today (real attendance from Redux attendanceDb) */}
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => handleNavigate('AttendanceClassesListScreen')}
              style={[styles.overviewCard, { backgroundColor: isDark ? theme.card : '#f0fdf4', borderColor: isDark ? theme.border : '#dcfce7' }]}
            >
              <View style={[styles.overviewIconWrap, { backgroundColor: isDark ? 'rgba(34,197,94,0.1)' : '#dcfce7' }]}>
                <Ionicons name="people" size={18} color="#22c55e" />
              </View>
              {attendanceLoading
                ? <ActivityIndicator size="small" color="#22c55e" style={{ marginVertical: scale(4) }} />
                : <Text style={[styles.overviewValue, { color: theme.text }]}>{todaysPresentCount}</Text>
              }
              <Text style={[styles.overviewLabel, { color: theme.textSecondary }]}>Present Today</Text>
              <Text style={[styles.overviewStatus, { color: '#22c55e' }]}>Attendance</Text>
            </TouchableOpacity>

            {/* Card 3 — e-Library (total materials from notificationsSlice Redux) */}
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => handleNavigate('LibraryScreen')}
              style={[styles.overviewCard, { backgroundColor: isDark ? theme.card : '#eff6ff', borderColor: isDark ? theme.border : '#dbeafe' }]}
            >
              <View style={[styles.overviewIconWrap, { backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#dbeafe' }]}>
                <Ionicons name="library" size={18} color="#3b82f6" />
              </View>
              <Text style={[styles.overviewValue, { color: theme.text }]}>{totalLibraryItems}</Text>
              <Text style={[styles.overviewLabel, { color: theme.textSecondary }]}>e-Library</Text>
              <Text style={[styles.overviewStatus, { color: '#3b82f6' }]}>{unreadNotices > 0 ? `${unreadNotices} New` : 'Materials'}</Text>
            </TouchableOpacity>

            {/* Card 4 — Total Assignments (from assignmentsSlice Redux) */}
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => handleNavigate('TeacherAssignmentsScreen')}
              style={[styles.overviewCard, { backgroundColor: isDark ? theme.card : '#fff7ed', borderColor: isDark ? theme.border : '#ffedd5' }]}
            >
              <View style={[styles.overviewIconWrap, { backgroundColor: isDark ? 'rgba(249,115,22,0.1)' : '#ffedd5' }]}>
                <Ionicons name="clipboard" size={18} color="#f97316" />
              </View>
              {assignmentsLoading
                ? <ActivityIndicator size="small" color="#f97316" style={{ marginVertical: scale(4) }} />
                : <Text style={[styles.overviewValue, { color: theme.text }]}>{assignments.length}</Text>
              }
              <Text style={[styles.overviewLabel, { color: theme.textSecondary }]}>Total Assignments</Text>
              <Text style={[styles.overviewStatus, { color: '#f97316' }]}>Active</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Quick Access Section */}
          <View style={[styles.sectionHeader, { marginTop: scale(20) }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Access</Text>
          </View>
          
          <View style={styles.quickAccessGrid}>
            {quickActions.map(item => {
              const stat = statMap[item.key];
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.quickAccessItem, { backgroundColor: theme.card, borderColor: theme.border }]}
                  activeOpacity={0.7}
                  onPress={() => handleNavigate(item.screen, item.root)}
                >
                  <View style={[styles.quickIconBox, { backgroundColor: isDark ? item.color + '20' : item.bg }]}>
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.quickLabel, { color: theme.text }]} numberOfLines={1}>{item.label}</Text>
                    <Text style={[styles.quickStat, { color: item.color }]}>{stat.value}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Today's Schedule Section */}
          <View style={[styles.sectionHeader, { marginTop: scale(20) }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Schedule</Text>
            <TouchableOpacity onPress={() => handleNavigate('AdminTimetable')}>
              <Text style={styles.linkText}>View Timetable</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.scheduleList}>
            {todaysSchedule.length === 0 ? (
<View style={{ padding: scale(30), alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderRadius: scale(12), borderColor: theme.border, borderWidth: 1 }}>
                <Ionicons name="calendar-clear-outline" size={scale(40)} color={theme.textTertiary} />
                <Text style={{ color: theme.textSecondary, marginTop: scale(12), fontSize: scale(14), fontWeight: '500' }}>No classes scheduled for today.</Text>
              </View>
            ) : (
              todaysSchedule.map((session: any, idx: number) => {
                const formatTime = (time24: string) => {
                  if (!time24) return '';
                  const parts = time24.trim().split(':');
                  let h = parseInt(parts[0], 10);
                  if (isNaN(h)) return time24.trim();
                  let m = parts[1] || '00';
                  const isPM = h >= 12;
                  if (h > 12) h -= 12;
                  if (h === 0) h = 12;
                  return `${h}:${m} ${isPM ? 'PM' : 'AM'}`;
                };

                let displayTime = 'Time TBD';
                let start = session.startTime || (session.time && session.time.includes('-') ? session.time.split('-')[0] : session.time);
                let end = session.endTime || (session.time && session.time.includes('-') ? session.time.split('-')[1] : null);
                
                if (start && end) {
                  displayTime = `${formatTime(start)} - ${formatTime(end)}`;
                } else if (start) {
                  displayTime = formatTime(start);
                  if (session.duration) {
                    displayTime += ` - ${session.duration}`;
                  }
                }
  
                return (
                  <View key={idx} style={[styles.scheduleCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.scheduleLectureBox}>
                      <Text style={styles.scheduleLectureLabel}>Lec</Text>
                      <Text style={styles.scheduleLectureNumber}>{idx + 1}</Text>
                    </View>
                    <View style={styles.scheduleInfo}>
                      <View style={styles.scheduleRow}>
                        <Text style={[styles.scheduleSubject, { color: theme.text }]} numberOfLines={1}>{session.subject || session.subjectName || 'N/A'}</Text>
                        <View style={[styles.scheduleTimeWrap, { backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)', paddingHorizontal: scale(8), paddingVertical: scale(4), borderRadius: scale(6) }]}>
                          <Ionicons name="time" size={14} color={theme.primary || '#3b82f6'} style={{marginRight: scale(4)}} />
                          <Text style={[styles.scheduleTimeRight, { color: theme.primary || '#3b82f6', fontWeight: '800', fontSize: scale(11) }]}>{displayTime}</Text>
                        </View>
                      </View>
                      <View style={styles.scheduleRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: scale(6) }}>
                          <Text style={[styles.scheduleClassBold, { color: theme.primary || '#3b82f6', flex: 0, flexShrink: 1 }]} numberOfLines={1}>
                            {session.className || session.class || 'N/A'}
                          </Text>
                          {session.gender && session.gender !== 'All' && (
                            <View style={{ backgroundColor: session.gender === 'Boys' ? 'rgba(37,99,235,0.1)' : 'rgba(219,39,119,0.1)', paddingHorizontal: scale(6), paddingVertical: scale(2), borderRadius: scale(4) }}>
                              <Text style={{ fontSize: scale(9), fontWeight: '700', color: session.gender === 'Boys' ? '#3b82f6' : '#ec4899' }}>
                                {session.gender}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.scheduleRoom, { color: theme.textSecondary }]} numberOfLines={1}>Room: {session.room || 'TBD'}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Footer Banner */}
          <View style={[styles.footerBanner, { backgroundColor: isDark ? theme.card : '#0f172a', borderColor: isDark ? theme.border : 'transparent', borderWidth: isDark ? 1 : 0 }]}>
            <Ionicons name="ribbon" size={16} color="#fbbf24" />
            <Text style={[styles.footerText, { color: isDark ? theme.textSecondary : '#e2e8f0' }]}>Empowering Education, Inspiring Futures.</Text>
            <Text style={styles.footerYearText}>{academicYearText}</Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: scale(240),
    overflow: 'hidden',
    backgroundColor: '#030b2e',
  },
  bgBase: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#02093a',
  },
  // The Seeks logo watermark
  bgLogoWatermark: {
    position: 'absolute',
    top: scale(5),
    left: scale(10),
    width: scale(150),
    height: scale(150),
    opacity: 0.07,
    tintColor: '#4a90ff',
  },
  // Glow circle: 4 layered rings (outermost = most transparent)
  bgGlowRing4: {
    position: 'absolute',
    top: scale(-50),
    right: -width * 0.30,
    width: width * 1.0,
    height: width * 1.0,
    borderRadius: width * 0.5,
    backgroundColor: '#0d2fa0',
    opacity: 0.35,
  },
  bgGlowRing3: {
    position: 'absolute',
    top: scale(-30),
    right: -width * 0.22,
    width: width * 0.80,
    height: width * 0.80,
    borderRadius: width * 0.40,
    backgroundColor: '#1649cc',
    opacity: 0.55,
  },
  bgGlowRing2: {
    position: 'absolute',
    top: scale(-12),
    right: -width * 0.15,
    width: width * 0.62,
    height: width * 0.62,
    borderRadius: width * 0.31,
    backgroundColor: '#2563eb',
    opacity: 0.80,
  },
  bgGlowRing1: {
    position: 'absolute',
    top: scale(6),
    right: -width * 0.08,
    width: width * 0.46,
    height: width * 0.46,
    borderRadius: width * 0.23,
    backgroundColor: '#60a5fa',
    opacity: 0.75,
  },
  bgDot: {
    position: 'absolute',
    width: scale(3),
    height: scale(3),
    borderRadius: scale(1.5),
    backgroundColor: 'rgba(56,189,248,0.50)',
  },
  bgPill: {
    position: 'absolute',
    width: scale(5),
    borderRadius: scale(3),
    backgroundColor: '#60a5fa',
    transform: [{ rotate: '-45deg' }],
  },
  bgRing: {
    position: 'absolute',
    top: scale(14),
    left: width * 0.56,
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    borderWidth: 1.5,
    borderColor: '#60a5fa',
    backgroundColor: 'transparent',
  },
  bgSolidDot: {
    position: 'absolute',
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: '#2563eb',
  },
  // S-curve wave: left bump (raises on left)
  bgWaveLeft: {
    position: 'absolute',
    bottom: -width * 0.82,
    left: -width * 0.3,
    width: width * 1.0,
    height: width * 1.0,
    borderRadius: width * 0.5,
    backgroundColor: '#f8fafc',
  },
  // S-curve wave: right bump (raises on right)
  bgWaveRight: {
    position: 'absolute',
    bottom: -width * 0.9,
    right: -width * 0.25,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    backgroundColor: '#f8fafc',
  },
  // Neon glow edge on wave (left)
  bgWaveGlowLeft: {
    position: 'absolute',
    bottom: -width * 0.82 - scale(3),
    left: -width * 0.30 - scale(3),
    width: width * 1.0 + scale(6),
    height: width * 1.0 + scale(6),
    borderRadius: (width * 1.0 + scale(6)) / 2,
    borderWidth: scale(2),
    borderColor: 'rgba(59,130,246,0.7)',
    backgroundColor: 'transparent',
  },
  // Neon glow edge on wave (right)
  bgWaveGlowRight: {
    position: 'absolute',
    bottom: -width * 0.9 - scale(3),
    right: -width * 0.25 - scale(3),
    width: width * 0.9 + scale(6),
    height: width * 0.9 + scale(6),
    borderRadius: (width * 0.9 + scale(6)) / 2,
    borderWidth: scale(2),
    borderColor: 'rgba(59,130,246,0.7)',
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingTop: scale(10),
    paddingBottom: scale(20),
    zIndex: 200,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: scale(1),
  },
  headerLogo: {
    width: scale(44),
    height: scale(44),
    marginRight: scale(2),
  },
  headerTitle: {
    color: '#fff',
    fontSize: scale(17.2),
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    color: '#cbd5e1',
    fontSize: scale(11),
    fontWeight: '500',
    marginTop: scale(2),
    alignSelf: 'flex-end',
    letterSpacing: 0.5,
  },


  headerIconBtnTransparent: {
    width: scale(36),
    height: scale(36),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerIconBtnLight: {
    width: scale(36),
    height: scale(36),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    minWidth: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0f172a',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: scale(8),
    fontWeight: 'bold',
  },
  settingsDropdown: {
    position: 'absolute',
    top: scale(56),
    right: scale(16),
    width: scale(140),
    borderRadius: scale(10),
    borderWidth: 1,
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 200,
    paddingVertical: scale(4),
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(10),
    paddingHorizontal: scale(14),
    gap: scale(10),
  },
  dropdownDivider: { height: scale(1), opacity: 0.5 },
  dropdownText: { fontSize: scale(12), fontWeight: '600' },

  // Profile Card
  profileCard: {
    marginHorizontal: scale(16),
    borderRadius: scale(16),
    padding: scale(16),
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  profileLeft: {
    flex: 0.45,
    alignItems: 'center',
    paddingRight: scale(10),
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: scale(10),
  },
  avatar: {
    width: scale(70),
    height: scale(70),
    borderRadius: scale(35),
    borderWidth: scale(3),
    borderColor: '#e2e8f0',
  },
  onlineDot: {
    position: 'absolute',
    bottom: scale(2),
    right: scale(2),
    width: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileName: {
    fontSize: scale(14),
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: scale(6),
  },
  roleBadge: {
    backgroundColor: '#a855f7',
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(20),
    marginBottom: scale(6),
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: scale(9),
    fontWeight: '700',
  },
  idText: {
    color: '#64748b',
    fontSize: scale(10),
    fontWeight: '500',
  },
  profileDividerVertical: {
    width: 1,
    height: '100%',
    marginHorizontal: scale(8),
  },
  profileRight: {
    flex: 0.55,
    justifyContent: 'space-between',
    paddingLeft: scale(4),
  },
  profileGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    paddingVertical: scale(6),
  },
  profileDividerHorizontal: {
    height: 1,
    width: '100%',
    opacity: 0.5,
  },
  detailIcon: {
    width: scale(26),
    height: scale(26),
    borderRadius: scale(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: scale(9),
    fontWeight: '500',
    marginBottom: scale(2),
  },
  detailValue: {
    fontSize: scale(11),
    fontWeight: '700',
  },

  // Sections
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: scale(16),
    marginTop: scale(24),
    marginBottom: scale(12),
  },
  sectionTitle: {
    fontSize: scale(15),
    fontWeight: '800',
  },
  linkText: {
    color: '#3b82f6',
    fontSize: scale(12),
    fontWeight: '700',
  },

  // Overview Scroll
  overviewScroll: {
    paddingHorizontal: scale(16),
    gap: scale(10),
  },
  overviewCard: {
    width: scale(105),
    borderRadius: scale(12),
    padding: scale(12),
    borderWidth: 1,
    alignItems: 'center',
  },
  overviewIconWrap: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  overviewValue: {
    fontSize: scale(18),
    fontWeight: '800',
    marginBottom: scale(2),
  },
  overviewLabel: {
    fontSize: scale(10),
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: scale(8),
    lineHeight: scale(14),
  },
  overviewStatus: {
    fontSize: scale(10),
    fontWeight: '700',
  },

  // Quick Access
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: scale(16),
    justifyContent: 'space-between',
    rowGap: scale(10),
  },
  quickAccessItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(8),
    borderRadius: scale(10),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(1) },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  quickIconBox: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(8),
  },
  quickLabel: {
    fontSize: scale(12),
    fontWeight: '700',
    marginBottom: scale(1),
  },
  quickStat: {
    fontSize: scale(9),
    fontWeight: '600',
  },

  // Schedule
  scheduleList: {
    paddingHorizontal: scale(16),
    gap: scale(12),
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(10),
    borderRadius: scale(10),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(1) },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  scheduleLectureBox: {
    backgroundColor: '#eff6ff',
    paddingVertical: scale(8),
    paddingHorizontal: scale(14),
    borderRadius: scale(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  scheduleLectureLabel: {
    color: '#3b82f6',
    fontSize: scale(9),
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  scheduleLectureNumber: {
    color: '#3b82f6',
    fontSize: scale(18),
    fontWeight: '900',
  },
  scheduleInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(4),
  },
  scheduleSubject: {
    fontSize: scale(14),
    fontWeight: '800',
    flex: 1,
    marginRight: scale(8),
  },
  scheduleTimeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(6),
    paddingVertical: scale(3),
    borderRadius: scale(6),
  },
  scheduleTimeRight: {
    fontSize: scale(10),
    fontWeight: '700',
  },
  scheduleClassBold: {
    fontSize: scale(12),
    fontWeight: '800',
    flex: 1,
  },
  scheduleRoom: {
    fontSize: scale(10),
    fontWeight: '600',
  },
  schedulePill: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(20),
  },
  schedulePillText: {
    color: '#fff',
    fontSize: scale(11),
    fontWeight: '700',
  },

  // Footer
  footerBanner: {
    backgroundColor: '#0f172a',
    marginHorizontal: scale(16),
    marginTop: scale(24),
    marginBottom: scale(20),
    borderRadius: scale(12),
    paddingVertical: scale(16),
    paddingHorizontal: scale(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerText: {
    color: '#e2e8f0',
    fontSize: scale(10),
    fontWeight: '500',
    flex: 1,
    marginLeft: scale(10),
  },
  footerYearText: {
    color: '#fbbf24',
    fontSize: scale(11),
    fontWeight: '700',
  },

});

export default TeacherDashboardScreen;
