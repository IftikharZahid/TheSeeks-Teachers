import { scale } from '../../utils/responsive';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Pressable, TextInput, Modal, Alert, ActivityIndicator, Platform , StatusBar} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { db, firebaseConfig } from '../../api/firebaseConfig';
import { initializeApp, deleteApp } from 'firebase/app';
import { initializeAuth, createUserWithEmailAndPassword } from 'firebase/auth';
// @ts-ignore
import { getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, deleteDoc, serverTimestamp, getDocs, query, where, collection } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import type { AdminExam, AdminStudent } from '../../store/slices/adminSlice';
import { initExamSettingsListener } from '../../store/slices/adminSlice';
import type { Teacher } from '../../store/slices/teachersSlice';

// ─── Shared Dropdown Component ────────────────────────────────────────────────

const DROPDOWN_ITEM_HEIGHT = 38;
const VISIBLE_ITEMS = 6;
const MAX_SCROLL_HEIGHT = DROPDOWN_ITEM_HEIGHT * VISIBLE_ITEMS; // 230

interface DropdownOption {
  label: string;
  value: string;
  icon?: string;
  badge?: string;
}

interface DropdownMenuProps {
  options: DropdownOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  theme: any;
  showScrollBar?: boolean;
  zIndex?: number;
  containerStyle?: object;
  maxHeight?: number;
  anchorRef: React.RefObject<View | null>;
  onClose: () => void;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  options,
  selectedValue,
  onSelect,
  theme,
  showScrollBar,
  zIndex = 1000,
  containerStyle,
  maxHeight,
  anchorRef,
  onClose,
}) => {
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const resolvedMaxHeight = maxHeight ?? MAX_SCROLL_HEIGHT;
  const needsScroll = options.length > VISIBLE_ITEMS || (options.length * DROPDOWN_ITEM_HEIGHT > resolvedMaxHeight);
  const displayScrollBar = showScrollBar ?? needsScroll;
  const dropdownHeight = Math.min(options.length * DROPDOWN_ITEM_HEIGHT, resolvedMaxHeight);

  useEffect(() => {
    if (anchorRef && anchorRef.current) {
      const tm = setTimeout(() => {
        anchorRef.current?.measure((fx: number, fy: number, w: number, h: number, px: number, py: number) => {
          if (w > 0) {
            setPos({ top: py + h, left: px, width: w });
          }
        });
      }, 20);
      return () => clearTimeout(tm);
    }
  }, [anchorRef]);

  const renderItem = ({ item: opt, index: i }: { item: DropdownOption; index: number }) => {
    const isSelected = opt.value === selectedValue;
    const isLast = i === options.length - 1;
    return (
      <TouchableOpacity
        key={opt.value + i}
        onPress={() => onSelect(opt.value)}
        activeOpacity={0.6}
        style={[
          dropdownStyles.item,
          {
            height: DROPDOWN_ITEM_HEIGHT,
            borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
            borderBottomColor: theme.border,
            backgroundColor: isSelected ? theme.primary + '10' : 'transparent',
          },
        ]}
      >
        {opt.icon ? (
          <View style={[dropdownStyles.itemIcon, { backgroundColor: isSelected ? theme.primary + '18' : theme.border + '40' }]}>
            <Ionicons name={opt.icon as any} size={13} color={isSelected ? theme.primary : theme.textSecondary} />
          </View>
        ) : null}
        <Text
          style={[
            dropdownStyles.itemLabel,
            {
              color: isSelected ? theme.primary : theme.text,
              fontWeight: isSelected ? '700' : '500',
              marginLeft: opt.icon ? 0 : 4,
            },
          ]}
          numberOfLines={1}
        >
          {opt.label}
        </Text>
        {opt.badge ? (
          <View style={[dropdownStyles.badge, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]}>
            <Text style={[dropdownStyles.badgeText, { color: theme.primary }]}>{opt.badge}</Text>
          </View>
        ) : isSelected ? (
          <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
        ) : null}
      </TouchableOpacity>
    );
  };

  if (!pos) return null;

  return (
    <Modal visible={true} transparent animationType="fade" statusBarTranslucent={true}>
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        activeOpacity={1}
      />
      <View
        style={[
          dropdownStyles.container,
          {
            position: 'absolute',
            top: pos.top + 4,
            left: pos.left,
            width: pos.width,
            backgroundColor: theme.card,
            borderColor: theme.border,
            zIndex: 9999,
            elevation: 20,
            shadowColor: theme.text,
          },
          containerStyle,
        ]}
      >
        <ScrollView
          style={{ height: dropdownHeight, maxHeight: resolvedMaxHeight }}
          contentContainerStyle={{ minHeight: dropdownHeight }}
          showsVerticalScrollIndicator={displayScrollBar}
          nestedScrollEnabled
          keyboardShouldPersistTaps="always"
          bounces={false}
          scrollEnabled={needsScroll}
        >
          {options.map((opt, i) => renderItem({ item: opt, index: i }))}
        </ScrollView>
      </View>
    </Modal>
  );
};

const dropdownStyles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: scale(10),
    overflow: 'hidden',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: scale(8),
  },
  scrollHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(4),
    paddingVertical: scale(5),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scrollHintText: {
    fontSize: scale(9),
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(10),
    gap: scale(6),
  },
  itemIcon: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    flex: 1,
    fontSize: scale(12),
    letterSpacing: 0.1,
  },
  badge: {
    paddingHorizontal: scale(7),
    paddingVertical: scale(2),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  badgeText: {
    fontSize: scale(10),
    fontWeight: '700',
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Types & Constants ────────────────────────────────────────────────────────

interface BookEntry {
  name: string;
  totalMarks: string;
  obtainedMarks: string;
}

type ExamEntry = AdminExam;

interface AuthorizationError {
  isUnauthorized: boolean;
  message: string;
}

const CATEGORIES = ['Weekly', 'Monthly', 'Quarterly', 'Half-Year', 'Final'];
const CATEGORY_ICONS = [
  'calendar-outline',
  'today-outline',
  'stats-chart-outline',
  'trophy-outline',
  'ribbon-outline',
];

const TITLE_OPTIONS = Array.from({ length: 20 }, (_, i) => `T${i + 1}`);
const CLASS_OPTIONS = ['9th', '10th', '1st Year', '2nd Year'];
const ROW_HEIGHT = 56;
const normalizeSubjectName = (value: string) => value.trim().toLowerCase().replace(/_/g, ' ');

// ─── Teacher Authorization Utilities ──────────────────────────────────────────

const AUTHORIZATION = {
  /**
   * Validates if a teacher can edit/delete an exam record
   */
  canEditExam: (exam: ExamEntry, isTeacher: boolean, teacherId?: string): AuthorizationError => {
    if (!isTeacher) return { isUnauthorized: false, message: '' };

    const examTeacherId = exam.teacherId || exam.createdBy;
    if (examTeacherId && examTeacherId !== teacherId) {
      return {
        isUnauthorized: true,
        message: 'You can only modify exam records created by you.',
      };
    }

    return { isUnauthorized: false, message: '' };
  },

  /**
   * Validates if a teacher can add records for a specific subject
   */
  canAddExamForSubject: (
    bookName: string,
    isTeacher: boolean,
    teacherSubject: string
  ): AuthorizationError => {
    if (!isTeacher) return { isUnauthorized: false, message: '' };

    const normalizedBook = normalizeSubjectName(bookName);
    const normalizedSubject = normalizeSubjectName(teacherSubject);

    if (normalizedBook !== normalizedSubject) {
      return {
        isUnauthorized: true,
        message: `You can only add exam records for "${teacherSubject}" subject.`,
      };
    }

    return { isUnauthorized: false, message: '' };
  },
};

// ─── Memoized row component ───────────────────────────────────────────────────

type StudentProgress = {
  studentName: string; rollNo: string; studentClass: string;
  totalMarks: number; obtainedMarks: number; testCount: number; tests: string[];
  latestExam: ExamEntry;
};

const ExamRow = React.memo((
  { student, index, theme, onPress }: {
    student: StudentProgress;
    index: number;
    theme: any;
    onPress: (exam: ExamEntry) => void;
  }
) => {
  const pct = student.totalMarks > 0 ? (student.obtainedMarks / student.totalMarks) * 100 : 0;
  const barColor = pct >= 80 ? '#10b981' : pct >= 60 ? '#3b82f6' : pct >= 40 ? '#f59e0b' : '#ef4444';
  const isEven = index % 2 === 0;
  return (
    <TouchableOpacity
      activeOpacity={0.65}
      onPress={() => onPress(student.latestExam)}
      style={[
        examRowStyles.row,
        {
          backgroundColor: isEven ? theme.card : theme.background,
          borderBottomColor: theme.border,
          height: ROW_HEIGHT,
        },
      ]}
    >
      <View style={{ flex: 2.2, flexDirection: 'row', alignItems: 'center', gap: scale(7) }}>
        <View style={[examRowStyles.avatar, { backgroundColor: barColor + '18' }]}>
          <Text style={{ fontSize: scale(10), fontWeight: '800', color: barColor }}>
            {(student.studentName || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: scale(12), fontWeight: '700', color: theme.text }} numberOfLines={1}>
            {student.studentName}
          </Text>
          <Text style={{ fontSize: scale(10), color: theme.textSecondary }} numberOfLines={1}>
            {student.rollNo ? `ID: ${student.rollNo}` : '—'}
          </Text>
        </View>
      </View>
      <Text style={{ flex: 0.8, fontSize: scale(11), color: theme.textSecondary, textAlign: 'center' }} numberOfLines={1}>
        {student.studentClass || '—'}
      </Text>
      <View style={{ flex: 0.6, alignItems: 'center' }}>
        <Text style={{ fontSize: scale(11), fontWeight: '600', color: theme.text }}>
          {student.testCount}
        </Text>
      </View>
      <Text style={{ flex: 0.7, fontSize: scale(10), color: theme.textSecondary, textAlign: 'center' }} numberOfLines={1}>
        {student.obtainedMarks}/{student.totalMarks}
      </Text>
      <View style={{ flex: 0.7, alignItems: 'flex-end' }}>
        <View style={[examRowStyles.scoreBadge, { backgroundColor: barColor + '18', borderColor: barColor + '35' }]}>
          <Text style={{ fontSize: scale(11), fontWeight: '800', color: barColor }}>{pct.toFixed(0)}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const examRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    borderBottomWidth: 1,
  },
  avatar: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  scoreBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(10),
    borderWidth: 1,
  },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

export const Class2ndYearExamsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const dispatch = useAppDispatch();

  // ── Fetch exam settings (Test Nos + Categories) from web dashboard on mount ──
  useEffect(() => {
    const unsubExamSettings = initExamSettingsListener(dispatch);
    return () => { if (typeof unsubExamSettings === 'function') unsubExamSettings(); };
  }, [dispatch]);

  const profile: any = useAppSelector(state => state.auth.profile);
  const role = (profile?.role || '').toLowerCase();
  const isTeacher = role !== 'admin' && role !== 'student' && !!role;
  const teacherId = profile?.id || profile?.uid || profile?.email || '';
  const teacherSubject = profile?.subject || profile?.class || profile?.booktitle || profile?.bookTitle || '';

  const exams = useAppSelector(state => state.admin.exams);
  const examCategories = useAppSelector(state => state.admin.examCategories);
  const examTitles = useAppSelector(state => state.admin.examTitles);
  const loading = useAppSelector(state => state.admin.examsLoading);

  const teachers = useAppSelector(state => state.teachers.list);
  const books = teachers.filter(t => t.booktitle || t.subject).map(t => ({ ...t })) as Teacher[];

  const students = useAppSelector(state => state.admin.students) as AdminStudent[];

  const dynamicTitleOptions = useMemo(() => {
    const titles = new Set<string>();
    if (examTitles && examTitles.length > 0) {
      examTitles.forEach(t => titles.add(t));
    } else {
      Array.from({ length: 20 }, (_, i) => `T${i + 1}`).forEach(t => titles.add(t));
    }
    exams.forEach(exam => {
      if (exam.title) titles.add(exam.title);
    });
    return Array.from(titles).sort((a, b) => {
       const numA = parseInt(a.replace(/\D/g, ''));
       const numB = parseInt(b.replace(/\D/g, ''));
       if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
       return a.localeCompare(b);
    });
  }, [exams, examTitles]);

  const dynamicCategoryOptions = useMemo(() => {
    const cats = new Set<string>();
    if (examCategories && examCategories.length > 0) {
      examCategories.forEach(c => cats.add(c));
    } else {
      ['Weekly', 'Monthly', 'Quarterly', 'Half Book', 'Full Book'].forEach(c => cats.add(c));
    }
    exams.forEach(exam => {
      if (exam.category) cats.add(exam.category);
    });
    return Array.from(cats);
  }, [exams, examCategories]);

  const [uploading, setUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [choiceModalVisible, setChoiceModalVisible] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamEntry | null>(null);
  const titleAnchorRef = useRef<View | null>(null);
  const categoryAnchorRef = useRef<View | null>(null);
  const filterTestNoAnchorRef = useRef<View | null>(null);
  const filterGenderAnchorRef = useRef<View | null>(null);
  const bookAnchorRef = useRef<View | null>(null);
    const [showBookDropdown, setShowBookDropdown] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showUploadInstructions, setShowUploadInstructions] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [visibleCount, setVisibleCount] = useState(10);

  const [selectedExamForOptions, setSelectedExamForOptions] = useState<ExamEntry | null>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [studentInfoLocked, setStudentInfoLocked] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentSelected, setStudentSelected] = useState(false);

  const [filterTestNo, setFilterTestNo] = useState('');
  const [filterGender, setFilterGender] = useState('All');
  const [showFilterTestNoDropdown, setShowFilterTestNoDropdown] = useState(false);
  const [showFilterGenderDropdown, setShowFilterGenderDropdown] = useState(false);


  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState(dynamicCategoryOptions[0] || 'Weekly');
  const [rollNo, setRollNo] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentClass, setStudentClass] = useState('');

  const [entryBooks, setEntryBooks] = useState<BookEntry[]>([]);
  const [currentBookName, setCurrentBookName] = useState('');
  const [currentTotalMarks, setCurrentTotalMarks] = useState('');
  const [currentObtainedMarks, setCurrentObtainedMarks] = useState('');

  const [bookName, setBookName] = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [obtainedMarks, setObtainedMarks] = useState('');
  const [description, setDescription] = useState('');

  const closeAllDropdowns = () => {
    setShowTitleDropdown(false);
    setShowClassDropdown(false);
    setShowBookDropdown(false);
    setShowStudentDropdown(false);
    setShowCategoryDropdown(false);
    setShowFilterTestNoDropdown(false);
    setShowFilterGenderDropdown(false);
  };

  const isAnyFilterDropdownOpen = showFilterTestNoDropdown || showFilterGenderDropdown;
  const isAnyFormDropdownOpen = showTitleDropdown || showClassDropdown || showBookDropdown || showStudentDropdown || showCategoryDropdown;

  const getTeacherSubjectBook = (): BookEntry => {
    const subject = teacherSubject.trim();
    return entryBooks.find(book => normalizeSubjectName(book.name) === normalizeSubjectName(subject)) || {
      name: subject,
      totalMarks: '',
      obtainedMarks: '',
    };
  };

  const updateTeacherSubjectBook = (field: 'totalMarks' | 'obtainedMarks', value: string) => {
    if (!teacherSubject.trim()) return;

    setEntryBooks(prev => {
      const subject = teacherSubject.trim();
      const existingIndex = prev.findIndex(book => normalizeSubjectName(book.name) === normalizeSubjectName(subject));

      if (existingIndex >= 0) {
        return prev.map((book, index) => (
          index === existingIndex ? { ...book, name: subject, [field]: value } : book
        ));
      }

      return [{
        name: subject,
        totalMarks: field === 'totalMarks' ? value : '',
        obtainedMarks: field === 'obtainedMarks' ? value : '',
      }];
    });
  };

  const handleSaveExam = async () => {
    const formattedDate = date.toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
    const scopedEntryBooks = isTeacher && teacherSubject
      ? entryBooks.filter(book => normalizeSubjectName(book.name) === normalizeSubjectName(teacherSubject))
      : entryBooks;

    if (!title || !category) {
      Alert.alert('Error', 'Please fill required fields (Title, Category)');
      return;
    }

    // ─── Teacher Authorization Check ───────────────────────────────────────────
    if (isTeacher) {
      if (scopedEntryBooks.length > 0) {
        for (const book of scopedEntryBooks) {
          const authError = AUTHORIZATION.canAddExamForSubject(
            book.name,
            isTeacher,
            teacherSubject
          );
          if (authError.isUnauthorized) {
            Alert.alert('Authorization Error', authError.message);
            return;
          }
        }
      } else if (bookName.trim()) {
        const authError = AUTHORIZATION.canAddExamForSubject(
          bookName,
          isTeacher,
          teacherSubject
        );
        if (authError.isUnauthorized) {
          Alert.alert('Authorization Error', authError.message);
          return;
        }
      }

      if (editingExam) {
        const authError = AUTHORIZATION.canEditExam(editingExam, isTeacher, teacherId);
        if (authError.isUnauthorized) {
          Alert.alert('Authorization Error', authError.message);
          return;
        }
      }
    }

    const isDuplicate = exams.some(exam => {
      if (editingExam && exam.id === editingExam.id) return false;
      return (
        exam.title === title &&
        exam.category === category &&
        exam.rollNo === rollNo
      );
    });

    if (isDuplicate) {
      Alert.alert('Duplicate Entry', 'An exam entry with these details already exists.');
      return;
    }

    let computedStatus = 'Absent';
    let totalObtained = 0;
    let totalPossible = 0;

    if (scopedEntryBooks.length > 0) {
      scopedEntryBooks.forEach(book => {
        const obtained = parseFloat(book.obtainedMarks);
        const total = parseFloat(book.totalMarks);
        if (!isNaN(obtained) && !isNaN(total)) {
          totalObtained += obtained;
          totalPossible += total;
        }
      });
      if (totalPossible > 0) {
        const percentage = (totalObtained / totalPossible) * 100;
        computedStatus = percentage >= 40 ? 'Pass' : 'Fail';
      }
    } else if (obtainedMarks && obtainedMarks.trim() !== '') {
      const marks = parseFloat(obtainedMarks);
      if (!isNaN(marks)) {
        computedStatus = marks >= 40 ? 'Pass' : 'Fail';
      }
    }

    const finalTotalMarks = scopedEntryBooks.length > 0 ? totalPossible.toString() : (totalMarks || '');
    const finalObtainedMarks = scopedEntryBooks.length > 0 ? totalObtained.toString() : (obtainedMarks || '');

    const examData: any = {
      title,
      date: formattedDate,
      category,
      rollNo: rollNo || '',
      studentName: studentName || '',
      studentEmail: studentEmail || '',
      studentClass: studentClass || '',
      books: scopedEntryBooks.length > 0 ? scopedEntryBooks : undefined,
      bookName: scopedEntryBooks.length > 0 ? scopedEntryBooks.map(b => b.name).join(', ') : (isTeacher && teacherSubject ? teacherSubject : (bookName || '')),
      totalMarks: finalTotalMarks,
      obtainedMarks: finalObtainedMarks,
      status: computedStatus,
      description: description || '',
      updatedAt: serverTimestamp(),
      // ─── Teacher Tracking ───────────────────────────────────────────────────
      ...(isTeacher && { teacherId, createdBy: teacherId }),
    };

    try {
      if (editingExam) {
        await setDoc(doc(db, 'exams', editingExam.id), examData, { merge: true });
        Alert.alert('Success', 'Exam record updated successfully');
      } else {
        const newId = Date.now().toString();
        await setDoc(doc(db, 'exams', newId), examData);
        Alert.alert('Success', 'Exam record added successfully');
      }
      setModalVisible(false);
      resetForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to save exam record');
      console.error(error);
    }
  };

  const handleDeleteExam = async (id: string) => {
    const examToDelete = exams.find(e => e.id === id);
    
    if (!examToDelete) {
      Alert.alert('Error', 'Exam record not found.');
      return;
    }

    // ─── Teacher Authorization Check ────────────────────────────────────────────
    if (isTeacher) {
      const authError = AUTHORIZATION.canEditExam(examToDelete, isTeacher, teacherId);
      if (authError.isUnauthorized) {
        Alert.alert('Authorization Error', authError.message);
        return;
      }
    }

    Alert.alert(
      'Delete Record',
      'Are you sure you want to remove this exam record? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'exams', id));
              Alert.alert('Success', 'Exam record deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete exam record');
              console.error(error);
            }
          }
        }
      ]
    );
  };

  const openModal = (exam?: ExamEntry) => {
    if (exam) {
      // ─── Teacher Authorization Check ────────────────────────────────────────────
      if (isTeacher) {
        const authError = AUTHORIZATION.canEditExam(exam, isTeacher, teacherId);
        if (authError.isUnauthorized) {
          Alert.alert('Authorization Error', authError.message);
          return;
        }
      }

      setEditingExam(exam);
      setTitle(exam.title);
      const parsedDate = new Date(exam.date);
      setDate(isNaN(parsedDate.getTime()) ? new Date() : parsedDate);
      setCategory(exam.category || CATEGORIES[0]);
      setRollNo(exam.rollNo || '');
      setStudentName(exam.studentName || '');
      setStudentEmail(exam.studentEmail || '');
      setStudentClass(exam.studentClass || '');
      setStudentSelected(true);

      let loadedBooks: BookEntry[] = [];
      if (exam.books && exam.books.length > 0) {
        loadedBooks = JSON.parse(JSON.stringify(exam.books));
      } else if (exam.bookName || exam.totalMarks || exam.obtainedMarks) {
        loadedBooks = [{ name: exam.bookName || '', totalMarks: exam.totalMarks || '', obtainedMarks: exam.obtainedMarks || '' }];
      }

      if (isTeacher && teacherSubject) {
        loadedBooks = loadedBooks.filter(b => normalizeSubjectName(b.name) === normalizeSubjectName(teacherSubject));
        const hasSubject = loadedBooks.some(b => normalizeSubjectName(b.name) === normalizeSubjectName(teacherSubject));
        if (!hasSubject) {
          loadedBooks.push({ name: teacherSubject.trim(), totalMarks: '', obtainedMarks: '' });
        }
      }
      setEntryBooks(loadedBooks);
      setBookName('');
      setTotalMarks('');
      setObtainedMarks('');
      setDescription(exam.description);
      setModalVisible(true);
    } else {
      resetForm();
      setModalVisible(true);
    }
  };

  const resetForm = () => {
    setEditingExam(null);
    setStudentSelected(false);
    setStudentInfoLocked(false);
    setStudentSearchTerm('');
    setTitle('');
    setDate(new Date());
    setCategory(CATEGORIES[0]);
    setRollNo('');
    setStudentName('');
    setStudentEmail('');
    setStudentClass('');
    // Teachers always have their subject pre-loaded; admins start blank
    setEntryBooks(isTeacher && teacherSubject
      ? [{ name: teacherSubject.trim(), totalMarks: '', obtainedMarks: '' }]
      : []);
    setCurrentBookName('');
    setCurrentTotalMarks('');
    setCurrentObtainedMarks('');
    setBookName('');
    setTotalMarks('');
    setObtainedMarks('');
    setDescription('');
  };

  const handleAddBook = () => {
    if (!currentBookName.trim()) {
      Alert.alert('Error', 'Please enter book/subject name');
      return;
    }

    // ─── Teacher Authorization Check ───────────────────────────────────────────
    if (isTeacher) {
      const authError = AUTHORIZATION.canAddExamForSubject(
        currentBookName,
        isTeacher,
        teacherSubject
      );
      if (authError.isUnauthorized) {
        Alert.alert('Authorization Error', authError.message);
        return;
      }
    }

    if (!currentTotalMarks.trim() || !currentObtainedMarks.trim()) {
      Alert.alert('Error', 'Please enter total marks and obtained marks');
      return;
    }

    const isDuplicate = entryBooks.some(
      book => book.name.toLowerCase() === currentBookName.trim().toLowerCase()
    );
    if (isDuplicate) {
      Alert.alert('Duplicate Book', 'This subject has already been added.');
      return;
    }

    setEntryBooks([...entryBooks, {
      name: currentBookName.trim(),
      totalMarks: currentTotalMarks.trim(),
      obtainedMarks: currentObtainedMarks.trim(),
    }]);
    setCurrentBookName(isTeacher && teacherSubject ? teacherSubject : '');
    setCurrentTotalMarks('');
    setCurrentObtainedMarks('');
  };

  const handleRemoveBook = (index: number) => {
    const bookToRemove = entryBooks[index];
    
    // ─── Teacher Authorization Check ───────────────────────────────────────────
    if (isTeacher && teacherSubject) {
      const normalizedBook = bookToRemove.name.trim().toLowerCase().replace(/_/g, ' ');
      const normalizedSubject = teacherSubject.trim().toLowerCase().replace(/_/g, ' ');
      
      if (normalizedBook !== normalizedSubject) {
        Alert.alert(
          'Authorization Error',
          `You can only modify exam records for "${teacherSubject}" subject.`
        );
        return;
      }
    }

    setEntryBooks(entryBooks.filter((_, i) => i !== index));
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/json',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
        copyToCacheDirectory: true
      });

      if (result.canceled) return;

      setUploading(true);
      setChoiceModalVisible(false);

      const asset = result.assets[0];
      let fileUri = asset.uri;
      if (fileUri.startsWith('content://')) {
        const tempUri = FileSystem.documentDirectory + 'temp_exam_upload_' + Date.now() + (asset.name.endsWith('.json') ? '.json' : '.xlsx');
        await FileSystem.copyAsync({ from: fileUri, to: tempUri });
        fileUri = tempUri;
      }

      let data: any[] = [];

      if (asset.name.endsWith('.json')) {
        const fileContent = await FileSystem.readAsStringAsync(fileUri);
        try {
          data = JSON.parse(fileContent);
        } catch (parseError) {
          Alert.alert('JSON Error', 'The file content is not valid JSON.');
          setUploading(false);
          return;
        }
      } else if (asset.name.endsWith('.xlsx') || asset.name.endsWith('.xls')) {
        try {
          const fileContent = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64
          });
          const workbook = XLSX.read(fileContent, { type: 'base64' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          data = XLSX.utils.sheet_to_json(sheet);
        } catch (excelError) {
          console.error("Excel parse error:", excelError);
          Alert.alert('Excel Error', 'Failed to parse Excel file.');
          setUploading(false);
          return;
        }
      } else {
        Alert.alert('Error', 'Unsupported file type. Please upload JSON or Excel file.');
        setUploading(false);
        return;
      }

      if (!Array.isArray(data)) {
        Alert.alert('Error', 'Invalid JSON format. The root must be an array of exam records.');
        setUploading(false);
        return;
      }

      // ─── Teacher Authorization Check for Bulk Upload ────────────────────────────
      if (isTeacher && data.length > 0) {
        const sampleRow = data[0];
        const allKeys = Object.keys(sampleRow);
        const totalSuffix = '_Total';
        const obtainedSuffix = '_Obtained';
        const uploadSubjects: string[] = [];

        for (const key of allKeys) {
          if (key.endsWith(totalSuffix)) {
            const subject = key.slice(0, -totalSuffix.length);
            if (allKeys.includes(subject + obtainedSuffix)) {
              uploadSubjects.push(subject.replace(/_/g, ' ').trim().toLowerCase());
            }
          }
        }

        const hasMultiSubject = uploadSubjects.length > 0;
        if (!hasMultiSubject && sampleRow.bookName) {
          uploadSubjects.push(sampleRow.bookName.trim().toLowerCase());
        }

        const normalizedTeacherSubject = teacherSubject.trim().toLowerCase();
        const hasUnauthorizedSubject = uploadSubjects.some(subj => subj && subj !== normalizedTeacherSubject);

        if (hasUnauthorizedSubject) {
          Alert.alert(
            'Authorization Error',
            `You can only upload exam records for "${teacherSubject}" subject. The file contains unauthorized subjects.`
          );
          setUploading(false);
          return;
        }
      }

      let addedCount = 0;
      let errorCount = 0;
      let accountsCreated = 0;
      const createdEmails = new Set<string>();
      setUploadTotal(data.length);
      setUploadProgress(0);

      const generatePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
        let pass = '';
        for (let i = 0; i < 8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
        return pass;
      };

      const sampleRow = data[0] || {};
      const allKeys = Object.keys(sampleRow);
      const subjectNames: string[] = [];
      const totalSuffix = '_Total';
      const obtainedSuffix = '_Obtained';

      for (const key of allKeys) {
        if (key.endsWith(totalSuffix)) {
          const subject = key.slice(0, -totalSuffix.length);
          if (allKeys.includes(subject + obtainedSuffix)) {
            subjectNames.push(subject);
          }
        }
      }
      const hasMultiSubject = subjectNames.length > 0;

      for (const item of data) {
        if (item.title && item.category) {
          try {
            let formattedDate = item.date;
            if (item.date) {
              const parsedDate = new Date(item.date);
              if (!isNaN(parsedDate.getTime())) {
                formattedDate = parsedDate.toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric'
                });
              }
            }

            let books: { name: string; totalMarks: string; obtainedMarks: string }[] = [];
            let aggTotal = 0;
            let aggObtained = 0;
            let computedStatus = 'Absent';

            if (hasMultiSubject) {
              for (const subj of subjectNames) {
                if (isTeacher && teacherSubject && subj.replace(/_/g, ' ').trim().toLowerCase() !== teacherSubject.trim().toLowerCase()) {
                  continue; // Restrict teacher to only their subject
                }
                const total = item[subj + totalSuffix];
                const obtained = item[subj + obtainedSuffix];
                if (total !== undefined && total !== '' && total !== null) {
                  const t = parseFloat(total) || 0;
                  const o = parseFloat(obtained) || 0;
                  books.push({
                    name: subj.replace(/_/g, ' '),
                    totalMarks: t.toString(),
                    obtainedMarks: o.toString(),
                  });
                  aggTotal += t;
                  aggObtained += o;
                }
              }
              if (aggTotal > 0) {
                const percentage = (aggObtained / aggTotal) * 100;
                computedStatus = percentage >= 40 ? 'Pass' : 'Fail';
              }
            } else {
              if (item.obtainedMarks && item.obtainedMarks.toString().trim() !== '') {
                const marks = parseFloat(item.obtainedMarks);
                if (!isNaN(marks)) {
                  computedStatus = marks >= 40 ? 'Pass' : 'Fail';
                }
              }
            }

            const docId = Date.now().toString() + '_' + addedCount;
            const examDoc: any = {
              title: item.title,
              date: formattedDate,
              category: item.category,
              rollNo: item.rollNo || '',
              studentName: item.studentName || '',
              studentEmail: item.studentEmail || '',
              studentClass: item.studentClass || '',
              status: computedStatus,
              description: item.description || '',
              updatedAt: serverTimestamp(),
              // ─── Teacher Tracking for Bulk Upload ────────────────────────────────
              ...(isTeacher && { teacherId, createdBy: teacherId }),
            };

            if (hasMultiSubject && books.length > 0) {
              examDoc.books = books;
              examDoc.totalMarks = aggTotal.toString();
              examDoc.obtainedMarks = aggObtained.toString();
              examDoc.bookName = books.map(b => b.name).join(', ');
            } else {
              examDoc.bookName = isTeacher && teacherSubject ? teacherSubject : (item.bookName || '');
              examDoc.totalMarks = item.totalMarks?.toString() || '';
              examDoc.obtainedMarks = item.obtainedMarks?.toString() || '';
            }

            await setDoc(doc(db, 'exams', docId), examDoc);
            addedCount++;

            const email = (item.studentEmail || '').trim().toLowerCase();
            if (email && !createdEmails.has(email)) {
              createdEmails.add(email);
              let secondaryApp;
              try {
                const existingProfile = await getDocs(
                  query(collection(db, 'studentsprofile'), where('email', '==', email))
                );
                if (existingProfile.empty) {
                  const password = generatePassword();
                  secondaryApp = initializeApp(firebaseConfig, `examStudent_${Date.now()}_${addedCount}`);
                  const secondaryAuth = initializeAuth(secondaryApp, {
                    persistence: getReactNativePersistence(AsyncStorage)
                  });
                  const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
                  const uid = userCredential.user.uid;

                  await setDoc(doc(db, 'studentsprofile', uid), {
                    fullname: item.studentName || '',
                    fathername: '',
                    email: email,
                    phone: '',
                    rollno: item.rollNo || '',
                    class: item.studentClass || '',
                    section: '',
                    session: '',
                    image: '',
                    gender: '',
                    role: 'student',
                    password: password,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                  });

                  await setDoc(doc(db, 'exams', docId), { studentPassword: password }, { merge: true });
                  accountsCreated++;
                }
              } catch (authErr: any) {
                console.warn('Could not create auth for', email, authErr?.message);
              } finally {
                if (secondaryApp) {
                  try { await deleteApp(secondaryApp); } catch (_) { }
                }
              }
            }

            setUploadProgress(addedCount + errorCount);
          } catch (err) {
            console.error('Error adding exam:', item, err);
            errorCount++;
          }
        } else {
          errorCount++;
          setUploadProgress(addedCount + errorCount);
        }
      }

      const subjectInfo = hasMultiSubject ? ` (${subjectNames.length} subjects detected)` : '';
      const accountInfo = accountsCreated > 0 ? `\nNew student accounts created: ${accountsCreated}` : '';
      Alert.alert('Upload Complete', `Successfully added ${addedCount} exam records${subjectInfo}.\nFailed/Skipped: ${errorCount}${accountInfo}`);

    } catch (error: any) {
      console.error("File upload error:", error);
      Alert.alert('Error', `Failed to process the file: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadTotal(0);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const sampleData = [
        {
          studentName: 'Ahmed Ali', fatherName: 'Ali Khan', rollNo: '101',
          studentClass: '9th', title: 'T1', category: 'Monthly', date: '2024-03-20',
          Urdu_Total: 100, Urdu_Obtained: 85, English_Total: 100, English_Obtained: 72,
          Computer_Total: 50, Computer_Obtained: 40, Physics_Total: 75, Physics_Obtained: 60,
          Biology_Total: 75, Biology_Obtained: 55, Math_Total: 100, Math_Obtained: 90,
          description: 'First Monthly Test',
        },
        {
          studentName: 'Sara Fatima', fatherName: 'Muhammad Iqbal', rollNo: '102',
          studentClass: '9th', title: 'T1', category: 'Monthly', date: '2024-03-20',
          Urdu_Total: 100, Urdu_Obtained: 78, English_Total: 100, English_Obtained: 65,
          Computer_Total: 50, Computer_Obtained: 35, Physics_Total: 75, Physics_Obtained: 50,
          Biology_Total: 75, Biology_Obtained: 60, Math_Total: 100, Math_Obtained: 70,
          description: 'First Monthly Test',
        },
      ];

      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Exam Template');
      const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const filename = FileSystem.documentDirectory + 'Exam_Record_Template.xlsx';
      await FileSystem.writeAsStringAsync(filename, base64, { encoding: FileSystem.EncodingType.Base64 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filename);
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error: any) {
      console.error('Template download error:', error);
      Alert.alert('Error', 'Failed to generate template');
    }
  };

  const handleManualEntry = () => {
    setChoiceModalVisible(false);
    resetForm();
    if (isTeacher && teacherSubject) {
      setCurrentBookName(teacherSubject);
    }
    setModalVisible(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const dynamicTestOptions = (() => {
    const titleSet = new Set<string>();
    // 1. Add titles from web dashboard (synced via Firestore)
    if (examTitles && examTitles.length > 0) {
      examTitles.forEach(t => titleSet.add(t));
    }
    // 2. Add titles from existing exam records
    exams.filter(e => (e.studentClass || '').trim() === '2nd Year')
      .forEach(e => { if (e.title) titleSet.add(e.title.trim()); });
    return Array.from(titleSet).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''));
      const numB = parseInt(b.replace(/\D/g, ''));
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  })();

  const filteredExams = (() => {
    const classExams = exams.filter(e => (e.studentClass || '').trim() === '2nd Year');
    const matched = classExams.filter(e => {
      const matchesTestNo = filterTestNo ? (e.title || '').trim() === filterTestNo : true;
      let matchesGender = true;
      if (filterGender !== 'All') {
        const student = students.find(s => 
          (s.id && s.id === (e.rollNo || '').trim()) || 
          ((s as any).rollno && (s as any).rollno === (e.rollNo || '').trim()) || 
          ((s as any).studentId && (s as any).studentId === (e.rollNo || '').trim()) || 
          (s.name && s.name === (e.studentName || '').trim()) || 
          ((s as any).fullname && (s as any).fullname === (e.studentName || '').trim())
        );
        const g = ((student?.gender || '') as string).toLowerCase().trim();
        const isBoys = filterGender === 'Boys';
        matchesGender = isBoys ? (g === 'male' || g === 'boy' || g === 'm') : (g === 'female' || g === 'girl' || g === 'f');
      }
      return matchesTestNo && matchesGender;
    });
    return matched;
  })();

  const studentProgressList = (() => {
    const map = new Map<string, StudentProgress>();
    for (const e of filteredExams) {
      const key = (e.rollNo || e.studentName || '') + '|' + (e.studentClass || '');
      const total = parseFloat(e.totalMarks || '0') || 0;
      const obtained = parseFloat(e.obtainedMarks || '0') || 0;
      const existing = map.get(key);
      if (existing) {
        existing.totalMarks += total;
        existing.obtainedMarks += obtained;
        existing.testCount += 1;
        if (e.title && !existing.tests.includes(e.title)) existing.tests.push(e.title);
      } else {
        map.set(key, {
          studentName: e.studentName || 'Unknown',
          rollNo: e.rollNo || '',
          studentClass: e.studentClass || '',
          totalMarks: total, obtainedMarks: obtained,
          testCount: 1, tests: e.title ? [e.title] : [],
          latestExam: e,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const pA = a.totalMarks > 0 ? (a.obtainedMarks / a.totalMarks) * 100 : 0;
      const pB = b.totalMarks > 0 ? (b.obtainedMarks / b.totalMarks) * 100 : 0;
      return pB - pA;
    });
  })();

  const totalStudentsShown = studentProgressList.length;
  const totalTestsShown = studentProgressList.reduce((sum, student) => sum + student.testCount, 0);
  const averageScore = totalStudentsShown > 0
    ? Math.round(
      studentProgressList.reduce((sum, student) => {
        const pct = student.totalMarks > 0 ? (student.obtainedMarks / student.totalMarks) * 100 : 0;
        return sum + pct;
      }, 0) / totalStudentsShown
    )
    : 0;
  const activeFilterCount = [filterTestNo, filterGender !== 'All' ? filterGender : '']
    .filter(Boolean).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.headerIconButton, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleBlock}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>2nd Year Exams</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Results, marks, and student progress</Text>
        </View>
        <TouchableOpacity onPress={() => openModal()} style={[styles.headerPrimaryButton, { backgroundColor: theme.primary }]}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.headerPrimaryButtonText}>New</Text>
        </TouchableOpacity>
      </View>



      <View style={styles.summaryGrid}>
        <View style={[styles.summaryTile, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.summaryIcon, { backgroundColor: theme.primary + '14' }]}>
            <Ionicons name="people-outline" size={14} color={theme.primary} />
          </View>
          <View style={styles.summaryTextBlock}>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{totalStudentsShown}</Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Students</Text>
          </View>
        </View>
        <View style={[styles.summaryTile, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.summaryIcon, { backgroundColor: '#10b98118' }]}>
            <Ionicons name="document-text-outline" size={14} color="#10b981" />
          </View>
          <View style={styles.summaryTextBlock}>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{totalTestsShown}</Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Tests</Text>
          </View>
        </View>
        <View style={[styles.summaryTile, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.summaryIcon, { backgroundColor: '#f59e0b18' }]}>
            <Ionicons name="analytics-outline" size={14} color="#f59e0b" />
          </View>
          <View style={styles.summaryTextBlock}>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{averageScore}%</Text>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Average</Text>
          </View>
        </View>
      </View>

      {/* ── Tap-outside overlay to dismiss dropdowns ── */}
      {isAnyFilterDropdownOpen && (
        <Pressable
          onPress={closeAllDropdowns}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
        />
      )}

      {/* ── Filter Dropdowns Row ── */}
      <View style={styles.filterRow}>

        {/* ── Filter: Test No ── */}
        <View style={{ flex: 1, position: 'relative', zIndex: 400 }}>
          <TouchableOpacity
            ref={filterTestNoAnchorRef}
            onPress={() => {
              setShowFilterTestNoDropdown(!showFilterTestNoDropdown);
              setShowFilterGenderDropdown(false);
            }}
            style={{
              flexDirection: 'row', alignItems: 'center', height: scale(30), paddingHorizontal: scale(8), borderRadius: scale(7),
              backgroundColor: filterTestNo ? theme.primary + '10' : theme.card,
              borderWidth: 1, borderColor: filterTestNo ? theme.primary + '30' : theme.border,
            }}
          >
            {!filterTestNo && <Ionicons name="document-text-outline" size={11} color={theme.textSecondary} style={{ marginRight: scale(3) }} />}
            <Text style={{ color: filterTestNo ? theme.primary : theme.textSecondary, flex: 1, fontSize: scale(10), fontWeight: filterTestNo ? '600' : '500' }} numberOfLines={1}>
              {filterTestNo || 'Test'}
            </Text>
            <Ionicons name={showFilterTestNoDropdown ? 'chevron-up' : 'chevron-down'} size={11} color={filterTestNo ? theme.primary : theme.textSecondary} style={{ marginLeft: scale(2) }} />
          </TouchableOpacity>
          {showFilterTestNoDropdown && (
            <View style={{ position: 'absolute', top: scale(34), left: 0, right: 0, zIndex: 2000 }}>
              <DropdownMenu
                options={[
                  { label: 'All Tests', value: '', icon: 'apps-outline' },
                  ...dynamicTestOptions.map(t => ({ label: t, value: t, icon: 'document-text-outline' })),
                ]}
                selectedValue={filterTestNo}
                onSelect={(val) => { setFilterTestNo(val); setShowFilterTestNoDropdown(false); }}
                theme={theme}
                zIndex={2000}
                maxHeight={DROPDOWN_ITEM_HEIGHT * 5}
                showScrollBar={true}
                anchorRef={filterTestNoAnchorRef}
                onClose={() => setShowFilterTestNoDropdown(false)}
              />
            </View>
          )}
        </View>

        {/* ── Filter: Gender ── */}
        <View style={{ flex: 1, position: 'relative', zIndex: 300 }}>
          <TouchableOpacity
            ref={filterGenderAnchorRef}
            onPress={() => {
              setShowFilterGenderDropdown(!showFilterGenderDropdown);
              setShowFilterTestNoDropdown(false);
            }}
            style={{
              flexDirection: 'row', alignItems: 'center', height: scale(30), paddingHorizontal: scale(8), borderRadius: scale(7),
              backgroundColor: filterGender !== 'All' ? theme.primary + '10' : theme.card,
              borderWidth: 1, borderColor: filterGender !== 'All' ? theme.primary + '30' : theme.border,
            }}
          >
            {filterGender === 'All' && <Ionicons name="people-outline" size={11} color={theme.textSecondary} style={{ marginRight: scale(3) }} />}
            <Text style={{ color: filterGender !== 'All' ? theme.primary : theme.textSecondary, flex: 1, fontSize: scale(10), fontWeight: filterGender !== 'All' ? '600' : '500' }} numberOfLines={1}>
              {filterGender === 'All' ? 'Gender' : filterGender}
            </Text>
            <Ionicons name={showFilterGenderDropdown ? 'chevron-up' : 'chevron-down'} size={11} color={filterGender !== 'All' ? theme.primary : theme.textSecondary} style={{ marginLeft: scale(2) }} />
          </TouchableOpacity>
          {showFilterGenderDropdown && (
            <View style={{ position: 'absolute', top: scale(34), left: 0, right: 0, zIndex: 2000 }}>
              <DropdownMenu
                options={[
                  { label: 'All', value: 'All', icon: 'people-outline' },
                  { label: 'Boys', value: 'Boys', icon: 'man-outline' },
                  { label: 'Girls', value: 'Girls', icon: 'woman-outline' },
                ]}
                selectedValue={filterGender}
                onSelect={(val) => { setFilterGender(val); setShowFilterGenderDropdown(false); }}
                theme={theme}
                zIndex={2000}
                maxHeight={DROPDOWN_ITEM_HEIGHT * 3}
                anchorRef={filterGenderAnchorRef}
                onClose={() => setShowFilterGenderDropdown(false)}
              />
            </View>
          )}
        </View>

      </View>

      {activeFilterCount > 0 && (
        <Text style={[styles.activeFilterText, { color: theme.textSecondary }]}>
          {activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'} applied
        </Text>
      )}

      {/* Upload Progress */}
      {uploading && uploadTotal > 0 && (
        <View style={{ paddingHorizontal: scale(12), paddingVertical: scale(8), backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(6) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(6) }}>
              <ActivityIndicator size="small" color="#f59e0b" />
              <Text style={{ fontSize: scale(13), fontWeight: '700', color: theme.text }}>Uploading Exams...</Text>
            </View>
            <Text style={{ fontSize: scale(12), fontWeight: '600', color: '#f59e0b' }}>
              {uploadProgress}/{uploadTotal} ({uploadTotal > 0 ? Math.round((uploadProgress / uploadTotal) * 100) : 0}%)
            </Text>
          </View>
          <View style={{ height: scale(6), borderRadius: scale(3), backgroundColor: theme.border + '40', overflow: 'hidden' }}>
            <View style={{ height: '100%', borderRadius: scale(3), backgroundColor: '#f59e0b', width: `${uploadTotal > 0 ? Math.min((uploadProgress / uploadTotal) * 100, 100) : 0}%` }} />
          </View>
          <Text style={{ fontSize: scale(10), color: theme.textSecondary, marginTop: scale(4), textAlign: 'center' }}>
            Please wait while exam records are being uploaded...
          </Text>
        </View>
      )}

      {/* ── Table ── */}
      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: scale(20) }} />
      ) : (
        <>
          <View style={[styles.listTitleBar, { borderBottomColor: theme.border }]}>
            <View>
              <Text style={[styles.listTitle, { color: theme.text }]}>Student Performance</Text>
              <Text style={[styles.listSubtitle, { color: theme.textSecondary }]}>Sorted by highest score</Text>
            </View>
            <Text style={[styles.listCount, { color: theme.primary, backgroundColor: theme.primary + '12' }]}>
              {Math.min(visibleCount, studentProgressList.length)}/{studentProgressList.length}
            </Text>
          </View>
          <View style={[styles.tableHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
            <Text style={[styles.tableHeaderCell, { flex: 2.2, color: theme.textSecondary, fontSize: scale(8) }]}>STUDENT</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0.8, textAlign: 'center', color: theme.textSecondary, fontSize: scale(8) }]}>CLASS</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0.6, textAlign: 'center', color: theme.textSecondary, fontSize: scale(8) }]}>TESTS</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0.7, textAlign: 'center', color: theme.textSecondary, fontSize: scale(8) }]}>MARKS</Text>
            <Text style={[styles.tableHeaderCell, { flex: 0.7, textAlign: 'right', color: theme.textSecondary, fontSize: scale(8) }]}>SCORE</Text>
          </View>
          <FlatList
            data={studentProgressList.slice(0, visibleCount)}
            keyExtractor={(_, idx) => idx.toString()}
            style={{ flex: 1 }}
            contentContainerStyle={styles.tableContent}
            scrollEnabled={!isAnyFilterDropdownOpen}
            initialNumToRender={12}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            windowSize={5}
            removeClippedSubviews
            getItemLayout={(_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })}
            ListEmptyComponent={
              <Text style={[styles.noDataText, { color: theme.textSecondary }]}>No entries found.</Text>
            }
            ListFooterComponent={
              visibleCount < studentProgressList.length ? (
                <TouchableOpacity
                  onPress={() => setVisibleCount(prev => prev + 20)}
                  style={{ alignItems: 'center', paddingVertical: scale(10), marginBottom: scale(6) }}
                >
                  <Text style={{ fontSize: scale(12), fontWeight: '600', color: theme.primary }}>
                    Load {Math.min(20, studentProgressList.length - visibleCount)} more ({studentProgressList.length - visibleCount} remaining)
                  </Text>
                </TouchableOpacity>
              ) : null
            }
            onEndReached={() => {
              if (visibleCount < studentProgressList.length) setVisibleCount(prev => prev + 20);
            }}
            onEndReachedThreshold={0.4}
            renderItem={({ item: student, index }) => (
              <ExamRow
                student={student}
                index={index}
                theme={theme}
                onPress={(exam) => {
                  setSelectedExamForOptions(exam);
                  setShowOptionsModal(true);
                }}
              />
            )}
          />
          <View style={{ paddingHorizontal: scale(10), paddingTop: scale(8), paddingBottom: Platform.OS === 'android' ? 28 : 12, borderTopWidth: 1, borderTopColor: theme.border }}>
            <Text style={{ fontSize: scale(10), color: theme.textSecondary, textAlign: 'center', letterSpacing: 0.2 }}>
              Showing {Math.min(visibleCount, studentProgressList.length)} of {studentProgressList.length} students
            </Text>
          </View>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          EDIT / ADD MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal visible={modalVisible} animationType="slide" transparent statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <View style={{ flex: 1, paddingTop: Platform.OS === 'ios' ? 48 : (StatusBar.currentHeight || 30) }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: scale(16), paddingVertical: scale(14), borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.card }}>
              <View>
                <Text style={{ fontSize: scale(16), fontWeight: '800', color: theme.text }}>{editingExam ? 'Edit Record' : 'New Record'}</Text>
                <Text style={{ fontSize: scale(11), color: theme.textSecondary, marginTop: scale(1) }}>{editingExam ? 'Update exam details' : 'Enter student exam details'}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: scale(8) }}>
                <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }} style={{ width: scale(32), height: scale(32), borderRadius: scale(16), backgroundColor: theme.error + '15', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="close" size={16} color={theme.error} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveExam} style={{ width: scale(32), height: scale(32), borderRadius: scale(16), backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: scale(12), paddingBottom: scale(30) }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              scrollEnabled={!isAnyFormDropdownOpen}
              keyboardShouldPersistTaps="handled"
            >
            {/* ═══ Student Info Section ═══ */}
            <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border, zIndex: 3000, elevation: 3 }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person-outline" size={14} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.primary }]}>Student Info</Text>
                {studentInfoLocked && (
                  <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary + '12', paddingHorizontal: scale(8), paddingVertical: scale(3), borderRadius: scale(10) }}>
                    <Ionicons name="lock-closed" size={10} color={theme.primary} style={{ marginRight: scale(3) }} />
                    <Text style={{ fontSize: scale(9), fontWeight: '700', color: theme.primary, textTransform: 'uppercase', letterSpacing: 0.3 }}>Locked</Text>
                  </View>
                )}
              </View>

              {studentInfoLocked ? (
                /* Locked: read-only strip */
                <View style={{ backgroundColor: theme.card, borderRadius: scale(8), padding: scale(10), borderWidth: 1, borderColor: theme.border }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: scale(36), height: scale(36), borderRadius: scale(18), backgroundColor: theme.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: scale(10) }}>
                      <Ionicons name="person" size={16} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: scale(14), fontWeight: '700', color: theme.text }}>{studentName || 'Unknown'}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: scale(3), flexWrap: 'wrap', gap: scale(6) }}>
                        {rollNo ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="id-card-outline" size={11} color={theme.textSecondary} style={{ marginRight: scale(3) }} />
                            <Text style={{ fontSize: scale(11), color: theme.textSecondary }}>{rollNo}</Text>
                          </View>
                        ) : null}
                        {studentClass ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="school-outline" size={11} color={theme.textSecondary} style={{ marginRight: scale(3) }} />
                            <Text style={{ fontSize: scale(11), color: theme.textSecondary }}>{studentClass}</Text>
                          </View>
                        ) : null}
                        {studentEmail ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="mail-outline" size={11} color={theme.textSecondary} style={{ marginRight: scale(3) }} />
                            <Text style={{ fontSize: scale(11), color: theme.textSecondary }} numberOfLines={1}>{studentEmail}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                /* Unlocked: editable fields */
                <>
                  {/* Row: Search Student + Test No */}
                  <View style={[styles.row, { zIndex: 2000 }]}>

                    {/* Search Student */}
                    <View style={[styles.col, { flex: 0.65, zIndex: 1000 }]}>
                      <Text style={[styles.label, { color: theme.text }]}>Search Student</Text>
                      <View style={[styles.selectInput, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Ionicons name="search" size={14} color={theme.textSecondary} style={{ marginRight: scale(6) }} />
                        <TextInput
                          style={{ flex: 1, fontSize: scale(13), color: theme.text, padding: 0 }}
                          placeholder="Name or ID..."
                          placeholderTextColor={theme.textSecondary}
                          value={studentSearchTerm}
                          editable={!editingExam}
                          onChangeText={(text) => {
                            setStudentSearchTerm(text);
                            setShowStudentDropdown(true);
                          }}
                          onFocus={() => {
                            setShowStudentDropdown(true);
                            closeAllDropdowns();
                            setShowStudentDropdown(true);
                          }}
                        />
                        {!editingExam && studentSearchTerm.length > 0 && (
                          <TouchableOpacity
                            onPress={() => { setStudentSearchTerm(''); setShowStudentDropdown(false); }}
                            hitSlop={{ top: scale(8), bottom: scale(8), left: scale(8), right: scale(8) }}
                          >
                            <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    {/* ── Test No. picker ── */}
                    <View style={[styles.col, { flex: 0.35, zIndex: 2000 }]}>
                      <Text style={[styles.label, { color: theme.text }]}>Test No.</Text>
                      <View style={{ position: 'relative', zIndex: 2000 }}>
                        <TouchableOpacity
                          ref={titleAnchorRef}
                          onPress={() => {
                            setShowTitleDropdown(!showTitleDropdown);
                            setShowClassDropdown(false);
                            setShowBookDropdown(false);
                            setShowStudentDropdown(false);
                            setShowCategoryDropdown(false);
                          }}
                          style={[styles.selectInput, { backgroundColor: theme.card, borderColor: showTitleDropdown ? theme.primary : theme.border, marginBottom: 0 }]}
                        >
                          <Text style={{ color: title ? theme.text : theme.textSecondary, fontSize: scale(13), flex: 1 }}>
                            {title || 'Select'}
                          </Text>
                          <Ionicons name={showTitleDropdown ? 'chevron-up' : 'chevron-down'} size={14} color={theme.textSecondary} />
                        </TouchableOpacity>

                        {/* ▼ REPLACED: Title / Test No Dropdown — 5 visible, scrollable */}
                        {showTitleDropdown && (
                          <View style={{ marginTop: scale(4) }}>
                            <DropdownMenu
                              options={dynamicTitleOptions.map(t => ({
                                label: t,
                                value: t,
                                icon: 'document-text-outline',
                              }))}
                              selectedValue={title}
                              onSelect={(val) => {
                                setTitle(val);
                                setShowTitleDropdown(false);
                              }}
                              theme={theme}
                              maxHeight={DROPDOWN_ITEM_HEIGHT * 5}
                              showScrollBar={true}
                              anchorRef={titleAnchorRef}
                              onClose={() => setShowTitleDropdown(false)}
                            />
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Student Dropdown Results */}
                  {showStudentDropdown && (() => {
                    const term = studentSearchTerm.toLowerCase();
                    const classStudents = students.filter(s => {
                      const g = (s.grade || (s as any).class || '').trim().toLowerCase();
                      return g === '2nd year' || g === '12th' || g === '12';
                    });
                    const filtered = term.length === 0 ? classStudents : classStudents.filter(s =>
                      (s.name || '').toLowerCase().includes(term) ||
                      (s.studentId || '').toLowerCase().includes(term) ||
                      (s.email || '').toLowerCase().includes(term)
                    );
                    return (
                      <View style={[styles.inlineDropdown, { backgroundColor: theme.card, borderColor: theme.border, maxHeight: scale(200) }]}>
                        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                          {filtered.length === 0 ? (
                            <View style={{ padding: scale(14), alignItems: 'center' }}>
                              <Text style={{ color: theme.textSecondary, fontSize: scale(12) }}>No students found</Text>
                            </View>
                          ) : (
                            filtered.map((s) => (
                              <TouchableOpacity
                                key={s.id}
                                onPress={() => {
                                  setRollNo(s.studentId || '');
                                  setStudentName(s.name || '');
                                  setStudentEmail(s.email || '');
                                  setStudentClass(s.grade || '');
                                  setStudentSearchTerm(s.name || '');
                                  setShowStudentDropdown(false);
                                  setStudentSelected(true);
                                }}
                                style={[styles.dropdownItem, { borderBottomColor: theme.border }]}
                              >
                                <View style={styles.studentDropdownRow}>
                                  <View style={[styles.studentDropdownAvatar, { backgroundColor: theme.primary + '15' }]}>
                                    <Ionicons name="person" size={14} color={theme.primary} />
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <Text style={{ color: theme.text, fontSize: scale(13), fontWeight: '600' }}>{s.name}</Text>
                                    <Text style={{ color: theme.textSecondary, fontSize: scale(11) }}>{s.studentId} · {s.grade || 'N/A'}</Text>
                                  </View>
                                </View>
                              </TouchableOpacity>
                            ))
                          )}
                        </ScrollView>
                      </View>
                    );
                  })()}

                  {/* Selected student strip OR editable fields */}
                  {studentSelected && (
                    <View style={{ backgroundColor: theme.card, borderRadius: scale(8), padding: scale(10), borderWidth: 1, borderColor: theme.border, marginTop: scale(4) }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: scale(36), height: scale(36), borderRadius: scale(18), backgroundColor: theme.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: scale(10) }}>
                          <Ionicons name="person" size={16} color={theme.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: scale(14), fontWeight: '700', color: theme.text }}>{studentName || 'Unknown'}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: scale(3), flexWrap: 'wrap', gap: scale(6) }}>
                            {rollNo ? (
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="id-card-outline" size={11} color={theme.textSecondary} style={{ marginRight: scale(3) }} />
                                <Text style={{ fontSize: scale(11), color: theme.textSecondary }}>{rollNo}</Text>
                              </View>
                            ) : null}
                            {studentClass ? (
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="school-outline" size={11} color={theme.textSecondary} style={{ marginRight: scale(3) }} />
                                <Text style={{ fontSize: scale(11), color: theme.textSecondary }}>{studentClass}</Text>
                              </View>
                            ) : null}
                            {studentEmail ? (
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="mail-outline" size={11} color={theme.textSecondary} style={{ marginRight: scale(3) }} />
                                <Text style={{ fontSize: scale(11), color: theme.textSecondary }} numberOfLines={1}>{studentEmail}</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                        {!editingExam && (
                          <TouchableOpacity
                            onPress={() => {
                              setStudentSelected(false);
                              setStudentSearchTerm('');
                              setRollNo('');
                              setStudentName('');
                              setStudentEmail('');
                              setStudentClass('');
                            }}
                            hitSlop={{ top: scale(8), bottom: scale(8), left: scale(8), right: scale(8) }}
                            style={{ width: scale(28), height: scale(28), borderRadius: scale(14), backgroundColor: theme.error + '12', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Ionicons name="close" size={14} color={theme.error} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}

                </>
              )}
            </View>

            {/* ═══ Exam Info Section ═══ */}
            <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border, zIndex: 2000, elevation: 2 }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text-outline" size={14} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.primary }]}>Exam Info</Text>
              </View>

              {/* Duplicate Warning */}
              {title && rollNo && !editingExam && (() => {
                const duplicate = exams.find(e => e.title === title && e.rollNo === rollNo);
                if (duplicate) {
                  return (
                    <View style={{ backgroundColor: '#FFF3CD', borderRadius: scale(8), padding: scale(10), marginBottom: scale(10), flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="warning" size={16} color="#856404" style={{ marginRight: scale(8) }} />
                      <Text style={{ color: '#856404', fontSize: scale(12), flex: 1 }}>
                        This student already has a record for {title}. Saving will create a duplicate.
                      </Text>
                    </View>
                  );
                }
                return null;
              })()}

              {/* Row: Category + Date */}
              <View style={[styles.row, { zIndex: 1500 }]}>
                <View style={[styles.col, { flex: 0.55, position: 'relative', zIndex: 1500 }]}>
                  <Text style={[styles.label, { color: theme.text }]}>Category</Text>
                  <TouchableOpacity
                    ref={categoryAnchorRef}
                    onPress={() => {
                      setShowCategoryDropdown(!showCategoryDropdown);
                      setShowTitleDropdown(false);
                      setShowClassDropdown(false);
                      setShowBookDropdown(false);
                      setShowStudentDropdown(false);
                    }}
                    style={[styles.selectInput, { backgroundColor: theme.card, borderColor: showCategoryDropdown ? theme.primary : theme.border }]}
                  >
                    <Text style={{ color: category ? theme.text : theme.textSecondary, fontSize: scale(13), flex: 1 }}>
                      {category || 'Select'}
                    </Text>
                    <Ionicons name={showCategoryDropdown ? 'chevron-up' : 'chevron-down'} size={14} color={theme.textSecondary} />
                  </TouchableOpacity>

                  {/* ▼ REPLACED: Category Dropdown — 5 visible, scrollable */}
                  {showCategoryDropdown && (
                    <DropdownMenu
                      options={CATEGORIES.map((cat, i) => ({
                        label: cat,
                        value: cat,
                        icon: CATEGORY_ICONS[i],
                      }))}
                      selectedValue={category}
                      onSelect={(val) => {
                        setCategory(val);
                        setShowCategoryDropdown(false);
                      }}
                      theme={theme}
                      zIndex={1500}
                      anchorRef={categoryAnchorRef}
                      onClose={() => setShowCategoryDropdown(false)}
                    />
                  )}
                </View>

                <View style={[styles.col, { flex: 0.45 }]}>
                  <Text style={[styles.label, { color: theme.text }]}>Date</Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    style={[styles.selectInput, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} style={{ marginRight: scale(6) }} />
                    <Text style={{ color: theme.text, fontSize: scale(13), flex: 1 }}>
                      {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  maximumDate={new Date(2030, 11, 31)}
                  minimumDate={new Date(2020, 0, 1)}
                />
              )}
            </View>

            {/* ═══ Marks & Books Section ═══ */}
            <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border, zIndex: 1000, elevation: 1 }]}>
              <View style={[styles.sectionHeader, { marginBottom: scale(10) }]}>
                <Ionicons name="library-outline" size={14} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.primary }]}>Marks & Books</Text>
                {isTeacher && teacherSubject && (
                  <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary + '12', paddingHorizontal: scale(8), paddingVertical: scale(3), borderRadius: scale(10) }}>
                    <Ionicons name="lock-closed" size={10} color={theme.primary} style={{ marginRight: scale(3) }} />
                    <Text style={{ fontSize: scale(9), fontWeight: '700', color: theme.primary, textTransform: 'uppercase', letterSpacing: 0.3 }}>Restricted to {teacherSubject}</Text>
                  </View>
                )}
              </View>

              {/* ── Teacher View: Single locked subject with direct mark inputs ── */}
              {isTeacher && teacherSubject ? (
                <View style={styles.teacherMarksPanel}>
                  {/* Info banner for teacher */}
                  <View style={[styles.teacherSubjectPill, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '25' }]}>
                    <View style={[styles.teacherSubjectIcon, { backgroundColor: theme.primary + '16' }]}>
                      <Ionicons name="book-outline" size={14} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.teacherSubjectLabel, { color: theme.textSecondary }]}>Selected Subject</Text>
                      <Text style={[styles.teacherSubjectName, { color: theme.primary }]} numberOfLines={1}>
                        {teacherSubject}
                      </Text>
                    </View>
                    <Ionicons name="lock-closed" size={13} color={theme.primary} />
                  </View>

                  {/* Column headers */}
                  <View style={{ flexDirection: 'row', paddingHorizontal: scale(2), marginBottom: scale(2) }}>
                    <Text style={{ flex: 2, fontSize: scale(9), fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4 }}>Subject</Text>
                    <Text style={{ flex: 1, fontSize: scale(9), fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center' }}>Total</Text>
                    <Text style={{ flex: 1, fontSize: scale(9), fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center' }}>Obtained</Text>
                  </View>

                  {/* Subject row — subject name locked, marks editable */}
                  {[getTeacherSubjectBook()].map((book, index) => (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: scale(6) }}>
                      {/* Locked subject badge */}
                      <View style={[
                        { flex: 2, flexDirection: 'row', alignItems: 'center', height: scale(36), paddingHorizontal: scale(8), borderRadius: scale(7), borderWidth: 1 },
                        { backgroundColor: theme.primary + '12', borderColor: theme.primary + '35' }
                      ]}>
                        <Ionicons name="book" size={13} color={theme.primary} style={{ marginRight: scale(6) }} />
                        <Text style={{ fontSize: scale(13), fontWeight: '700', color: theme.primary, flex: 1 }} numberOfLines={1}>
                          {book.name}
                        </Text>
                        <Ionicons name="lock-closed" size={11} color={theme.primary + '60'} />
                      </View>

                      {/* Total marks input */}
                      <TextInput
                        style={[{
                          flex: 1, height: scale(36), borderWidth: 1, borderRadius: scale(7),
                          paddingHorizontal: scale(8), fontSize: scale(13), fontWeight: '700', textAlign: 'center',
                          backgroundColor: theme.card, color: theme.text, borderColor: theme.border,
                        }]}
                        placeholder="—"
                        placeholderTextColor={theme.textTertiary}
                        value={book.totalMarks}
                        onChangeText={(val) => {
                          updateTeacherSubjectBook('totalMarks', val);
                        }}
                        keyboardType="numeric"
                      />

                      {/* Obtained marks input */}
                      <TextInput
                        style={[{
                          flex: 1, height: scale(36), borderWidth: 1, borderRadius: scale(7),
                          paddingHorizontal: scale(8), fontSize: scale(13), fontWeight: '800', textAlign: 'center',
                          backgroundColor: theme.primary + '08', color: theme.primary,
                          borderColor: theme.primary + '30',
                        }]}
                        placeholder="—"
                        placeholderTextColor={theme.primary + '60'}
                        value={book.obtainedMarks}
                        onChangeText={(val) => {
                          updateTeacherSubjectBook('obtainedMarks', val);
                        }}
                        keyboardType="numeric"
                      />
                    </View>
                  ))}

                  {/* Note: No add/remove functionality for teachers */}
                </View>
              ) : (
                /* ── Admin View: Multi-subject management ── */
                <>
                  {/* Column headers (only if books exist) */}
                  {entryBooks.length > 0 && (
                    <View style={{ flexDirection: 'row', paddingHorizontal: scale(2), marginBottom: scale(4) }}>
                      <Text style={{ flex: 2, fontSize: scale(9), fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, marginRight: scale(6) }}>Subject</Text>
                      <Text style={{ flex: 1, fontSize: scale(9), fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center', marginRight: scale(4) }}>Total</Text>
                      <Text style={{ flex: 1, fontSize: scale(9), fontWeight: '700', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center', marginRight: scale(26) }}>Obtained</Text>
                    </View>
                  )}

                  {/* Existing books list */}
                  {entryBooks.map((book, index) => (
                    <View key={index} style={[styles.addBookRow, { borderColor: theme.border, marginBottom: scale(8) }]}>
                      <View style={{ flex: 2, marginRight: scale(6) }}>
                        <View style={[styles.compactInput, { borderColor: theme.border, backgroundColor: theme.card, justifyContent: 'center' }]}>
                          <Text style={{ color: theme.text, fontSize: scale(12) }} numberOfLines={1}>{book.name}</Text>
                        </View>
                      </View>
                      <View style={{ flex: 1, marginRight: scale(4) }}>
                        <TextInput
                          style={[styles.compactInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                          placeholder="Total"
                          placeholderTextColor={theme.textSecondary}
                          value={book.totalMarks}
                          onChangeText={(val) => {
                            const updated = [...entryBooks];
                            updated[index] = { ...updated[index], totalMarks: val };
                            setEntryBooks(updated);
                          }}
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={{ flex: 1, marginRight: scale(6) }}>
                        <TextInput
                          style={[styles.compactInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                          placeholder="Obt."
                          placeholderTextColor={theme.textSecondary}
                          value={book.obtainedMarks}
                          onChangeText={(val) => {
                            const updated = [...entryBooks];
                            updated[index] = { ...updated[index], obtainedMarks: val };
                            setEntryBooks(updated);
                          }}
                          keyboardType="numeric"
                        />
                      </View>
                      <TouchableOpacity onPress={() => handleRemoveBook(index)} style={{ padding: scale(4) }}>
                        <Ionicons name="close-circle" size={20} color={theme.error} />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Add book row */}
                  <View style={[styles.addBookRow, {
                    borderColor: theme.border,
                    marginTop: entryBooks.length > 0 ? 4 : 0,
                    paddingTop: entryBooks.length > 0 ? 12 : 0,
                    borderTopWidth: entryBooks.length > 0 ? 1 : 0,
                  }]}>
                    <View style={{ flex: 2, marginRight: scale(6) }}>
                      <TouchableOpacity
                        onPress={() => {
                          setShowBookDropdown(!showBookDropdown);
                          setShowTitleDropdown(false);
                          setShowClassDropdown(false);
                          setShowCategoryDropdown(false);
                        }}
                        ref={bookAnchorRef}
                        style={[styles.compactInput, { borderColor: showBookDropdown ? theme.primary : theme.border, backgroundColor: theme.card, justifyContent: 'center' }]}
                      >
                        <Text style={{ color: currentBookName ? theme.text : theme.textSecondary, fontSize: scale(12) }} numberOfLines={1}>
                          {currentBookName || 'Select / Type Book'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1, marginRight: scale(4) }}>
                      <TextInput
                        style={[styles.compactInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                        placeholder="Total"
                        placeholderTextColor={theme.textSecondary}
                        value={currentTotalMarks}
                        onChangeText={setCurrentTotalMarks}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ flex: 1, marginRight: scale(6) }}>
                      <TextInput
                        style={[styles.compactInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
                        placeholder="Obt."
                        placeholderTextColor={theme.textSecondary}
                        value={currentObtainedMarks}
                        onChangeText={setCurrentObtainedMarks}
                        keyboardType="numeric"
                      />
                    </View>
                    <TouchableOpacity onPress={handleAddBook} style={[styles.compactAddBtn, { backgroundColor: theme.primary }]}>
                      <Ionicons name="add" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  {showBookDropdown && (
                    <DropdownMenu
                      options={[
                        { label: 'Manual Entry', value: '__manual__', icon: 'create-outline' },
                        ...books
                          .filter(b => {
                            const title = (b.booktitle || b.subject || '').trim();
                            return !entryBooks.some(added => added.name.trim().toLowerCase() === title.toLowerCase());
                          })
                          .map(b => ({ label: b.booktitle || b.subject || '', value: b.booktitle || b.subject || '', icon: 'book-outline' })),
                      ]}
                      selectedValue={currentBookName}
                      onSelect={(val) => { setCurrentBookName(val === '__manual__' ? '' : val); setShowBookDropdown(false); }}
                      theme={theme}
                      zIndex={1500}
                      anchorRef={bookAnchorRef}
                      onClose={() => setShowBookDropdown(false)}
                    />
                  )}

                  {showBookDropdown && !currentBookName && (
                    <TextInput
                      style={[styles.input, { height: scale(36), fontSize: scale(12), backgroundColor: theme.card, color: theme.text, borderColor: theme.border, marginBottom: scale(8) }]}
                      placeholder="Type custom book name..."
                      placeholderTextColor={theme.textSecondary}
                      value={currentBookName}
                      onChangeText={setCurrentBookName}
                    />
                  )}
                </>
              )}
            </View>

            {/* Note */}
            <Text style={[styles.label, { color: theme.text, marginTop: scale(2) }]}>Note (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border, height: scale(50), textAlignVertical: 'top' }]}
              placeholder="Additional details..."
              placeholderTextColor={theme.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
            />

            {/* Save Button */}
            <TouchableOpacity onPress={handleSaveExam} style={[styles.fsFormSaveButton, { backgroundColor: theme.primary }]}>
              <Ionicons name={editingExam ? 'checkmark-circle' : 'save-outline'} size={18} color="#fff" />
              <Text style={styles.fsFormSaveButtonText}>{editingExam ? 'Update Record' : 'Save Record'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }} style={styles.fsFormCancelButton}>
              <Text style={[styles.fsFormCancelText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          CHOICE MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal visible={choiceModalVisible} animationType="fade" transparent>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setChoiceModalVisible(false)}
        >
          <View
            onStartShouldSetResponder={() => true}
            style={{ width: scale(280), borderRadius: scale(14), backgroundColor: theme.card, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: scale(4) }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 }}
          >
            <View style={{ paddingTop: scale(20), paddingBottom: scale(16), paddingHorizontal: scale(20), alignItems: 'center' }}>
              <Text style={{ fontSize: scale(17), fontWeight: '600', color: theme.text, textAlign: 'center', marginBottom: scale(4) }}>Add New Record</Text>
              <Text style={{ fontSize: scale(13), color: theme.textSecondary, textAlign: 'center' }}>Choose how to add the record</Text>
            </View>
            <View style={{ height: scale(0.5), backgroundColor: theme.border }} />
            <TouchableOpacity onPress={handleManualEntry} style={{ paddingVertical: scale(14), alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: scale(17), fontWeight: '600', color: theme.primary }}>Manual Entry</Text>
            </TouchableOpacity>
            <View style={{ height: scale(0.5), backgroundColor: theme.border }} />
            <TouchableOpacity
              onPress={() => { setChoiceModalVisible(false); setShowUploadInstructions(true); }}
              style={{ paddingVertical: scale(14), alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: scale(17), color: theme.primary }}>Upload File</Text>
            </TouchableOpacity>
            <View style={{ height: scale(0.5), backgroundColor: theme.border }} />
            <TouchableOpacity onPress={() => setChoiceModalVisible(false)} style={{ paddingVertical: scale(14), alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: scale(17), fontWeight: '600', color: theme.error }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          UPLOAD INSTRUCTIONS MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal visible={showUploadInstructions} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalHeaderIcon, { backgroundColor: theme.primary + '15' }]}>
                <Ionicons name="document-text" size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Upload Instructions</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Required .xlsx Format</Text>
              </View>
              <TouchableOpacity onPress={() => setShowUploadInstructions(false)} style={{ marginLeft: 'auto', padding: scale(4) }}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ marginTop: scale(16) }}>
              <Text style={{ color: theme.text, fontSize: scale(13), lineHeight: 20, marginBottom: scale(12) }}>
                Please upload an <Text style={{ fontWeight: 'bold' }}>Excel (.xlsx)</Text> file containing exam records.
              </Text>
              <TouchableOpacity
                onPress={handleDownloadTemplate}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary + '15', padding: scale(12), borderRadius: scale(8), marginBottom: scale(16), borderWidth: 1, borderColor: theme.primary + '30' }}
              >
                <View style={{ width: scale(32), height: scale(32), borderRadius: scale(16), backgroundColor: '#1D6F42', alignItems: 'center', justifyContent: 'center', marginRight: scale(10) }}>
                  <Ionicons name="download" size={16} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', fontSize: scale(13), color: theme.text }}>Download Excel Template</Text>
                  <Text style={{ fontSize: scale(11), color: theme.textSecondary }}>Use this file to add your records</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
              </TouchableOpacity>
              <View style={{ marginBottom: scale(16) }}>
                <Text style={{ fontSize: scale(13), fontWeight: '700', color: theme.text, marginBottom: scale(8) }}>Required Columns:</Text>
                <View style={{ backgroundColor: theme.background, padding: scale(8), borderRadius: scale(6), borderWidth: 1, borderColor: theme.border }}>
                  <Text style={{ fontFamily: 'monospace', fontSize: scale(11), color: theme.text }}>
                    title | category | date | rollNo | studentName | bookName | totalMarks | obtainedMarks | description
                  </Text>
                </View>
              </View>
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setShowUploadInstructions(false)} style={[styles.modalBtnCancel, { borderColor: theme.border }]}>
                <Text style={[styles.modalBtnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setShowUploadInstructions(false); setTimeout(() => handlePickDocument(), 500); }}
                style={[styles.modalBtnSave, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="folder-open" size={18} color="#fff" style={{ marginRight: scale(6) }} />
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Select File</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          RESULT DETAIL / OPTIONS MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal visible={showOptionsModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={[{ borderTopLeftRadius: scale(20), borderTopRightRadius: scale(20), padding: scale(18), elevation: 5, height: '85%' }, { backgroundColor: theme.card }]}>

            <TouchableOpacity
              onPress={() => setShowOptionsModal(false)}
              style={{ position: 'absolute', top: scale(14), right: scale(14), zIndex: 10, width: scale(32), height: scale(32), borderRadius: scale(16), backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="close" size={18} color={theme.textSecondary} />
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scale(12), paddingRight: scale(40) }}>
              <View style={{ width: scale(48), height: scale(48), borderRadius: scale(24), backgroundColor: theme.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: scale(12) }}>
                <Ionicons name="person" size={22} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: scale(18), fontWeight: '700', color: theme.text }}>{selectedExamForOptions?.studentName || 'Student'}</Text>
                <Text style={{ fontSize: scale(13), color: theme.textSecondary, marginTop: scale(2) }}>
                  {selectedExamForOptions?.rollNo || 'N/A'} • {selectedExamForOptions?.studentClass || 'N/A'}
                </Text>
              </View>
            </View>

            {/* T-Navigation Buttons */}
            {(() => {
              if (!selectedExamForOptions) return null;
              const studentKey = (selectedExamForOptions.rollNo || selectedExamForOptions.studentName || '');
              const studentClass = selectedExamForOptions.studentClass || '';
              const studentExams = exams.filter(e => {
                const k = (e.rollNo || e.studentName || '');
                return k === studentKey && (e.studentClass || '') === studentClass;
              });
              const existingTitles = new Set(studentExams.map(e => e.title));
              const existingTNumbers = studentExams
                .map(e => { const match = e.title.match(/^T(\d+)$/); return match ? parseInt(match[1], 10) : 0; })
                .filter(n => n > 0);
              const maxExisting = existingTNumbers.length > 0 ? Math.max(...existingTNumbers) : 0;
              const showUpTo = Math.max(maxExisting + 1, 3);
              const visibleTitles = TITLE_OPTIONS.slice(0, Math.min(showUpTo, TITLE_OPTIONS.length));

              return (
                <View style={{ marginBottom: scale(10) }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: scale(5) }}>
                      {visibleTitles.map((t) => {
                        const hasRecord = existingTitles.has(t);
                        const isActive = selectedExamForOptions?.title === t;
                        return (
                          <TouchableOpacity
                            key={t}
                            onPress={() => {
                              if (isActive) return;
                              if (hasRecord) {
                                const targetExam = studentExams.find(e => e.title === t);
                                if (targetExam) setSelectedExamForOptions(targetExam);
                              } else {
                                setShowOptionsModal(false);
                                resetForm();
                                setStudentName(selectedExamForOptions.studentName || '');
                                setRollNo(selectedExamForOptions.rollNo || '');
                                setStudentClass(selectedExamForOptions.studentClass || '');
                                setStudentEmail(selectedExamForOptions.studentEmail || '');
                                setStudentSearchTerm(selectedExamForOptions.studentName || '');
                                setTitle(t);
                                setStudentInfoLocked(true);
                                setModalVisible(true);
                              }
                            }}
                            style={{
                              paddingHorizontal: scale(12), paddingVertical: scale(6), borderRadius: scale(6),
                              backgroundColor: isActive ? theme.primary : hasRecord ? theme.primary + '12' : theme.background,
                              borderWidth: 1,
                              borderColor: isActive ? theme.primary : hasRecord ? theme.primary + '30' : theme.border,
                              minWidth: scale(40), alignItems: 'center',
                            }}
                          >
                            <Text style={{ fontSize: scale(12), fontWeight: '700', color: isActive ? '#fff' : hasRecord ? theme.primary : theme.textSecondary }}>{t}</Text>
                            {!hasRecord && <Ionicons name="add" size={9} color={theme.textSecondary} style={{ marginTop: scale(1) }} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              );
            })()}

            {/* Test & Date Badge */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scale(12), gap: scale(8) }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary + '12', paddingHorizontal: scale(10), paddingVertical: scale(5), borderRadius: scale(6) }}>
                <Ionicons name="document-text-outline" size={13} color={theme.primary} style={{ marginRight: scale(4) }} />
                <Text style={{ fontSize: scale(12), fontWeight: '600', color: theme.primary }}>{selectedExamForOptions?.title}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, paddingHorizontal: scale(10), paddingVertical: scale(5), borderRadius: scale(6), borderWidth: 1, borderColor: theme.border }}>
                <Ionicons name="folder-outline" size={13} color={theme.textSecondary} style={{ marginRight: scale(4) }} />
                <Text style={{ fontSize: scale(12), color: theme.textSecondary }}>{selectedExamForOptions?.category}</Text>
              </View>
              {selectedExamForOptions?.date && (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, paddingHorizontal: scale(10), paddingVertical: scale(5), borderRadius: scale(6), borderWidth: 1, borderColor: theme.border }}>
                  <Ionicons name="calendar-outline" size={13} color={theme.textSecondary} style={{ marginRight: scale(4) }} />
                  <Text style={{ fontSize: scale(12), color: theme.textSecondary }}>{selectedExamForOptions?.date}</Text>
                </View>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {/* Compact Stats Row */}
              {(() => {
                const sel = selectedExamForOptions;
                let displayTotal = sel?.totalMarks || '—';
                let displayObtained = sel?.obtainedMarks || '—';
                if (sel?.books && sel.books.length > 0) {
                  let sumTotal = 0; let sumObtained = 0;
                  sel.books.forEach(b => {
                    const t = parseFloat(b.totalMarks); const o = parseFloat(b.obtainedMarks);
                    if (!isNaN(t)) sumTotal += t;
                    if (!isNaN(o)) sumObtained += o;
                  });
                  displayTotal = sumTotal.toString();
                  displayObtained = sumObtained.toString();
                }
                const percentage = displayTotal !== '—' && displayObtained !== '—' && parseFloat(displayTotal) > 0
                  ? ((parseFloat(displayObtained) / parseFloat(displayTotal)) * 100).toFixed(1) + '%' : null;

                return (
                  <View style={{ flexDirection: 'row', gap: scale(6), marginBottom: scale(12) }}>
                    <View style={{ flex: 1, borderRadius: scale(8), paddingVertical: scale(7), paddingHorizontal: scale(6), alignItems: 'center', borderWidth: 1, backgroundColor: sel?.status === 'Pass' ? '#E8F5E910' : sel?.status === 'Fail' ? '#FFEBEE10' : '#FFF3E010', borderColor: sel?.status === 'Pass' ? '#2E7D3225' : sel?.status === 'Fail' ? '#C6282825' : '#EF6C0025' }}>
                      <Text style={{ fontSize: scale(9), color: theme.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: scale(2) }}>Status</Text>
                      <Text style={{ fontSize: scale(12), fontWeight: '800', color: sel?.status === 'Pass' ? '#2E7D32' : sel?.status === 'Fail' ? '#C62828' : '#EF6C00' }}>{sel?.status || 'Active'}</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: theme.background, borderRadius: scale(8), paddingVertical: scale(7), paddingHorizontal: scale(6), alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
                      <Text style={{ fontSize: scale(9), color: theme.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: scale(2) }}>Total</Text>
                      <Text style={{ fontSize: scale(15), fontWeight: '800', color: theme.text }}>{displayTotal}</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: theme.primary + '08', borderRadius: scale(8), paddingVertical: scale(7), paddingHorizontal: scale(6), alignItems: 'center', borderWidth: 1, borderColor: theme.primary + '20' }}>
                      <Text style={{ fontSize: scale(9), color: theme.primary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: scale(2) }}>Obtained</Text>
                      <Text style={{ fontSize: scale(15), fontWeight: '800', color: theme.primary }}>{displayObtained}</Text>
                      {percentage && <Text style={{ fontSize: scale(9), color: theme.primary, marginTop: scale(1) }}>({percentage})</Text>}
                    </View>
                    <View style={{ flex: 1, backgroundColor: theme.background, borderRadius: scale(8), paddingVertical: scale(7), paddingHorizontal: scale(6), alignItems: 'center', borderWidth: 1, borderColor: theme.border }}>
                      <Text style={{ fontSize: scale(9), color: theme.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: scale(2) }}>Pos.</Text>
                      <Text style={{ fontSize: scale(12), fontWeight: '800', color: theme.text }}>
                        {(() => {
                          if (!sel) return '—';
                          const sameGroup = exams.filter(e => e.title === sel.title && e.studentClass === sel.studentClass);
                          const sorted = [...sameGroup].sort((a, b) => (parseFloat(b.obtainedMarks || '0')) - (parseFloat(a.obtainedMarks || '0')));
                          const pos = sorted.findIndex(e => e.id === sel.id) + 1;
                          return pos > 0 ? `${pos}/${sorted.length}` : '—';
                        })()}
                      </Text>
                    </View>
                  </View>
                );
              })()}

              {/* Subject Breakdown */}
              {selectedExamForOptions?.books && selectedExamForOptions.books.length > 0 && (
                <View style={{ marginBottom: scale(16), backgroundColor: theme.background, borderRadius: scale(12), borderWidth: 1, borderColor: theme.border, overflow: 'hidden' }}>
                  <View style={{ flexDirection: 'row', paddingVertical: scale(10), paddingHorizontal: scale(14), backgroundColor: theme.primary + '08', borderBottomWidth: 1, borderBottomColor: theme.border }}>
                    <Text style={{ flex: 1, fontSize: scale(11), fontWeight: '700', color: theme.primary, textTransform: 'uppercase', letterSpacing: 0.3 }}>Subject</Text>
                    <Text style={{ width: scale(60), fontSize: scale(11), fontWeight: '700', color: theme.primary, textTransform: 'uppercase', letterSpacing: 0.3, textAlign: 'center' }}>Total</Text>
                    <Text style={{ width: scale(60), fontSize: scale(11), fontWeight: '700', color: theme.primary, textTransform: 'uppercase', letterSpacing: 0.3, textAlign: 'center' }}>Obt.</Text>
                  </View>
                  {selectedExamForOptions.books.map((book, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', paddingVertical: scale(10), paddingHorizontal: scale(14), alignItems: 'center', backgroundColor: idx % 2 === 0 ? 'transparent' : theme.card + '60', borderBottomWidth: idx < selectedExamForOptions.books!.length - 1 ? 0.5 : 0, borderBottomColor: theme.border }}>
                      <Text style={{ flex: 1, fontSize: scale(13), color: theme.text, fontWeight: '500' }}>{book.name}</Text>
                      <Text style={{ width: scale(60), fontSize: scale(13), color: theme.textSecondary, textAlign: 'center' }}>{book.totalMarks}</Text>
                      <Text style={{ width: scale(60), fontSize: scale(13), fontWeight: '600', color: theme.text, textAlign: 'center' }}>{book.obtainedMarks}</Text>
                    </View>
                  ))}
                  <View style={{ flexDirection: 'row', paddingVertical: scale(10), paddingHorizontal: scale(14), backgroundColor: theme.primary + '10', borderTopWidth: 1, borderTopColor: theme.border }}>
                    <Text style={{ flex: 1, fontSize: scale(12), fontWeight: '800', color: theme.primary, textTransform: 'uppercase' }}>Grand Total</Text>
                    <Text style={{ width: scale(60), fontSize: scale(13), fontWeight: '800', color: theme.text, textAlign: 'center' }}>
                      {selectedExamForOptions.books.reduce((s, b) => s + (parseFloat(b.totalMarks) || 0), 0)}
                    </Text>
                    <Text style={{ width: scale(60), fontSize: scale(13), fontWeight: '800', color: theme.primary, textAlign: 'center' }}>
                      {selectedExamForOptions.books.reduce((s, b) => s + (parseFloat(b.obtainedMarks) || 0), 0)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Description */}
              {selectedExamForOptions?.description && (
                <View style={{ marginBottom: scale(16), flexDirection: 'row', backgroundColor: theme.background, borderRadius: scale(10), padding: scale(12), borderLeftWidth: 3, borderLeftColor: theme.primary }}>
                  <Ionicons name="chatbubble-outline" size={14} color={theme.textSecondary} style={{ marginRight: scale(8), marginTop: scale(1) }} />
                  <Text style={{ fontSize: scale(13), color: theme.textSecondary, fontStyle: 'italic', flex: 1 }}>"{selectedExamForOptions.description}"</Text>
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: scale(10), paddingTop: scale(12), borderTopWidth: 1, borderTopColor: theme.border }}>
              <TouchableOpacity
                onPress={() => { setShowOptionsModal(false); if (selectedExamForOptions) openModal(selectedExamForOptions); }}
                style={{ flex: 1, paddingVertical: scale(13), backgroundColor: theme.primary, borderRadius: scale(10), flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="create-outline" size={16} color="#fff" style={{ marginRight: scale(6) }} />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: scale(14) }}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setShowOptionsModal(false); if (selectedExamForOptions) handleDeleteExam(selectedExamForOptions.id); }}
                style={{ flex: 1, paddingVertical: scale(13), backgroundColor: theme.error + '12', borderRadius: scale(10), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.error + '25' }}
              >
                <Ionicons name="trash-outline" size={16} color={theme.error} style={{ marginRight: scale(6) }} />
                <Text style={{ color: theme.error, fontWeight: '700', fontSize: scale(14) }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>



    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ─── Main Container & Header ───────────────────────────────────────────────
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(12), paddingVertical: scale(8), borderBottomWidth: 1, gap: scale(8) },
  headerTitleBlock: { flex: 1 },
  headerTitle: { fontSize: scale(17), fontWeight: '800', letterSpacing: 0.1 },
  headerSubtitle: { fontSize: scale(10), fontWeight: '500', marginTop: 0 },
  headerIconButton: { width: scale(34), height: scale(34), borderRadius: scale(8), borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerPrimaryButton: { height: scale(34), borderRadius: scale(8), paddingHorizontal: scale(10), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scale(4) },
  headerPrimaryButtonText: { color: '#fff', fontSize: scale(12), fontWeight: '800' },
  backButton: { padding: scale(4) },
  addButton: { padding: scale(4) },
  summaryGrid: { flexDirection: 'row', gap: scale(6), paddingHorizontal: scale(10), paddingTop: scale(8), paddingBottom: scale(6) },
  summaryTile: { flex: 1, borderWidth: 1, borderRadius: scale(7), paddingHorizontal: scale(8), paddingVertical: scale(7), minHeight: scale(46), flexDirection: 'row', alignItems: 'center', gap: scale(7) },
  summaryIcon: { width: scale(24), height: scale(24), borderRadius: scale(6), alignItems: 'center', justifyContent: 'center' },
  summaryTextBlock: { flex: 1, minWidth: 0 },
  summaryValue: { fontSize: scale(15), fontWeight: '800', letterSpacing: 0.1, lineHeight: 17 },
  summaryLabel: { fontSize: scale(8), fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.35, marginTop: scale(1) },
  controlPanel: { flexDirection: 'row', marginHorizontal: scale(10), marginBottom: scale(6), padding: scale(6), borderRadius: scale(8), borderWidth: 1, gap: scale(6), alignItems: 'center', zIndex: 100 },
  searchBox: { flex: 1, height: scale(34), borderRadius: scale(7), borderWidth: 1, paddingHorizontal: scale(9), flexDirection: 'row', alignItems: 'center' },
  searchInput: { flex: 1, marginLeft: scale(7), fontSize: scale(12), paddingVertical: 0 },
  clearFiltersButton: { width: scale(34), height: scale(34), borderRadius: scale(7), alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  filterRow: { flexDirection: 'row', paddingHorizontal: scale(10), paddingBottom: scale(7), gap: scale(6), zIndex: 1000, alignItems: 'center' },
  activeFilterText: { paddingHorizontal: scale(12), marginTop: scale(-4), marginBottom: scale(6), fontSize: scale(9), fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.35 },
  
  // ─── Table View ───────────────────────────────────────────────────────────
  tableContent: { paddingBottom: scale(6) },
  noDataText: { textAlign: 'center', marginTop: scale(16), fontSize: scale(14), fontWeight: '500' },
  listTitleBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: scale(12), paddingTop: scale(1), paddingBottom: scale(6), borderBottomWidth: 1 },
  listTitle: { fontSize: scale(13), fontWeight: '800', letterSpacing: 0.1 },
  listSubtitle: { fontSize: scale(9), fontWeight: '500', marginTop: 0 },
  listCount: { overflow: 'hidden', paddingHorizontal: scale(8), paddingVertical: scale(3), borderRadius: scale(7), fontSize: scale(10), fontWeight: '800' },
  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(12), paddingVertical: scale(5), borderBottomWidth: 1 },
  tableHeaderCell: { fontSize: scale(8), fontWeight: '800', letterSpacing: 0.35, textTransform: 'uppercase' },
  
  // ─── Modals ───────────────────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: scale(14), borderTopRightRadius: scale(14), padding: scale(12), elevation: 5, height: '95%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', paddingBottom: scale(8), borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  modalHeaderIcon: { width: scale(32), height: scale(32), borderRadius: scale(8), alignItems: 'center', justifyContent: 'center', marginRight: scale(8) },
  modalTitle: { fontSize: scale(15), fontWeight: '800', letterSpacing: 0.1 },
  modalSubtitle: { fontSize: scale(10), marginTop: scale(1), fontWeight: '500' },
  modalButtons: { flexDirection: 'row', gap: scale(8), marginTop: scale(12), paddingTop: scale(10), borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  modalBtnCancel: { flex: 1, paddingVertical: scale(10), borderRadius: scale(8), borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  modalBtnSave: { flex: 1.5, paddingVertical: scale(10), borderRadius: scale(8), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: scale(2) }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  modalBtnText: { fontSize: scale(13), fontWeight: '700', letterSpacing: 0.1 },
  
  // ─── Form Components ───────────────────────────────────────────────────────
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: scale(7), gap: scale(5) },
  sectionTitle: { fontSize: scale(10), fontWeight: '800', letterSpacing: 0.45, textTransform: 'uppercase' },
  sectionCard: { borderWidth: 1, borderRadius: scale(8), padding: scale(10), marginBottom: scale(8), shadowColor: '#000', shadowOffset: { width: 0, height: scale(1) }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  row: { flexDirection: 'row', gap: scale(6), width: '100%' },
  col: {},
  label: { fontSize: scale(9), fontWeight: '800', marginBottom: scale(4), letterSpacing: 0.35, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderRadius: scale(7), paddingHorizontal: scale(9), marginBottom: scale(6), fontSize: scale(12), height: scale(38) },
  selectInput: { borderWidth: 1, borderRadius: scale(7), paddingHorizontal: scale(9), paddingVertical: scale(5), marginBottom: scale(6), flexDirection: 'row', alignItems: 'center', height: scale(38) },
  inlineDropdown: { borderWidth: 1, borderRadius: scale(7), marginBottom: scale(6), overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: scale(2) }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  dropdownItem: { padding: scale(9), borderBottomWidth: 0.5 },
  
  // ─── Book Management ──────────────────────────────────────────────────────
  addBookRow: { flexDirection: 'row', alignItems: 'center', padding: scale(8), borderRadius: scale(8), borderWidth: 1, marginBottom: scale(8) },
  compactInput: { borderWidth: 1, borderRadius: scale(8), paddingHorizontal: scale(12), height: scale(40), fontSize: scale(13) },
  compactAddBtn: { width: scale(36), height: scale(36), borderRadius: scale(8), alignItems: 'center', justifyContent: 'center' },
  teacherMarksPanel: { gap: scale(7) },
  teacherSubjectPill: { minHeight: scale(38), borderRadius: scale(7), borderWidth: 1, paddingHorizontal: scale(8), paddingVertical: scale(6), flexDirection: 'row', alignItems: 'center', gap: scale(8) },
  teacherSubjectIcon: { width: scale(26), height: scale(26), borderRadius: scale(7), alignItems: 'center', justifyContent: 'center' },
  teacherSubjectLabel: { fontSize: scale(8), fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.35 },
  teacherSubjectName: { fontSize: scale(13), fontWeight: '800', marginTop: scale(1) },
  teacherMarksRow: { flexDirection: 'row', gap: scale(8) },
  teacherMarkInput: { height: scale(36), borderWidth: 1, borderRadius: scale(7), paddingHorizontal: scale(8), fontSize: scale(13), fontWeight: '800', textAlign: 'center' },
  
  // ─── Dropdowns & Lists ────────────────────────────────────────────────────
  studentDropdownRow: { flexDirection: 'row', alignItems: 'center', gap: scale(6) },
  studentDropdownAvatar: { width: scale(26), height: scale(26), borderRadius: scale(13), alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  
  // ─── Full Screen Form ─────────────────────────────────────────────────────
  fullScreenModal: { flex: 1 },
  fsFormHeader: { paddingTop: Platform.OS === 'ios' ? 48 : (StatusBar.currentHeight || 30) + 6, paddingBottom: scale(12), paddingHorizontal: scale(12), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fsFormHeaderBtn: { width: scale(32), height: scale(32), borderRadius: scale(16), backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  fsFormHeaderCenter: { flex: 1, alignItems: 'center' },
  fsFormHeaderTitle: { fontSize: scale(16), fontWeight: '800', color: '#fff', letterSpacing: 0.1 },
  fsFormHeaderSubtitle: { fontSize: scale(9), color: 'rgba(255,255,255,0.7)', marginTop: scale(1), fontWeight: '500' },
  fsFormHeaderSaveBtn: { width: scale(32), height: scale(32), borderRadius: scale(16), backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: scale(2) }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  fsFormScrollContent: { padding: scale(10), paddingBottom: scale(24) },
  fsFormSaveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: scale(11), borderRadius: scale(7), marginTop: scale(12), shadowColor: '#667eea', shadowOffset: { width: 0, height: scale(3) }, shadowOpacity: 0.22, shadowRadius: 7, elevation: 4, gap: scale(6) },
  fsFormSaveButtonText: { fontSize: scale(13), fontWeight: '800', color: '#fff', letterSpacing: 0.1 },
  fsFormCancelButton: { alignItems: 'center', paddingVertical: scale(9), marginTop: scale(1) },
  fsFormCancelText: { fontSize: scale(12), fontWeight: '700' },
});

