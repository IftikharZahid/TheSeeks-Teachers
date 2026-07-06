import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, FlatList, Modal, TextInput, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
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

  const renderModalContent = () => (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={[styles.modalHeader, { borderBottomColor: 'transparent', backgroundColor: theme.primary, marginTop: -1 }]}>
        <View style={styles.modalHeaderLeft}>
          <View style={[styles.modalIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
            <Ionicons name={editingEntryId ? 'pencil' : 'book'} size={scale(15)} color="#ffffff" />
          </View>
          <View>
            <Text style={[styles.modalTitle, { color: '#ffffff' }]}>
              {editingEntryId ? 'Edit Entry' : 'New Diary Entry'}
            </Text>
            <Text style={[styles.modalSubtitle, { color: 'rgba(255, 255, 255, 0.8)' }]}>
              {viewedDate.toDateString()}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(12) }}>
          <TouchableOpacity onPress={handleSave} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={{ color: '#ffffff', fontSize: scale(15), fontWeight: '700' }}>Save</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <Ionicons name="close" size={scale(24)} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable form — Save button scrolls with content */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.modalBody}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Info Cards: Subject + Date ── */}
        <View style={styles.rowTwo}>
          <TouchableOpacity
            style={[styles.infoCard, { backgroundColor: isDark ? '#1e293b' : '#eff6ff', borderColor: '#6366f120' }]}
            onPress={() => teacherSubjectsList.length > 1 && setShowSubjectPicker(!showSubjectPicker)}
            activeOpacity={teacherSubjectsList.length > 1 ? 0.7 : 1}
          >
            <View style={[styles.infoCardIcon, { backgroundColor: '#6366f115' }]}>
              <Ionicons name="library" size={scale(14)} color="#6366f1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoCardLabel, { color: '#6366f1' }]}>SUBJECT</Text>
              <Text style={[styles.infoCardValue, { color: theme.text }]} numberOfLines={1}>{selectedSubject}</Text>
            </View>
            {teacherSubjectsList.length > 1 && (
              <Ionicons name={showSubjectPicker ? 'chevron-up' : 'chevron-down'} size={scale(13)} color="#6366f1" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.infoCard, { backgroundColor: isDark ? '#1e293b' : '#f0fdf4', borderColor: '#10b98120' }]}
            onPress={() => { setViewedDate(date); setShowDatePicker(!showDatePicker); setShowSubjectPicker(false); }}
            activeOpacity={0.75}
          >
            <View style={[styles.infoCardIcon, { backgroundColor: '#10b98115' }]}>
              <Ionicons name="calendar" size={scale(14)} color="#10b981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoCardLabel, { color: '#10b981' }]}>DATE</Text>
              <Text style={[styles.infoCardValue, { color: theme.text }]}>
                {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
            <Ionicons name={showDatePicker ? 'chevron-up' : 'chevron-down'} size={scale(13)} color="#10b981" />
          </TouchableOpacity>
        </View>

        {/* Subject dropdown */}
        {showSubjectPicker && teacherSubjectsList.length > 1 && (
          <View style={[styles.compactDropdown, { backgroundColor: isDark ? '#374151' : '#fff', borderColor: theme.border }]}>
            {teacherSubjectsList.map((subj: string, idx: number) => (
              <TouchableOpacity
                key={subj}
                style={[
                  styles.compactDropdownItem,
                  { borderBottomColor: theme.border, borderBottomWidth: idx === teacherSubjectsList.length - 1 ? 0 : StyleSheet.hairlineWidth },
                  selectedSubject === subj && { backgroundColor: 'rgba(99,102,241,0.07)' },
                ]}
                onPress={() => { setSelectedSubject(subj); setShowSubjectPicker(false); }}
              >
                <Text style={[styles.compactDropdownText, { color: selectedSubject === subj ? '#6366f1' : theme.text }]}>{subj}</Text>
                {selectedSubject === subj && <Ionicons name="checkmark-circle" size={scale(15)} color="#6366f1" />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Calendar */}
        {showDatePicker && renderCustomCalendar()}

        {/* ── Audience Selector ── */}
        <View style={[styles.audienceSelectorWrap, { backgroundColor: isDark ? '#1e293b' : '#fafafa', borderColor: theme.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scale(8) }}>
            <Ionicons name="people" size={scale(14)} color="#f59e0b" />
            <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginLeft: scale(6) }]}>AUDIENCE</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: scale(8) }}>
            {[
              { label: 'Both', color: '#6366f1', icon: 'people' },
              { label: 'Boys', color: '#3b82f6', icon: 'male' },
              { label: 'Girls', color: '#ec4899', icon: 'female' },
            ].map(opt => {
              const isActive = audience === opt.label;
              return (
                <TouchableOpacity
                  key={opt.label}
                  style={[
                    styles.audienceChip,
                    { borderColor: opt.color + '40', backgroundColor: isActive ? opt.color : 'transparent' }
                  ]}
                  onPress={() => setAudience(opt.label)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={opt.icon as any} size={scale(12)} color={isActive ? '#fff' : opt.color} />
                  <Text style={[styles.audienceChipText, { color: isActive ? '#fff' : opt.color }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Title Field ── */}
        <View style={styles.fieldSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scale(6) }}>
            <Ionicons name="create-outline" size={scale(14)} color="#6366f1" />
            <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginLeft: scale(6) }]}>TITLE <Text style={{ color: '#ef4444' }}>*</Text></Text>
          </View>
          <View style={[styles.fieldBox, { borderColor: theme.border, backgroundColor: isDark ? '#1e293b' : '#fff' }]}>
            <TextInput
              style={[styles.fieldInput, { color: theme.text }]}
              placeholder="e.g. Chapter 3 – Exercise 3.1"
              placeholderTextColor={theme.textTertiary}
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
            />
          </View>
        </View>

        {/* ── Details Field ── */}
        <View style={styles.fieldSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scale(6) }}>
            <Ionicons name="document-text-outline" size={scale(14)} color="#6366f1" />
            <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginLeft: scale(6) }]}>DETAILS <Text style={{ color: '#ef4444' }}>*</Text></Text>
          </View>
          <View style={[styles.fieldBox, { borderColor: theme.border, backgroundColor: isDark ? '#1e293b' : '#fff', padding: 0 }]}>
            <TextInput
              style={[styles.detailsInput, { color: theme.text }]}
              placeholder={"Write homework, class notes, or instructions...\n\nBe clear so students understand."}
              placeholderTextColor={theme.textTertiary}
              value={details}
              onChangeText={setDetails}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* ── Save Button moved to Footer ── */}

      </ScrollView>

      {/* ── Fixed Footer: Save Button pinned to keyboard edge ── */}
      <View style={[styles.modalFooter, { backgroundColor: theme.card }]}>
        <TouchableOpacity
          style={[styles.saveButton, submitting && { opacity: 0.6 }, { marginTop: 0, backgroundColor: theme.primary }]}
          onPress={handleSave}
          disabled={submitting}
          activeOpacity={0.87}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(8) }}>
              <Ionicons name={editingEntryId ? 'checkmark-circle' : 'save'} size={scale(18)} color="#fff" />
              <Text style={styles.saveButtonText}>{editingEntryId ? 'Update Entry' : 'Save Diary Entry'}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: StatusBar.currentHeight || 0 }]}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: StatusBar.currentHeight || 0, backgroundColor: isDark ? theme.card : theme.primary, zIndex: 999 }} />
      <StatusBar backgroundColor="transparent" barStyle="light-content" translucent={true} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? theme.card : theme.primary, borderBottomColor: isDark ? theme.border : 'transparent' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={scale(24)} color="#ffffff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#ffffff' }]} numberOfLines={1} adjustsFontSizeToFit>{selectedClass} Diary</Text>
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
          <Ionicons name="add-circle" size={scale(28)} color="#ffffff" />
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

      {/* Add Diary Modal — truly full screen, keyboard-aware, no gap */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent={true}
      >
        <View style={{ flex: 1, backgroundColor: theme.card, paddingTop: StatusBar.currentHeight || 0 }}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: (StatusBar.currentHeight || 0) + 1, backgroundColor: theme.primary, zIndex: 999 }} />
          <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior="padding"
            keyboardVerticalOffset={0}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.card, flex: 1 }]}>
              {renderModalContent()}
            </View>
          </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};



const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginTop: -1, flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    borderBottomWidth: 1,
    borderBottomLeftRadius: scale(24),
    borderBottomRightRadius: scale(24),
  },
  backButton: { padding: scale(4) },
  headerTitle: { fontSize: scale(18), fontWeight: '700', flex: 1, textAlign: 'center' },
  headerAddButton: { padding: scale(4) },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: scale(10), fontSize: scale(14), fontWeight: '500' },
  listContainer: { padding: scale(16), paddingBottom: scale(100) },
  
  dateStrip: { borderBottomWidth: 1, maxHeight: scale(54) },
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
  audienceBadge: { paddingHorizontal: scale(6), paddingVertical: scale(2), borderRadius: scale(4), marginLeft: scale(6) },
  audienceBadgeText: { fontSize: scale(9), fontWeight: '700', textTransform: 'uppercase' },
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

  // ── Modal overlay & shell ──────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalContent: {
    flex: 1,
    overflow: 'hidden',
  },

  // ── Drag handle ────────────────────────────────────
  dragHandleWrap: { alignItems: 'center', paddingTop: scale(2), paddingBottom: scale(2) },
  dragHandle: { width: scale(32), height: scale(3), borderRadius: scale(2) },

  // ── Header ─────────────────────────────────────────
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: scale(5),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: scale(10) },
  modalIconWrap: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: { fontSize: scale(15), fontWeight: '700', letterSpacing: -0.3 },
  modalSubtitle: { fontSize: scale(11), fontWeight: '500', marginTop: scale(1) },
  closeButton: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Body ───────────────────────────────────
  modalBody: {
    paddingHorizontal: scale(12),
    paddingTop: scale(10),
    gap: scale(8),
  },

  // Removed obsolete halfCell

  // ── Compact dropdown (subject list) ──────────────
  compactDropdown: {
    borderRadius: scale(10),
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  compactDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: scale(10),
    paddingHorizontal: scale(12),
  },
  compactDropdownText: { fontSize: scale(13), fontWeight: '500' },

  // ── Info Cards (Subject / Date) ──────────────
  rowTwo: {
    flexDirection: 'row',
    gap: scale(10),
    marginBottom: scale(16),
  },
  infoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(10),
    borderRadius: scale(12),
    borderWidth: 1,
    gap: scale(8),
  },
  infoCardIcon: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCardLabel: {
    fontSize: scale(9),
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: scale(2),
  },
  infoCardValue: {
    fontSize: scale(13),
    fontWeight: '600',
  },

  // ── Audience Selector ──────────────
  audienceSelectorWrap: {
    padding: scale(12),
    borderRadius: scale(12),
    borderWidth: 1,
    marginBottom: scale(16),
  },
  sectionLabel: {
    fontSize: scale(10),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  audienceChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(8),
    borderRadius: scale(8),
    borderWidth: 1,
    gap: scale(4),
  },
  audienceChipText: {
    fontSize: scale(12),
    fontWeight: '600',
  },

  // ── Field Sections (Title & Details) ──────────────
  fieldSection: {
    marginBottom: scale(16),
  },
  fieldBox: {
    borderRadius: scale(12),
    borderWidth: 1,
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
  },
  fieldInput: {
    fontSize: scale(14),
    fontWeight: '500',
    minHeight: scale(28),
    paddingVertical: scale(4),
  },
  detailsInput: {
    fontSize: scale(14),
    fontWeight: '400',
    minHeight: scale(140),
    paddingVertical: scale(12),
    paddingHorizontal: scale(12),
    lineHeight: scale(22),
  },

  // ── Save Button ──────────────
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: scale(12),
    paddingVertical: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scale(8),
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: scale(14),
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  modalFooter: {
    padding: scale(16),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },

  // ── Calendar ───────────────────────────────────────
  calendarContainer: { borderWidth: 1, borderRadius: scale(12), padding: scale(10), marginVertical: scale(2), marginBottom: scale(16) },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(10) },
  calendarMonthText: { fontSize: scale(13), fontWeight: '700' },
  weekDaysRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: scale(4) },
  weekDayText: { fontSize: scale(10), fontWeight: '700', width: scale(30), textAlign: 'center' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', height: scale(32), justifyContent: 'center', alignItems: 'center' },
  dayText: { fontSize: scale(12), fontWeight: '500' },

  // ── Legacy stubs (kept for safety) ─────────────────
  label: { fontSize: scale(12), fontWeight: '600', marginBottom: scale(4), marginLeft: scale(2) },
  subjectBadge: { backgroundColor: 'rgba(99,102,241,0.1)', paddingHorizontal: scale(8), paddingVertical: scale(3), borderRadius: scale(6), marginTop: scale(4), alignSelf: 'flex-start' },
  subjectBadgeText: { color: '#6366f1', fontSize: scale(11), fontWeight: '600' },
  inlineDropdown: { borderRadius: scale(8), borderWidth: 1, marginTop: scale(4), overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 4 },
  inlineDropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: scale(10), paddingHorizontal: scale(12) },
  inlineDropdownText: { fontSize: scale(13), fontWeight: '500' },

  segmentedControl: { flexDirection: 'row', borderRadius: scale(8), padding: scale(2), marginTop: scale(2) },
  segmentTab: { flex: 1, paddingVertical: scale(6), borderRadius: scale(6), alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: scale(12) },
});

export default ClassDiaryScreen;
