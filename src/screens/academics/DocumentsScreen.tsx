import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, Modal, Dimensions, Linking, KeyboardAvoidingView, Platform, Animated, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { scale } from '../../utils/responsive';
import { markAsRead } from '../../store/slices/notificationsSlice';
import type { Notice } from '../../store/slices/notificationsSlice';
import { LinearGradient } from 'expo-linear-gradient';

const { height } = Dimensions.get('window');

/* ─── Rich-text renderer (markdown subset) ─── */
const renderRichText = (text: string, theme: any, isDark: boolean) => {
  if (!text) return null;
  const decoded = text
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'");
  return decoded.split('\n').map((line, li) => {
    const t = line.trim();
    if (!t) return <View key={li} style={{ height: scale(6) }} />;
    const isH1     = t.startsWith('# ');
    const isH2     = t.startsWith('## ');
    const isBullet = t.startsWith('- ') || t.startsWith('* ');
    const body = isH1 ? t.slice(2) : isH2 ? t.slice(3) : isBullet ? t.slice(2) : t;
    let base: any = { fontSize: scale(13), color: theme.text, lineHeight: scale(20) };
    if (isH1) base = { fontSize: scale(16), fontWeight: '700', color: theme.text, marginTop: scale(10), marginBottom: scale(3) };
    if (isH2) base = { fontSize: scale(14), fontWeight: '600', color: theme.text, marginTop: scale(8), marginBottom: scale(2) };
    // tokenise bold + links
    const tokens: any[] = [];
    let rem = body;
    while (rem.length > 0) {
      const lm = rem.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/);
      const um = rem.match(/(https?:\/\/[^\s]+)/);
      const bm = rem.match(/\*\*([^*]+)\*\*/);
      let best: any = null, bi = rem.length, bt = '';
      const chk = (m: any, type: string) => { if (m && m.index < bi) { bi = m.index; best = m; bt = type; } };
      chk(lm, 'link'); chk(um, 'url'); chk(bm, 'bold');
      if (best) {
        if (bi > 0) tokens.push({ t: 'txt', s: rem.slice(0, bi) });
        if (bt === 'link') tokens.push({ t: 'link', s: best[1], url: best[2] });
        else if (bt === 'url') tokens.push({ t: 'link', s: best[0], url: best[0] });
        else tokens.push({ t: 'bold', s: best[1] });
        rem = rem.slice(bi + best[0].length);
      } else { tokens.push({ t: 'txt', s: rem }); rem = ''; }
    }
    const content = tokens.map((tk, i) => {
      if (tk.t === 'link') return <Text key={i} style={{ color: isDark ? '#60a5fa' : '#2563eb', textDecorationLine: 'underline' }} onPress={() => Linking.openURL(tk.url)}>{tk.s}</Text>;
      if (tk.t === 'bold') return <Text key={i} style={{ fontWeight: '700' }}>{tk.s}</Text>;
      return <Text key={i}>{tk.s}</Text>;
    });
    if (isBullet) return (
      <View key={li} style={{ flexDirection: 'row', paddingLeft: scale(8), marginBottom: scale(3) }}>
        <Text style={[base, { marginRight: scale(6) }]}>•</Text>
        <Text style={[base, { flex: 1 }]}>{content}</Text>
      </View>
    );
    return <Text key={li} style={base}>{content}</Text>;
  });
};

/* ─── Colour helpers ─── */
const subjectColor = (s: string) => {
  const l = (s || '').toLowerCase();
  if (l.includes('math'))     return '#3b82f6';
  if (l.includes('physic'))   return '#8b5cf6';
  if (l.includes('english'))  return '#10b981';
  if (l.includes('chemist'))  return '#f59e0b';
  if (l.includes('biolog'))   return '#ef4444';
  if (l.includes('computer')) return '#06b6d4';
  return '#64748b';
};

const classColor = (c: string) => {
  const l = (c || '').toLowerCase();
  if (l.includes('8th'))  return '#06b6d4';
  if (l.includes('9th'))  return '#3b82f6';
  if (l.includes('10'))   return '#10b981';
  if (l.includes('1st'))  return '#f59e0b';
  if (l.includes('2nd'))  return '#ef4444';
  return '#8b5cf6';
};

const typeOf = (notice: any) => {
  const title = (notice.title || '').toLowerCase();
  const body  = (notice.message || notice.content || '').toLowerCase();
  if (title.includes('pdf')   || body.includes('.pdf'))   return { label: 'PDF',  color: '#ef4444', icon: 'document'      };
  if (title.includes('ppt')   || body.includes('.ppt'))   return { label: 'PPT',  color: '#f59e0b', icon: 'easel'         };
  if (title.includes('video') || body.includes('video'))  return { label: 'VIDEO',color: '#8b5cf6', icon: 'play-circle'   };
  if (title.includes('book')  || body.includes('book'))   return { label: 'BOOK', color: '#10b981', icon: 'book'          };
  return                                                           { label: 'NOTE', color: '#3b82f6', icon: 'document-text' };
};

/* ═══════════════════════════════════════════════════ */
export const DocumentsScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const dispatch   = useAppDispatch();
  const insets     = useSafeAreaInsets();

  const notices   = useAppSelector(s => s.notifications.notices) as Notice[];
  const readIds   = useAppSelector(s => s.notifications.readIds) as string[];
  const classes   = useAppSelector((s: any) => s.appSettings?.classes  as string[]) || [];
  const subjects  = useAppSelector((s: any) => s.appSettings?.books    as string[]) || [];

  const categoryFilter = route.params?.category;
  const filteredByCategoryNotices = categoryFilter 
    ? notices.filter((n: any) => n.category === categoryFilter)
    : notices;

  const unread    = filteredByCategoryNotices.filter(n => !readIds.includes(n.id)).length;

  const [search,     setSearch]     = useState('');
  const [selClass,   setSelClass]   = useState('All Classes');
  const [selSubject, setSelSubject] = useState('All Subjects');

  const [picker, setPicker]         = useState<{ open: boolean; kind: 'Class' | 'Subject' }>({ open: false, kind: 'Class' });
  const [detail, setDetail]         = useState<{ open: boolean; item: any }>({ open: false, item: null });

  /* Sorted classes */
  const ORDER = ['8th', '9th', '10th', '1st Year', '2nd Year'];
  const sortedClasses = [...classes].sort((a, b) => {
    const rank = (s: string) => { const i = ORDER.findIndex(o => s.toLowerCase().includes(o.toLowerCase())); return i === -1 ? 99 : i; };
    return rank(a) - rank(b);
  });

  /* Stats */
  const totalItems   = filteredByCategoryNotices.length;
  const subjCount    = new Set(filteredByCategoryNotices.map((n: any) => n.subject).filter(Boolean)).size;
  const classCount   = new Set(filteredByCategoryNotices.map((n: any) => n.targetClass).filter(Boolean)).size;

  /* Filtered */
  const filtered = filteredByCategoryNotices.filter((n: any) => {
    const cls  = n.targetClass || '';
    const subj = n.subject     || '';
    if (search) {
      const q = search.toLowerCase();
      if (!(n.title || '').toLowerCase().includes(q) &&
          !cls.toLowerCase().includes(q) &&
          !subj.toLowerCase().includes(q)) return false;
    }
    if (selClass   !== 'All Classes'  && cls  !== selClass)   return false;
    if (selSubject !== 'All Subjects' && subj !== selSubject)  return false;
    return true;
  });

  const openPicker = (kind: 'Class' | 'Subject') => setPicker({ open: true, kind });
  const pickItem   = (val: string) => {
    if (picker.kind === 'Class') setSelClass(val);
    else setSelSubject(val);
    setPicker(p => ({ ...p, open: false }));
  };
  const openDetail = (item: any) => {
    setDetail({ open: true, item });
    if (!readIds.includes(item.id)) dispatch(markAsRead(item.id));
  };

  const hasFilters = selClass !== 'All Classes' || selSubject !== 'All Subjects' || search.length > 0;

  /* ─── Material card ─── */
  const renderCard = ({ item }: { item: Notice }) => {
    const info   = typeOf(item);
    // Clean up raw placeholder values from Firestore
    const rawCls  = (item as any).targetClass || '';
    const rawSubj = (item as any).subject     || '';
    const cls  = (!rawCls  || rawCls  === 'All' || rawCls  === 'Select Class')   ? 'All Classes' : rawCls;
    const subj = (!rawSubj || rawSubj === 'Select Subject' || rawSubj === 'None') ? 'General'     : rawSubj;
    const isNew  = !readIds.includes(item.id);

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => openDetail(item)}
        style={[styles.card, {
          backgroundColor: theme.card,
          borderColor: theme.border,
          borderLeftColor: info.color,
        }]}
      >
        {/* Left accent icon */}
        <View style={[styles.cardIconWrap, { backgroundColor: isDark ? info.color + '22' : info.color + '14' }]}>
          <Ionicons name={info.icon as any} size={scale(20)} color={info.color} />
          <View style={[styles.typePill, { backgroundColor: info.color }]}>
            <Text style={styles.typePillTxt}>{info.label}</Text>
          </View>
        </View>

        {/* Body */}
        <View style={styles.cardBody}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Text style={[styles.cardTitle, { color: theme.text, flex: 1 }]} numberOfLines={2}>
              {item.title}
            </Text>
            {isNew && (
              <View style={[styles.newBadge, { backgroundColor: '#10b981' }]}>
                <Text style={styles.newBadgeTxt}>NEW</Text>
              </View>
            )}
          </View>

          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: isDark ? classColor(cls) + '25' : classColor(cls) + '15' }]}>
              <Ionicons name="school-outline" size={scale(9)} color={classColor(cls)} style={{ marginRight: scale(3) }} />
              <Text style={[styles.badgeTxt, { color: classColor(cls) }]}>{cls}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: isDark ? subjectColor(subj) + '25' : subjectColor(subj) + '15' }]}>
              <Ionicons name="book-outline" size={scale(9)} color={subjectColor(subj)} style={{ marginRight: scale(3) }} />
              <Text style={[styles.badgeTxt, { color: subjectColor(subj) }]}>{subj}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={scale(11)} color={theme.placeholder} />
            <Text style={[styles.metaTxt, { color: theme.placeholder }]}>
              {(item as any).timeAgo || 'Recently uploaded'}
            </Text>
            <Ionicons name="person-outline" size={scale(11)} color={theme.placeholder} style={{ marginLeft: scale(10) }} />
            <Text style={[styles.metaTxt, { color: theme.placeholder, flex: 1 }]} numberOfLines={1}>
              {(item as any).teacherName || 'Admin'}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={scale(15)} color={theme.placeholder} style={{ alignSelf: 'center', marginLeft: scale(4) }} />
      </TouchableOpacity>
    );
  };

  /* ─── FlatList header ─── */
  const ListHeader = (
    <View>
      {/* Stats row */}
      <View style={styles.statsRow}>
        {([
          { icon: 'documents-outline',  color: theme.primary,  val: totalItems, lbl: 'Materials' },
          { icon: 'book-outline',        color: '#8b5cf6',      val: subjCount,  lbl: 'Subjects'  },
          { icon: 'school-outline',      color: '#10b981',      val: classCount, lbl: 'Classes'   },
        ] as any[]).map(({ icon, color, val, lbl }) => (
          <View key={lbl} style={[styles.statChip, { backgroundColor: isDark ? theme.card : color + '10', borderColor: isDark ? theme.border : color + '25', borderWidth: 1 }]}>
            <View style={[styles.statIconBox, { backgroundColor: isDark ? color + '25' : '#fff', shadowColor: color, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }]}>
              <Ionicons name={icon} size={scale(16)} color={color} />
            </View>
            <Text style={[styles.statVal, { color: isDark ? theme.text : color }]}>{val}</Text>
            <Text style={[styles.statLbl, { color: isDark ? theme.placeholder : color, opacity: isDark ? 1 : 0.8 }]}>{lbl}</Text>
          </View>
        ))}
      </View>

      {/* Search */}
      <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={scale(16)} color={theme.placeholder} style={{ marginRight: scale(8) }} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search by title, class or subject…"
          placeholderTextColor={theme.placeholder}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Ionicons name="close-circle" size={scale(16)} color={theme.placeholder} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter selectors */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, {
            backgroundColor: theme.card,
            borderColor: selClass !== 'All Classes' ? theme.primary : theme.border,
          }]}
          onPress={() => openPicker('Class')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="school-outline"
            size={scale(13)}
            color={selClass !== 'All Classes' ? theme.primary : theme.placeholder}
            style={{ marginRight: scale(5) }}
          />
          <Text
            style={[styles.filterBtnTxt, {
              color: selClass !== 'All Classes' ? theme.primary : theme.text,
              fontWeight: selClass !== 'All Classes' ? '700' : '500',
            }]}
            numberOfLines={1}
          >
            {selClass}
          </Text>
          <Ionicons name="chevron-down" size={scale(12)} color={selClass !== 'All Classes' ? theme.primary : theme.placeholder} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterBtn, {
            backgroundColor: theme.card,
            borderColor: selSubject !== 'All Subjects' ? '#8b5cf6' : theme.border,
          }]}
          onPress={() => openPicker('Subject')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="book-outline"
            size={scale(13)}
            color={selSubject !== 'All Subjects' ? '#8b5cf6' : theme.placeholder}
            style={{ marginRight: scale(5) }}
          />
          <Text
            style={[styles.filterBtnTxt, {
              color: selSubject !== 'All Subjects' ? '#8b5cf6' : theme.text,
              fontWeight: selSubject !== 'All Subjects' ? '700' : '500',
            }]}
            numberOfLines={1}
          >
            {selSubject}
          </Text>
          <Ionicons name="chevron-down" size={scale(12)} color={selSubject !== 'All Subjects' ? '#8b5cf6' : theme.placeholder} />
        </TouchableOpacity>

        {hasFilters && (
          <TouchableOpacity
            style={[styles.clearBtn, { borderColor: theme.border, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}
            onPress={() => { setSearch(''); setSelClass('All Classes'); setSelSubject('All Subjects'); }}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Ionicons name="close" size={scale(14)} color={theme.textSecondary || theme.placeholder} />
          </TouchableOpacity>
        )}
      </View>

      {/* Result count line */}
      <Text style={[styles.resultLine, { color: theme.placeholder }]}>
        Showing {filtered.length} of {totalItems} materials
        {unread > 0 ? `  ·  ${unread} unread` : ''}
      </Text>
    </View>
  );

  /* ═══════════════════════════════════════════════════ */
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { marginTop: -1, paddingTop: (StatusBar.currentHeight || 0) + scale(12) + 1, backgroundColor: theme.primary, borderBottomColor: 'transparent' }]}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
        <TouchableOpacity
        style={{ 
          width: scale(38), 
          height: scale(38), 
          borderRadius: scale(12), 
          backgroundColor: 'rgba(255, 255, 255, 0.15)', 
          justifyContent: 'center', 
          alignItems: 'center', 
          marginRight: scale(12) 
        }} 
        activeOpacity={0.7}
        onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('LibraryScreen' as any)}
      >
        <Ionicons name="arrow-back" size={scale(22)} color={isDark ? theme.text : '#ffffff'} />
      </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: isDark ? theme.text : '#fff' }]} numberOfLines={1} adjustsFontSizeToFit>
            {categoryFilter || 'Documents'}
          </Text>
          <Text style={[styles.headerSub, { color: isDark ? theme.textSecondary : 'rgba(255,255,255,0.8)' }]}>
            {categoryFilter ? `All ${categoryFilter.toLowerCase()} materials` : 'All educational materials & notes'}
          </Text>
        </View>

        {unread > 0 && (
          <View style={[styles.unreadPill, { backgroundColor: isDark ? '#ef444425' : '#fef2f2', borderColor: '#ef444440' }]}>
            <View style={[styles.unreadDot, { backgroundColor: '#ef4444' }]} />
            <Text style={[styles.unreadPillTxt, { color: '#ef4444' }]}>{unread} new</Text>
          </View>
        )}
      </View>

      {/* ── List / Content ── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={undefined}>
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderCard}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + scale(20) }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyIconWrap, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                <Ionicons name="folder-open-outline" size={scale(40)} color={theme.placeholder} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No materials found</Text>
              <Text style={[styles.emptySub, { color: theme.placeholder }]}>
                {hasFilters ? 'Try adjusting your search or filters.' : 'No study materials have been uploaded yet.'}
              </Text>
              {hasFilters && (
                <TouchableOpacity
                  style={[styles.clearFiltersBtn, { borderColor: theme.primary, backgroundColor: isDark ? theme.primary + '20' : theme.primary + '10' }]}
                  onPress={() => { setSearch(''); setSelClass('All Classes'); setSelSubject('All Subjects'); }}
                >
                  <Text style={[styles.clearFiltersBtnTxt, { color: theme.primary }]}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </KeyboardAvoidingView>

      {/* ── Picker modal (bottom sheet) ── */}
      <Modal visible={picker.open} transparent animationType="slide" onRequestClose={() => setPicker(p => ({ ...p, open: false }))}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setPicker(p => ({ ...p, open: false }))} />
          <View style={[styles.sheet, { backgroundColor: theme.card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: isDark ? '#334155' : '#cbd5e1' }]} />
            <View style={[styles.sheetHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>
                Select {picker.kind}
              </Text>
              <TouchableOpacity onPress={() => setPicker(p => ({ ...p, open: false }))}>
                <Ionicons name="close" size={scale(22)} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: height * 0.48 }} showsVerticalScrollIndicator={false}>
              {/* "All" option */}
              {(['All Classes', 'All Subjects'] as const).filter((_, i) => (i === 0) === (picker.kind === 'Class')).map(val => (
                <TouchableOpacity
                  key={val}
                  style={[styles.sheetOption, { borderBottomColor: theme.border }]}
                  onPress={() => pickItem(val)}
                >
                  <View style={[styles.dot, { backgroundColor: '#94a3b8' }]} />
                  <Text style={[styles.sheetOptionTxt, { color: theme.text, flex: 1 }]}>{val}</Text>
                  {((picker.kind === 'Class' && selClass === val) || (picker.kind === 'Subject' && selSubject === val)) && (
                    <Ionicons name="checkmark-circle" size={scale(18)} color={theme.primary} />
                  )}
                </TouchableOpacity>
              ))}
              {/* Items */}
              {(picker.kind === 'Class' ? sortedClasses : subjects).map((item: string, i: number) => {
                const color    = picker.kind === 'Class' ? classColor(item) : subjectColor(item);
                const isActive = picker.kind === 'Class' ? selClass === item : selSubject === item;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.sheetOption, { borderBottomColor: theme.border, backgroundColor: isActive ? (isDark ? color + '18' : color + '08') : 'transparent' }]}
                    onPress={() => pickItem(item)}
                  >
                    <View style={[styles.dot, { backgroundColor: color }]} />
                    <Text style={[styles.sheetOptionTxt, { color: isActive ? color : theme.text, fontWeight: isActive ? '700' : '400', flex: 1 }]}>{item}</Text>
                    {isActive && <Ionicons name="checkmark-circle" size={scale(18)} color={color} />}
                  </TouchableOpacity>
                );
              })}
              <View style={{ height: scale(20) }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Detail popup ── */}
      <Modal
        visible={detail.open}
        transparent
        animationType="fade"
        onRequestClose={() => setDetail(d => ({ ...d, open: false }))}
        statusBarTranslucent
      >
        <View style={styles.popupOverlay}>
          {/* Backdrop tap to dismiss */}
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setDetail(d => ({ ...d, open: false }))}
          />

          {detail.item != null && (() => {
            const rawC  = detail.item.targetClass || '';
            const rawS  = detail.item.subject     || '';
            const dCls  = (!rawC || rawC === 'All' || rawC === 'Select Class')    ? 'All Classes' : rawC;
            const dSubj = (!rawS || rawS === 'Select Subject' || rawS === 'None') ? 'General'     : rawS;
            const info  = typeOf(detail.item);

            return (
              <View style={[styles.popupCard, { backgroundColor: theme.card }]}>

                {/* ─ Coloured accent top bar ─ */}
                <View style={[styles.popupAccentBar, { backgroundColor: info.color }]} />

                {/* ─ Header row ─ */}
                <View style={[styles.popupHeader, { borderBottomColor: theme.border }]}>
                  <View style={[styles.popupIconBox, { backgroundColor: isDark ? info.color + '28' : info.color + '15' }]}>
                    <Ionicons name={info.icon as any} size={scale(24)} color={info.color} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={[styles.popupTypePill, { backgroundColor: info.color }]}>
                      <Text style={styles.popupTypePillTxt}>{info.label}</Text>
                    </View>
                    <Text style={[styles.popupTitle, { color: theme.text }]} numberOfLines={3}>
                      {detail.item.title || 'Untitled Material'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setDetail(d => ({ ...d, open: false }))}
                    style={[styles.popupCloseBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={scale(22)} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* ─ Meta row ─ */}
                <View style={[styles.popupMetaRow, { borderBottomColor: theme.border, backgroundColor: isDark ? theme.background : '#f8fafc' }]}>
                  <View style={[styles.popupMetaBadge, { backgroundColor: isDark ? classColor(dCls) + '30' : classColor(dCls) + '18' }]}>
                    <Ionicons name="school-outline" size={scale(12)} color={classColor(dCls)} />
                    <Text style={[styles.popupMetaTxt, { color: classColor(dCls) }]}>{dCls}</Text>
                  </View>

                  <View style={[styles.popupMetaBadge, { backgroundColor: isDark ? subjectColor(dSubj) + '30' : subjectColor(dSubj) + '18' }]}>
                    <Ionicons name="book-outline" size={scale(12)} color={subjectColor(dSubj)} />
                    <Text style={[styles.popupMetaTxt, { color: subjectColor(dSubj) }]}>{dSubj}</Text>
                  </View>

                  {!!detail.item.teacherName && (
                    <View style={[styles.popupMetaBadge, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                      <Ionicons name="person-outline" size={scale(12)} color={theme.placeholder} />
                      <Text style={[styles.popupMetaTxt, { color: theme.placeholder }]} numberOfLines={1}>
                        {detail.item.teacherName}
                      </Text>
                    </View>
                  )}

                  {!!detail.item.timeAgo && (
                    <View style={[styles.popupMetaBadge, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                      <Ionicons name="time-outline" size={scale(12)} color={theme.placeholder} />
                      <Text style={[styles.popupMetaTxt, { color: theme.placeholder }]}>{detail.item.timeAgo}</Text>
                    </View>
                  )}
                </View>

                {/* ─ Content area ─ */}
                <ScrollView
                  style={styles.popupScroll}
                  contentContainerStyle={styles.popupBody}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text style={[styles.popupSectionLabel, { color: theme.placeholder }]}>CONTENT</Text>
                  <View style={[styles.richBox, { backgroundColor: isDark ? theme.background : '#f8fafc', borderColor: theme.border }]}>
                    {renderRichText(
                      detail.item.content || detail.item.message || 'No description has been provided for this material.',
                      theme,
                      isDark
                    )}
                  </View>
                  <View style={{ height: scale(16) }} />
                </ScrollView>

                {/* ─ Footer close button ─ */}
                <View style={[styles.popupFooter, { borderTopColor: theme.border }]}>
                  <TouchableOpacity
                    style={[styles.popupDoneBtn, { backgroundColor: info.color }]}
                    onPress={() => setDetail(d => ({ ...d, open: false }))}
                    activeOpacity={0.82}
                  >
                    <Ionicons name="checkmark" size={scale(16)} color="#fff" style={{ marginRight: scale(6) }} />
                    <Text style={styles.popupDoneTxt}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}
        </View>
      </Modal>
    </View>
  );
};

/* ═══════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Header */
  header: { borderBottomLeftRadius: scale(24), borderBottomRightRadius: scale(24),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    borderBottomWidth: 1,
    gap: scale(10),
  },
  headerBtn:   { padding: scale(2) },
  headerTitle: { fontSize: scale(17), fontWeight: '700', letterSpacing: -0.2 },
  headerSub:   { fontSize: scale(11), marginTop: scale(1) },
  unreadPill:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(8), paddingVertical: scale(4), borderRadius: scale(20), borderWidth: 1, gap: scale(4) },
  unreadDot:   { width: scale(6), height: scale(6), borderRadius: scale(3) },
  unreadPillTxt: { fontSize: scale(10), fontWeight: '700' },

  /* List */
  listContent: { paddingHorizontal: scale(14), paddingTop: scale(14) },

  /* Stats */
  statsRow:    { flexDirection: 'row', gap: scale(8), marginBottom: scale(12) },
  statChip:    { flex: 1, alignItems: 'center', borderRadius: scale(10), paddingVertical: scale(10), borderWidth: 1, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
  statIconBox: { width: scale(32), height: scale(32), borderRadius: scale(8), justifyContent: 'center', alignItems: 'center', marginBottom: scale(4) },
  statVal:     { fontSize: scale(18), fontWeight: '800', letterSpacing: -0.5 },
  statLbl:     { fontSize: scale(9),  fontWeight: '500', marginTop: scale(1) },

  /* Search */
  searchBox:   { flexDirection: 'row', alignItems: 'center', borderRadius: scale(8), paddingHorizontal: scale(12), height: scale(42), marginBottom: scale(10), borderWidth: 1, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2 },
  searchInput: { flex: 1, fontSize: scale(13) },

  /* Filters */
  filterRow:     { flexDirection: 'row', gap: scale(8), marginBottom: scale(6), alignItems: 'center' },
  filterBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', height: scale(38), borderRadius: scale(8), paddingHorizontal: scale(10), borderWidth: 1 },
  filterBtnTxt:  { flex: 1, fontSize: scale(12), marginRight: scale(2) },
  clearBtn:      { width: scale(38), height: scale(38), borderRadius: scale(8), borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  resultLine:    { fontSize: scale(11), fontWeight: '500', marginBottom: scale(10) },

  /* Card */
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scale(10),
    padding: scale(12),
    marginBottom: scale(8),
    borderWidth: 1,
    borderLeftWidth: 3,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  cardIconWrap: { width: scale(44), height: scale(48), borderRadius: scale(10), justifyContent: 'center', alignItems: 'center', marginRight: scale(12), position: 'relative' },
  typePill:     { position: 'absolute', bottom: -scale(5), paddingHorizontal: scale(4), paddingVertical: scale(1), borderRadius: scale(3) },
  typePillTxt:  { color: '#fff', fontSize: scale(7), fontWeight: '800', letterSpacing: 0.3 },
  cardBody:     { flex: 1 },
  cardTitle:    { fontSize: scale(13), fontWeight: '700', lineHeight: scale(18), marginBottom: scale(6) },
  newBadge:     { paddingHorizontal: scale(5), paddingVertical: scale(2), borderRadius: scale(4), marginLeft: scale(6) },
  newBadgeTxt:  { color: '#fff', fontSize: scale(8), fontWeight: '800', letterSpacing: 0.5 },
  badgeRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: scale(5), marginBottom: scale(6) },
  badge:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(6), paddingVertical: scale(3), borderRadius: scale(4) },
  badgeTxt:     { fontSize: scale(10), fontWeight: '600' },
  metaRow:      { flexDirection: 'row', alignItems: 'center' },
  metaTxt:      { fontSize: scale(10), marginLeft: scale(3) },

  /* Empty */
  empty:          { alignItems: 'center', paddingTop: scale(50), paddingBottom: scale(30) },
  emptyIconWrap:  { width: scale(72), height: scale(72), borderRadius: scale(20), justifyContent: 'center', alignItems: 'center', marginBottom: scale(14) },
  emptyTitle:     { fontSize: scale(15), fontWeight: '700', marginBottom: scale(6) },
  emptySub:       { fontSize: scale(12), textAlign: 'center', lineHeight: scale(18), maxWidth: '75%' },
  clearFiltersBtn:  { marginTop: scale(16), paddingHorizontal: scale(20), paddingVertical: scale(10), borderRadius: scale(8), borderWidth: 1 },
  clearFiltersBtnTxt: { fontSize: scale(13), fontWeight: '700' },

  /* Bottom sheet shared (picker) */
  sheetOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:          { borderTopLeftRadius: scale(20), borderTopRightRadius: scale(20), paddingHorizontal: scale(16), paddingBottom: scale(8) },
  sheetHandle:    { width: scale(38), height: scale(4), borderRadius: scale(2), alignSelf: 'center', marginTop: scale(10), marginBottom: scale(12) },
  sheetHeader:    { flexDirection: 'row', alignItems: 'center', paddingBottom: scale(12), borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: scale(4) },
  sheetTitle:     { flex: 1, fontSize: scale(16), fontWeight: '700' },
  sheetOption:    { flexDirection: 'row', alignItems: 'center', paddingVertical: scale(13), borderBottomWidth: StyleSheet.hairlineWidth, gap: scale(10) },
  sheetOptionTxt: { fontSize: scale(14) },
  dot:            { width: scale(10), height: scale(10), borderRadius: scale(5) },

  /* ── Detail popup ── */
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(16),
  },
  popupCard: {
    width: '100%',
    maxHeight: height * 0.82,
    borderRadius: scale(18),
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
  },
  popupAccentBar:  { height: scale(4), width: '100%' },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: scale(14),
    paddingBottom: scale(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: scale(10),
  },
  popupIconBox:    { width: scale(44), height: scale(44), borderRadius: scale(12), justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  popupTypePill:   { alignSelf: 'flex-start', paddingHorizontal: scale(7), paddingVertical: scale(2), borderRadius: scale(5), marginBottom: scale(4) },
  popupTypePillTxt:{ color: '#fff', fontSize: scale(9), fontWeight: '800', letterSpacing: 0.5 },
  popupTitle:      { fontSize: scale(15), fontWeight: '700', lineHeight: scale(22) },
  popupCloseBtn:   { width: scale(34), height: scale(34), borderRadius: scale(17), justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  popupMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(6),
    paddingHorizontal: scale(14),
    paddingVertical: scale(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  popupMetaBadge:  { flexDirection: 'row', alignItems: 'center', gap: scale(4), paddingHorizontal: scale(8), paddingVertical: scale(5), borderRadius: scale(8) },
  popupMetaTxt:    { fontSize: scale(11), fontWeight: '600' },
  popupScroll:     { maxHeight: height * 0.40 },
  popupBody:       { padding: scale(14) },
  popupSectionLabel: { fontSize: scale(10), fontWeight: '700', letterSpacing: 0.8, marginBottom: scale(8) },
  popupFooter: {
    padding: scale(12),
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  popupDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: scale(12),
    borderRadius: scale(10),
  },
  popupDoneTxt:    { color: '#fff', fontSize: scale(14), fontWeight: '700' },
  richBox:         { padding: scale(14), borderRadius: scale(12), borderWidth: 1, minHeight: scale(60) },
});

export default DocumentsScreen;
