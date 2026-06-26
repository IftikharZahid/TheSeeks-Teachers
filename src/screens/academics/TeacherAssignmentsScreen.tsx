import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, ScrollView, Platform, KeyboardAvoidingView, RefreshControl, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { scale } from '../../utils/responsive';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../../api/firebaseConfig';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchTeacherAssignments, fetchAvailableClasses, addAssignmentOptimistic, removeAssignmentOptimistic, setAvailableClasses } from '../../store/slices/assignmentsSlice';
import DateTimePicker from '@react-native-community/datetimepicker';

export const TeacherAssignmentsScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const user = useAppSelector(s => s.auth.user);
  const profileData = useAppSelector(s => s.auth.profile);
  const teacherName = profileData?.fullname || user?.displayName || 'Teacher';
  const teacherSubject = profileData?.class || profileData?.subject || '';
  const teacherSubjectsList = profileData?.subjects || (teacherSubject ? teacherSubject.split(',').map((s: string) => s.trim()) : []);
  const defaultSubject = teacherSubjectsList.length > 0 ? teacherSubjectsList[0] : teacherSubject;

  const dispatch = useAppDispatch();
  const { assignments, isLoading, availableClasses } = useAppSelector(s => s.assignments);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showAudienceDropdown, setShowAudienceDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [formData, setFormData] = useState({
    title: '',
    targetClass: '',
    subject: defaultSubject,
    deadline: '',
    description: '',
    audience: 'Both'
  });

  useFocusEffect(
    React.useCallback(() => {
      if (!teacherName) return;

      const unsubscribe = onSnapshot(doc(db, 'appSettings', 'classes'), (snap) => {
        if (snap.exists() && snap.data().list) {
          dispatch(setAvailableClasses(snap.data().list));
        }
      });

      dispatch(fetchTeacherAssignments({ teacherName }));

      return () => unsubscribe();
    }, [teacherName, dispatch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchTeacherAssignments({ teacherName, forceRefresh: true }));
    setRefreshing(false);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.targetClass || !formData.subject) {
      Alert.alert('Error', 'Please fill in Title, Class, and Subject');
      return;
    }

    setSaving(true);
    try {
      const newId = Date.now().toString();
      const assignmentData = {
        id: newId,
        teacherName,
        createdAt: Date.now(),
        ...formData
      };

      dispatch(addAssignmentOptimistic(assignmentData));
      setShowModal(false);
      setFormData({ title: '', targetClass: '', subject: defaultSubject, deadline: '', description: '', audience: 'Both' });
      // Save to Firestore in background
      setDoc(doc(db, 'assignments', newId), assignmentData, { merge: true }).catch(e => console.log('Save assignment error:', e));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Confirm', 'Are you sure you want to delete this assignment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          dispatch(removeAssignmentOptimistic(id));
          deleteDoc(doc(db, 'assignments', id)).catch(e => console.log('Delete assignment error:', e));
        }
      }
    ]);
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      // Format as DD MMM YYYY
      const formattedDate = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      setFormData({ ...formData, deadline: formattedDate });
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, borderLeftColor: theme.primary }]}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
          <View style={styles.badgesRow}>
            <View style={[styles.badge, { backgroundColor: '#3b82f620' }]}>
              <Text style={[styles.badgeText, { color: '#3b82f6' }]}>{item.targetClass}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#8b5cf620' }]}>
              <Text style={[styles.badgeText, { color: '#8b5cf6' }]}>{item.subject}</Text>
            </View>
            {item.audience && item.audience !== 'Both' && (
              <View style={[styles.badge, { backgroundColor: item.audience === 'Boys' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(236, 72, 153, 0.1)' }]}>
                <Text style={[styles.badgeText, { color: item.audience === 'Boys' ? '#3b82f6' : '#ec4899' }]}>{item.audience}</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={scale(16)} color="#ef4444" />
        </TouchableOpacity>
      </View>
      {item.description ? (
        <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>{item.description}</Text>
      ) : null}
      {item.deadline ? (
        <View style={styles.deadlineRow}>
          <Ionicons name="time-outline" size={scale(12)} color="#f59e0b" />
          <Text style={[styles.deadlineText, { color: '#f59e0b' }]}>Due: {item.deadline}</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={scale(22)} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>My Assignments</Text>
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.headerButton}>
          <Ionicons name="add-circle" size={scale(24)} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {isLoading && assignments.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={assignments}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="journal-outline" size={scale(48)} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No assignments found.</Text>
            </View>
          }
        />
      )}

      <Modal visible={showModal} transparent={true} animationType="slide" onRequestClose={() => setShowModal(false)} statusBarTranslucent={true}>
        <View style={{ flex: 1, backgroundColor: theme.card }}>
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
              <View style={[styles.modalContentFullScreen, { backgroundColor: theme.card }]}>
                <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Add Assignment</Text>
                  <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
                    <Ionicons name="close" size={scale(24)} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={{ paddingBottom: scale(20) }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
                <Text style={[styles.label, { color: theme.textSecondary }]}>Title *</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: isDark ? '#334155' : '#f8fafc' }]}
                  placeholder="E.g. Math Homework"
                  placeholderTextColor={theme.textSecondary}
                  value={formData.title}
                  onChangeText={t => setFormData({ ...formData, title: t })}
                />

                <View style={{ flexDirection: 'row', gap: scale(12), zIndex: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Target Class *</Text>
                    <TouchableOpacity
                      style={[styles.input, { borderColor: theme.border, backgroundColor: isDark ? '#334155' : '#f8fafc', justifyContent: 'center' }]}
                      activeOpacity={0.7}
                      onPress={() => { setShowClassDropdown(!showClassDropdown); setShowAudienceDropdown(false); }}
                    >
                      <Text style={{ color: formData.targetClass ? theme.text : theme.textSecondary, fontSize: scale(14) }}>
                        {formData.targetClass || 'Select'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color={theme.textSecondary} style={{ position: 'absolute', right: scale(12) }} />
                    </TouchableOpacity>

                    {showClassDropdown && availableClasses.length > 0 && (
                      <View style={[styles.dropdownContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <ScrollView style={{ maxHeight: scale(300) }} nestedScrollEnabled={true} showsVerticalScrollIndicator={true} keyboardShouldPersistTaps="handled">
                          {[...availableClasses].sort((a, b) => {
                            const getWeight = (cls: string) => {
                              const lower = cls.toLowerCase();
                              if (lower.includes('1st year')) return 11;
                              if (lower.includes('2nd year')) return 12;
                              if (lower.includes('prep')) return 0;
                              if (lower.includes('nursery')) return -1;
                              const match = cls.match(/(\d+)/);
                              if (match) return parseInt(match[1], 10);
                              return 99; // unknown at the end
                            };
                            return getWeight(a) - getWeight(b);
                          }).map((cls, index, sortedArr) => {
                            const isSelected = formData.targetClass === cls;
                            return (
                              <TouchableOpacity
                                key={index}
                                style={[
                                  styles.dropdownItem,
                                  { borderBottomColor: theme.border, borderBottomWidth: index === sortedArr.length - 1 ? 0 : 1 },
                                  isSelected && { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }
                                ]}
                                onPress={() => {
                                  setFormData({ ...formData, targetClass: cls });
                                  setShowClassDropdown(false);
                                }}
                              >
                                <Text style={{ color: isSelected ? theme.primary : theme.text, fontSize: scale(14), fontWeight: isSelected ? '600' : '400' }}>{cls}</Text>
                                {isSelected && <Ionicons name="checkmark-circle" size={18} color={theme.primary} />}
                              </TouchableOpacity>
                            )
                          })}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Audience</Text>
                    <TouchableOpacity
                      style={[styles.input, { borderColor: theme.border, backgroundColor: isDark ? '#334155' : '#f8fafc', justifyContent: 'center' }]}
                      activeOpacity={0.7}
                      onPress={() => { setShowAudienceDropdown(!showAudienceDropdown); setShowClassDropdown(false); }}
                    >
                      <Text style={{ color: theme.text, fontSize: scale(14) }}>
                        {formData.audience}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color={theme.textSecondary} style={{ position: 'absolute', right: scale(12) }} />
                    </TouchableOpacity>

                    {showAudienceDropdown && (
                      <View style={[styles.dropdownContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        {['Both', 'Boys', 'Girls'].map((opt, index) => {
                          const isSelected = formData.audience === opt;
                          return (
                            <TouchableOpacity
                              key={opt}
                              style={[
                                styles.dropdownItem,
                                { borderBottomColor: theme.border, borderBottomWidth: index === 2 ? 0 : 1 },
                                isSelected && { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }
                              ]}
                              onPress={() => {
                                setFormData({ ...formData, audience: opt });
                                setShowAudienceDropdown(false);
                              }}
                            >
                              <Text style={{ color: isSelected ? theme.primary : theme.text, fontSize: scale(14), fontWeight: isSelected ? '600' : '400' }}>{opt}</Text>
                              {isSelected && <Ionicons name="checkmark-circle" size={18} color={theme.primary} />}
                            </TouchableOpacity>
                          )
                        })}
                      </View>
                    )}
                  </View>
                </View>

                <Text style={[styles.label, { color: theme.textSecondary }]}>Subject *</Text>
                {teacherSubjectsList.length > 1 ? (
                  <View style={{ zIndex: 1000 }}>
                    <TouchableOpacity
                      style={[styles.input, { borderColor: theme.border, backgroundColor: isDark ? '#334155' : '#f8fafc', justifyContent: 'center' }]}
                      activeOpacity={0.7}
                      onPress={() => { setShowSubjectDropdown(!showSubjectDropdown); setShowClassDropdown(false); setShowAudienceDropdown(false); }}
                    >
                      <Text style={{ color: formData.subject ? theme.text : theme.textSecondary, fontSize: scale(14) }}>
                        {formData.subject || 'Select Subject'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color={theme.textSecondary} style={{ position: 'absolute', right: scale(12) }} />
                    </TouchableOpacity>

                    {showSubjectDropdown && (
                      <View style={[styles.dropdownContainer, { backgroundColor: theme.card, borderColor: theme.border, maxHeight: scale(150) }]}>
                        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                          {teacherSubjectsList.map((subj: string, index: number) => {
                            const isSelected = formData.subject === subj;
                            return (
                              <TouchableOpacity
                                key={index}
                                style={[
                                  styles.dropdownItem,
                                  { borderBottomColor: theme.border, borderBottomWidth: index === teacherSubjectsList.length - 1 ? 0 : 1 },
                                  isSelected && { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }
                                ]}
                                onPress={() => {
                                  setFormData({ ...formData, subject: subj });
                                  setShowSubjectDropdown(false);
                                }}
                              >
                                <Text style={{ color: isSelected ? theme.primary : theme.text, fontSize: scale(14), fontWeight: isSelected ? '600' : '400' }}>{subj}</Text>
                                {isSelected && <Ionicons name="checkmark-circle" size={18} color={theme.primary} />}
                              </TouchableOpacity>
                            )
                          })}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                ) : (
                  <TextInput
                    style={[styles.input, { color: theme.textSecondary, borderColor: theme.border, backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}
                    value={formData.subject}
                    editable={false}
                  />
                )}

                <Text style={[styles.label, { color: theme.textSecondary }]}>Deadline</Text>
                <TouchableOpacity
                  style={[styles.input, { borderColor: theme.border, backgroundColor: isDark ? '#334155' : '#f8fafc', justifyContent: 'center' }]}
                  activeOpacity={0.7}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={{ color: formData.deadline ? theme.text : theme.textSecondary, fontSize: scale(14) }}>
                    {formData.deadline || 'Select a date'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} style={{ position: 'absolute', right: scale(12) }} />
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                )}

                <Text style={[styles.label, { color: theme.textSecondary }]}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border, backgroundColor: isDark ? '#334155' : '#f8fafc' }]}
                  placeholder="Optional description or instructions..."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  scrollEnabled={false}
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={formData.description}
                  onChangeText={t => setFormData({ ...formData, description: t })}
                />

                <View style={{ height: scale(20) }} />

                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: theme.primary, opacity: saving ? 0.7 : 1, marginTop: 0 }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Assignment</Text>}
                </TouchableOpacity>

                <View style={{ height: scale(20) }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    borderBottomWidth: 1,
  },
  headerButton: { padding: scale(4) },
  headerTitle: { flex: 1, fontSize: scale(17), fontWeight: '700', textAlign: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { padding: scale(14), paddingBottom: scale(40) },
  card: {
    borderRadius: scale(10),
    padding: scale(12),
    marginBottom: scale(10),
    borderWidth: 1,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(1) },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: scale(6) },
  title: { fontSize: scale(14), fontWeight: '700', marginBottom: scale(4), letterSpacing: -0.2 },
  badgesRow: { flexDirection: 'row', gap: scale(6) },
  badge: { paddingHorizontal: scale(6), paddingVertical: scale(2), borderRadius: scale(4) },
  badgeText: { fontSize: scale(10), fontWeight: '600' },
  description: { fontSize: scale(12), lineHeight: scale(17), marginBottom: scale(8) },
  deleteBtn: { padding: scale(4), marginLeft: scale(8) },
  deadlineRow: { flexDirection: 'row', alignItems: 'center', gap: scale(4), marginTop: scale(2) },
  deadlineText: { fontSize: scale(11), fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: scale(60) },
  emptyText: { fontSize: scale(14), fontWeight: '600', marginTop: scale(10) },
  modalContentFullScreen: { flex: 1 },
  modalFooter: {
    paddingHorizontal: scale(20),
    paddingBottom: scale(20),
    paddingTop: scale(10),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    paddingTop: scale(20),
    width: '100%',
    maxHeight: '90%',
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(10),
    paddingHorizontal: scale(20),
    paddingBottom: scale(12),
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: scale(18), fontWeight: '700' },
  closeBtn: { padding: scale(4) },
  modalBody: {
    paddingHorizontal: scale(20),
    flexShrink: 1,
  },
  label: { fontSize: scale(12), fontWeight: '600', marginBottom: scale(6) },
  input: {
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: scale(12),
    paddingVertical: scale(12),
    fontSize: scale(14),
    marginBottom: scale(16),
  },
  dropdownContainer: {
    position: 'absolute',
    top: scale(65),
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: scale(10),
    overflow: 'hidden',
    zIndex: 100,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale(14),
    paddingHorizontal: scale(14),
  },
  textArea: {
    height: scale(100),
  },
  saveBtn: {
    paddingVertical: scale(14),
    borderRadius: scale(10),
    alignItems: 'center',
    marginTop: scale(15)
  },
  saveBtnText: {
    color: '#fff',
    fontSize: scale(15),
    fontWeight: '700',
  },
});

