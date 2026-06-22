import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput, ActivityIndicator, Alert, Platform, ScrollView, KeyboardAvoidingView, Keyboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../api/firebaseConfig';
import { useTheme } from '../../context/ThemeContext';
import { scale } from '../../utils/responsive';
import { useAppSelector } from '../../store/hooks';

interface DiaryEntry {
  id: string;
  className: string;
  subject: string;
  title: string;
  details: string;
  date: Date | null;
  audience?: string;
  createdAt: any;
}

const fmt = (d: Date) => {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS  = ['S','M','T','W','T','F','S'];

export const ClassDiaryScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const selectedClass = route.params?.selectedClass || 'Unknown Class';
  
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [date, setDate] = useState(new Date());
  const [audience, setAudience] = useState('Both');
  const [showAudiencePicker, setShowAudiencePicker] = useState(false);
  
  const profile = useAppSelector((state) => state.auth.profile);
  const teachers = useAppSelector((state) => state.teachers.list);
  const currentTeacher = teachers.find(t => t.name === profile?.fullname);

  const teacherSubjectStr = profile?.class || profile?.subject || '';
  const teacherSubjectsList = profile?.subjects || (teacherSubjectStr ? teacherSubjectStr.split(',').map((s: string) => s.trim()) : []);
  const defaultSubject = teacherSubjectsList.length > 0 ? teacherSubjectsList[0] : (profile?.class || profile?.subject || profile?.role || 'General');
  
  const [selectedSubject, setSelectedSubject] = useState(defaultSubject);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [viewedDate, setViewedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  const [selectedDateStr, setSelectedDateStr] = useState(fmt(new Date()));

  const weekDays = React.useMemo(() => {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const startDay = new Date(y, m - 1, diff);
    
    return Array.from({ length: 7 }, (_, i) => {
      const dt = new Date(startDay);
      dt.setDate(startDay.getDate() + i);
      return dt;
    });
  }, [selectedDateStr]);

  const prevWeek = () => {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const nextDate = new Date(y, m - 1, d - 7);
    setSelectedDateStr(fmt(nextDate));
  };
  const nextWeek = () => {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const nextDate = new Date(y, m - 1, d + 7);
    setSelectedDateStr(fmt(nextDate));
  };

  // Android adjustResize handles keyboard natively
  // Fetch Diaries
  useEffect(() => {
    const q = query(collection(db, 'diaries'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: DiaryEntry[] = [];
      const now = new Date();

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        
        // Check age of the diary
        const diaryDate = data.date ? data.date.toDate() : (data.createdAt ? data.createdAt.toDate() : new Date());
        const ageInMs = now.getTime() - diaryDate.getTime();
        const ageInDays = ageInMs / (1000 * 60 * 60 * 24);

        // If older than 7 days, delete it automatically
        if (ageInDays > 7) {
          deleteDoc(doc(db, 'diaries', docSnap.id)).catch(e => console.log('Auto-delete old diary failed:', e));
          return; // skip adding to UI
        }

        if (data.className === selectedClass) {
          list.push({
            id: docSnap.id,
            className: data.className,
            subject: data.subject,
            title: data.title,
            details: data.details,
            date: data.date ? data.date.toDate() : null,
            audience: data.audience || 'Both',
            createdAt: data.createdAt,
          });
        }
      });
      setEntries(list);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching diaries: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedClass]);

  const handleSave = async () => {
    if (!title || !details) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    
    setSubmitting(true);
    try {
      if (editingEntryId) {
        await updateDoc(doc(db, 'diaries', editingEntryId), {
          title,
          details,
          date,
          audience,
        });
      } else {
        await addDoc(collection(db, 'diaries'), {
          className: selectedClass,
          subject: selectedSubject,
          title,
          details,
          date,
          audience,
          teacherId: currentTeacher?.id || profile?.fullname || '',
          createdAt: serverTimestamp(),
        });
      }
      
      setSubmitting(false);
      setModalVisible(false);
      setTitle('');
      setDetails('');
      setDate(new Date());
      setAudience('Both');
      setEditingEntryId(null);
    } catch (error) {
      console.error('Error saving diary: ', error);
      setSubmitting(false);
      Alert.alert('Error', 'Could not save diary entry.');
    }
  };

  const handleEdit = (item: DiaryEntry) => {
    setTitle(item.title);
    setDetails(item.details);
    if (item.date) setDate(item.date);
    setAudience(item.audience || 'Both');
    setViewedDate(item.date || new Date());
    setEditingEntryId(item.id);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Diary',
      'Are you sure you want to delete this diary entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'diaries', id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete diary entry.');
            }
          }
        }
      ]
    );
  };

  const renderEntry = ({ item }: { item: DiaryEntry }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.iconWrap, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
            <Ionicons name="book-outline" size={scale(14)} color="#6366f1" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
              {item.audience && item.audience !== 'Both' && (
                <View style={[styles.audienceBadge, { backgroundColor: item.audience === 'Boys' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(236, 72, 153, 0.1)' }]}>
                  <Text style={[styles.audienceBadgeText, { color: item.audience === 'Boys' ? '#3b82f6' : '#ec4899' }]}>{item.audience}</Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: scale(2) }}>
              <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>{item.subject}</Text>
              <Text style={{ color: theme.textTertiary, marginHorizontal: scale(4), fontSize: scale(10) }}>•</Text>
              <Text style={[styles.cardDate, { color: theme.textTertiary }]}>
                {item.date ? item.date.toLocaleDateString() : ''}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
            <Ionicons name="pencil-outline" size={scale(15)} color="#6366f1" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={scale(15)} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[styles.cardDetails, { color: theme.text }]} selectable>
        {item.details}
      </Text>
    </View>
  );

  const renderCustomCalendar = () => {
    const startOfWeek = new Date(viewedDate);
    startOfWeek.setDate(viewedDate.getDate() - viewedDate.getDay());

    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i));
    }

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <View style={[styles.calendarContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => {
            const newDate = new Date(viewedDate);
            newDate.setDate(viewedDate.getDate() - 7);
            setViewedDate(newDate);
          }}>
            <Ionicons name="chevron-back" size={scale(20)} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.calendarMonthText, { color: theme.text }]}>
            {viewedDate.toLocaleString('default', { month: 'short' })} {viewedDate.getFullYear()}
          </Text>
          <TouchableOpacity onPress={() => {
            const newDate = new Date(viewedDate);
            newDate.setDate(viewedDate.getDate() + 7);
            setViewedDate(newDate);
          }}>
            <Ionicons name="chevron-forward" size={scale(20)} color={theme.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekDaysRow}>
          {weekDays.map((wd, idx) => (
            <Text key={idx} style={[styles.weekDayText, idx === 0 ? { color: '#ef4444' } : { color: theme.textSecondary }]}>
              {wd}
            </Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {days.map((d, idx) => {
            if (!d) return <View key={`empty-${idx}`} style={styles.dayCell} />;
            
            const isSunday = d.getDay() === 0;
            const isSelected = d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();

            return (
              <TouchableOpacity 
                key={idx} 
                style={[
                  styles.dayCell, 
                  isSelected && !isSunday && { backgroundColor: theme.primary, borderRadius: scale(8) },
                  isSunday && { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: scale(8) }
                ]}
                onPress={() => {
                  if (isSunday) {
                    Alert.alert('Not Allowed', 'You cannot add diary entries on Sundays.');
                  } else {
                    setDate(d);
                    setShowDatePicker(false);
                  }
                }}
              >
                <Text style={[
                  styles.dayText, 
                  { color: isSelected && !isSunday ? '#fff' : (isSunday ? '#ef4444' : theme.text) }
                ]}>
                  {d.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // Keep a consistent padding at the bottom of the modal footer
  const buttonPaddingBottom = scale(16);

  const renderModalContent = () => (
    <>
      <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            {editingEntryId ? 'Edit Entry' : 'New Entry'}
          </Text>
          {teacherSubjectsList.length > 1 ? (
            <View style={{ zIndex: 1000 }}>
              <TouchableOpacity style={styles.subjectBadge} onPress={() => setShowSubjectPicker(!showSubjectPicker)}>
                <Text style={styles.subjectBadgeText}>{selectedSubject} ▾</Text>
              </TouchableOpacity>
              {showSubjectPicker && (
                <View style={[styles.dropdownMenu, { position: 'absolute', top: 30, left: 0, width: scale(140), backgroundColor: isDark ? '#374151' : '#fff', borderColor: theme.border }]}>
                  {teacherSubjectsList.map((subj: string, idx: number) => (
                    <TouchableOpacity 
                      key={subj} 
                      style={[styles.dropdownItem, idx === teacherSubjectsList.length - 1 && { borderBottomWidth: 0 }, { borderBottomColor: theme.border }]} 
                      onPress={() => { setSelectedSubject(subj); setShowSubjectPicker(false); }}
                    >
                      <Text style={{ color: theme.text, fontSize: scale(13) }}>{subj}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.subjectBadge}>
              <Text style={styles.subjectBadgeText}>{selectedSubject}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => {
            setModalVisible(false);
            setEditingEntryId(null);
            setTitle('');
            setDetails('');
            setShowSubjectPicker(false);
          }}
        >
          <Ionicons name="close" size={scale(20)} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.modalBody, { paddingBottom: Math.max(insets.bottom + scale(10), scale(20)) }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.label, { color: theme.textSecondary }]}>Title</Text>
        <TextInput
          style={[styles.compactInput, { backgroundColor: isDark ? '#1f2937' : '#f3f4f6', color: theme.text }]}
          placeholder="e.g. Chapter 3 Ex 3.1"
          placeholderTextColor={theme.textTertiary}
          value={title}
          onChangeText={setTitle}
          autoFocus={true}
        />

        <View style={{ flexDirection: 'row', gap: scale(12), zIndex: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Date</Text>
            <TouchableOpacity 
              style={[styles.compactDateRow, { backgroundColor: isDark ? '#1f2937' : '#f3f4f6' }]}
              onPress={() => {
                setViewedDate(date);
                setShowDatePicker(true);
                setShowAudiencePicker(false);
              }}
            >
              <Ionicons name="calendar" size={scale(18)} color="#6366f1" style={{ marginRight: scale(8) }} />
              <Text style={{ color: theme.text, fontSize: scale(14), fontWeight: '500' }}>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, zIndex: 10 }}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Audience</Text>
            <TouchableOpacity 
              style={[styles.compactDateRow, { backgroundColor: isDark ? '#1f2937' : '#f3f4f6', justifyContent: 'space-between' }]}
              onPress={() => setShowAudiencePicker(!showAudiencePicker)}
            >
              <Text style={{ color: theme.text, fontSize: scale(14), fontWeight: '500' }}>{audience}</Text>
              <Ionicons name={showAudiencePicker ? "chevron-up" : "chevron-down"} size={scale(18)} color="#6366f1" />
            </TouchableOpacity>

            {showAudiencePicker && (
              <View style={[styles.dropdownMenu, { backgroundColor: isDark ? '#374151' : '#fff', borderColor: theme.border }]}>
                {['Both', 'Boys', 'Girls'].map((opt, idx) => (
                  <TouchableOpacity 
                    key={opt} 
                    style={[styles.dropdownItem, idx === 2 && { borderBottomWidth: 0 }, { borderBottomColor: theme.border }]} 
                    onPress={() => { setAudience(opt); setShowAudiencePicker(false); }}
                  >
                    <Text style={{ color: theme.text, fontSize: scale(14) }}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
        
        {showDatePicker && renderCustomCalendar()}

        <Text style={[styles.label, { color: theme.textSecondary }]}>Details</Text>
        <TextInput
          style={[styles.compactTextArea, { backgroundColor: isDark ? '#1f2937' : '#f3f4f6', color: theme.text }]}
          placeholder="Write homework or details..."
          placeholderTextColor={theme.textTertiary}
          value={details}
          onChangeText={setDetails}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

      </ScrollView>

      <View style={[styles.modalFooter, { paddingBottom: 0 }]}>
        <TouchableOpacity 
          style={[styles.primaryButton, submitting && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Save Diary</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={scale(24)} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>{selectedClass} Diary</Text>
        <TouchableOpacity 
          style={styles.headerAddButton}
          onPress={() => {
            setEditingEntryId(null);
            setTitle('');
            setDetails('');
            setDate(new Date());
            setModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle" size={scale(28)} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Week Navigator */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: scale(12), paddingVertical: scale(8), backgroundColor: isDark ? theme.card : '#fff', borderBottomWidth: 1, borderColor: theme.border }}>
        <TouchableOpacity style={{ width: scale(30), height: scale(30), justifyContent: 'center', alignItems: 'center' }} onPress={prevWeek}>
          <Ionicons name="chevron-back" size={18} color={theme.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: scale(13), fontWeight: '700', color: theme.text }}>
          Week of {MONTH_NAMES[weekDays[0]?.getMonth() || 0]} {weekDays[0]?.getDate() || ''}
        </Text>
        <TouchableOpacity style={{ width: scale(30), height: scale(30), justifyContent: 'center', alignItems: 'center' }} onPress={nextWeek}>
          <Ionicons name="chevron-forward" size={18} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Compact Weekly Date Strip */}
      <View style={[styles.dateStrip, { borderColor: theme.border }]}>
        <View style={styles.dateStripContent}>
          {weekDays.map(day => {
            const dStr     = fmt(day);
            const isSel    = dStr === selectedDateStr;
            const isToday  = dStr === fmt(new Date());
            const hasDiary = entries.some(e => e.date && fmt(e.date) === dStr);
            const isSunday = day.getDay() === 0;

            let bgColor = isDark ? theme.background : '#f8fafc';
            let bdrColor = theme.border;
            if (isSunday) { bgColor = isDark ? 'rgba(239,68,68,0.08)' : '#FEF2F2'; bdrColor = '#EF444430'; }
            else if (isSel) { bgColor = theme.primary; bdrColor = theme.primary; }
            else if (isToday) { bgColor = theme.primary + '18'; bdrColor = theme.primary + '50'; }

            return (
              <TouchableOpacity
                key={dStr}
                style={[styles.dateCell, { backgroundColor: bgColor, borderColor: bdrColor }]}
                onPress={() => setSelectedDateStr(dStr)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateCellDay, { color: isSel ? 'rgba(255,255,255,0.8)' : isSunday ? '#EF4444' : theme.textSecondary, fontWeight: isSunday ? '700' : '500' }]}>
                  {DAY_LABELS[day.getDay()]}
                </Text>
                <Text style={[styles.dateCellNum, { color: isSel ? '#fff' : isSunday ? '#EF4444' : theme.text }]}>
                  {day.getDate()}
                </Text>
                {hasDiary && <View style={[styles.dateCellBar, { backgroundColor: isSel ? 'rgba(255,255,255,0.4)' : '#6366f1' }]} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : entries.filter(e => e.date && fmt(e.date) === selectedDateStr).length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="book-outline" size={scale(60)} color={theme.textTertiary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No diary entries for {selectedDateStr}</Text>
        </View>
      ) : (
        <FlatList
          data={entries.filter(e => e.date && fmt(e.date) === selectedDateStr)}
          keyExtractor={(item) => item.id}
          renderItem={renderEntry}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Diary Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            {renderModalContent()}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};



const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    borderBottomWidth: 1,
  },
  backButton: { padding: scale(4) },
  headerTitle: { fontSize: scale(18), fontWeight: '700', flex: 1, textAlign: 'center' },
  headerAddButton: { padding: scale(4) },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: scale(10), fontSize: scale(14), fontWeight: '500' },
  listContainer: { padding: scale(16), paddingBottom: scale(100) },
  
  dateStrip:        { borderBottomWidth: 1, maxHeight: scale(54) },
  dateStripContent: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: scale(10), paddingVertical: scale(4) },
  dateCell: { flex: 1, alignItems: 'center', borderRadius: scale(6), borderWidth: 1, paddingVertical: scale(4), marginHorizontal: scale(2), overflow: 'hidden', position: 'relative' },
  dateCellDay: { fontSize: scale(8),  fontWeight: '700' },
  dateCellNum: { fontSize: scale(13), fontWeight: '800' },
  dateCellBar: { position: 'absolute', bottom: 0, height: scale(3), borderRadius: scale(1), width: '60%' },

  
  card: {
    borderRadius: scale(10),
    padding: scale(12),
    marginBottom: scale(10),
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(6) },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconWrap: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(10),
  },
  cardTitle: { fontSize: scale(14), fontWeight: '700', flexShrink: 1 },
  cardSubtitle: { fontSize: scale(11), fontWeight: '500' },
  cardDate: { fontSize: scale(10), fontWeight: '500' },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    marginLeft: scale(10),
    padding: scale(4),
  },
  cardDetails: { fontSize: scale(12), lineHeight: scale(18) },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(20),
    paddingVertical: scale(16),
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: scale(18), fontWeight: '700' },
  subjectBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(6),
    marginTop: scale(4),
    alignSelf: 'flex-start',
  },
  subjectBadgeText: { color: '#6366f1', fontSize: scale(11), fontWeight: '600' },
  closeButton: {
    backgroundColor: 'rgba(156, 163, 175, 0.15)',
    padding: scale(6),
    borderRadius: scale(20),
  },
  modalBody: { paddingHorizontal: scale(16), paddingTop: scale(16), paddingBottom: scale(20) },
  modalFooter: {
    paddingHorizontal: scale(16),
    paddingTop: scale(12),
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  label: { fontSize: scale(12), fontWeight: '600', marginBottom: scale(4), marginLeft: scale(2) },
  compactInput: {
    borderRadius: scale(10),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    fontSize: scale(14),
    marginBottom: scale(12),
  },
  compactDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scale(10),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    marginBottom: scale(12),
  },
  compactTextArea: {
    borderRadius: scale(10),
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    fontSize: scale(14),
    height: scale(70),
    marginBottom: scale(16),
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    borderRadius: scale(14),
    paddingVertical: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: { color: '#fff', fontSize: scale(15), fontWeight: '700' },
  
  calendarContainer: {
    borderWidth: 1,
    borderRadius: scale(12),
    padding: scale(12),
    marginBottom: scale(16),
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(16),
  },
  calendarMonthText: {
    fontSize: scale(16),
    fontWeight: '700',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: scale(8),
  },
  weekDayText: {
    fontSize: scale(12),
    fontWeight: '700',
    width: scale(30),
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: scale(36),
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: scale(14),
    fontWeight: '500',
  },
  audienceBadge: {
    paddingHorizontal: scale(6),
    paddingVertical: scale(2),
    borderRadius: scale(4),
    marginLeft: scale(6),
  },
  audienceBadgeText: {
    fontSize: scale(9),
    fontWeight: '700',
  },
  dropdownMenu: {
    position: 'absolute',
    top: scale(65),
    left: 0,
    right: 0,
    borderRadius: scale(10),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 100,
  },
  dropdownItem: {
    paddingVertical: scale(10),
    paddingHorizontal: scale(12),
    borderBottomWidth: 1,
  },
});

export default ClassDiaryScreen;
