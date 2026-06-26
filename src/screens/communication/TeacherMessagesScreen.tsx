import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Dimensions, Keyboard, FlatList, Image, Alert, Animated, RefreshControl,
  Modal, Linking, Vibration, StatusBar
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { updateLastReadTimestamp, fetchMessagingSettings, fetchTodayMessageCount, incrementTodayMsgCount } from '../../store/slices/messagesSlice';
import { scale } from '../../utils/responsive';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../api/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Clipboard from 'expo-clipboard';

// Professional badge component for unread messages
const NotificationBadge: React.FC<{ count: number }> = ({ count }) => {
  const hasUnread = count > 0;
  return (
    <View style={{ backgroundColor: hasUnread ? '#ef4444' : '#e2e8f0', minWidth: scale(22), height: scale(22), borderRadius: scale(11), justifyContent: 'center', alignItems: 'center', paddingHorizontal: scale(6), shadowColor: hasUnread ? '#ef4444' : '#000', shadowOffset: { width: 0, height: scale(2) }, shadowOpacity: hasUnread ? 0.3 : 0.05, shadowRadius: 3, elevation: hasUnread ? 3 : 0 }}>
      <Text style={{ color: hasUnread ? '#fff' : '#64748b', fontSize: scale(10), fontWeight: 'bold' }}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

import { GROUPS } from '../../store/slices/messagesSlice';

const EMOJI_LIST = [
  "😊","😂","❤️","👍","🎉","🔥","👋","💪","🙏","✨",
  "😍","🤔","👏","💯","🎓","📚","✅","⭐","🏆","💡",
  "😎","🥳","💐","🌟","📝","✍️","🤝","🙌","💬","📢",
];

// Quick-reaction emojis shown on double-tap (subset for speed)
const QUICK_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🔥", "👏", "🎉"];

// ── Main Component ────────────────────────────────────────────────────────
export const MessagesScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  // State
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, any[]>>({});
  const [inputText, setInputText] = useState('');
  const [groupMsgCounts, setGroupMsgCounts] = useState<Record<string, number>>({});
  const [readCounts, setReadCounts] = useState<Record<string, number>>({});
  const [readMsgIds, setReadMsgIds] = useState<Record<string, string>>({});
  const [groupUnreadCounts, setGroupUnreadCounts] = useState<Record<string, number>>({});
  const [lastMessages, setLastMessages] = useState<Record<string, { id?: string; sender: string; text: string }>>({});
  const [refreshing, setRefreshing] = useState(false);

  // Link & Message Option States
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  // Keyboard Selection & Emoji States
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [showEmojiModal, setShowEmojiModal] = useState(false);

  // Reaction States
  const [reactionTargetMsg, setReactionTargetMsg] = useState<any | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const reactionAnim = useRef(new Animated.Value(0)).current;
  // Modal that shows who reacted
  const [reactionNamesModal, setReactionNamesModal] = useState<{
    emoji: string;
    users: { uid: string; name: string }[];
  } | null>(null);

  // Link press and render helper functions
  const handlePressLink = async (url: string) => {
    let fullUrl = url;
    if (!/^https?:\/\//i.test(url)) {
      fullUrl = `https://${url}`;
    }
    try {
      const supported = await Linking.canOpenURL(fullUrl);
      if (supported) {
        await Linking.openURL(fullUrl);
      } else {
        Alert.alert('Error', `Cannot open URL: ${url}`);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    const { start, end } = selection;
    const newValue = inputText.substring(0, start) + emoji + inputText.substring(end);
    setInputText(newValue);
    setShowEmojiModal(false);

    // Reposition cursor after the inserted emoji
    const newCursor = start + emoji.length;
    setSelection({ start: newCursor, end: newCursor });
  };

  const parseInlineStyles = (text: string) => {
    const segments: Array<{ type: 'text' | 'bold' | 'italic' | 'link'; content: string; label?: string; url?: string }> = [];
    let currentIndex = 0;

    const regex = /(\[(.*?)\]\(((?:https?:\/\/|www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s)]*)\))|(\*\*(.*?)\*\*)|(__(.*?)__)|(\*(.*?)\*)|(_(.*?)_)|((?:https?:\/\/|www\.)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*)/gi;

    let match;
    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      
      if (matchIndex > currentIndex) {
        segments.push({
          type: 'text',
          content: text.substring(currentIndex, matchIndex)
        });
      }

      if (match[1]) {
        segments.push({
          type: 'link',
          label: match[2],
          url: match[3],
          content: match[2]
        });
      } else if (match[4]) {
        segments.push({
          type: 'bold',
          content: match[5]
        });
      } else if (match[6]) {
        segments.push({
          type: 'bold',
          content: match[7]
        });
      } else if (match[8]) {
        segments.push({
          type: 'italic',
          content: match[9]
        });
      } else if (match[10]) {
        segments.push({
          type: 'italic',
          content: match[11]
        });
      } else if (match[12]) {
        segments.push({
          type: 'link',
          label: match[12],
          url: match[12],
          content: match[12]
        });
      }

      currentIndex = regex.lastIndex;
    }

    if (currentIndex < text.length) {
      segments.push({
        type: 'text',
        content: text.substring(currentIndex)
      });
    }

    return segments;
  };

  const renderMessageText = (text: string, isMine: boolean) => {
    if (!text) return null;

    const lines = text.split('\n');

    return (
      <View style={{ gap: scale(2) }}>
        {lines.map((line, lineIdx) => {
          const trimmed = line.trim();
          let blockType = 'paragraph';
          let textToParse = line;

          if (trimmed.startsWith('### ')) {
            blockType = 'h3';
            textToParse = trimmed.substring(4);
          } else if (trimmed.startsWith('## ')) {
            blockType = 'h2';
            textToParse = trimmed.substring(3);
          } else if (trimmed.startsWith('# ')) {
            blockType = 'h1';
            textToParse = trimmed.substring(2);
          } else if (trimmed.startsWith('- ')) {
            blockType = 'list';
            textToParse = trimmed.substring(2);
          } else if (trimmed.startsWith('* ')) {
            blockType = 'list';
            textToParse = trimmed.substring(2);
          }

          const segments = parseInlineStyles(textToParse);

          // Base block style
          let blockStyle: any = {
            fontSize: scale(14),
            lineHeight: 20,
            color: isMine ? '#fff' : theme.text,
          };

          if (blockType === 'h1') {
            blockStyle = {
              fontSize: scale(18),
              lineHeight: 24,
              fontWeight: '800',
              marginTop: scale(6),
              marginBottom: scale(4),
              color: isMine ? '#fff' : theme.text,
            };
          } else if (blockType === 'h2') {
            blockStyle = {
              fontSize: scale(16),
              lineHeight: 22,
              fontWeight: '700',
              marginTop: scale(4),
              marginBottom: scale(2),
              color: isMine ? '#fff' : theme.text,
            };
          } else if (blockType === 'h3') {
            blockStyle = {
              fontSize: scale(15),
              lineHeight: 20,
              fontWeight: '700',
              marginTop: scale(3),
              marginBottom: scale(2),
              color: isMine ? '#fff' : theme.text,
            };
          } else if (blockType === 'list') {
            blockStyle = {
              fontSize: scale(14),
              lineHeight: 20,
              marginLeft: scale(12),
              color: isMine ? '#fff' : theme.text,
            };
          }

          return (
            <Text key={lineIdx} style={blockStyle}>
              {blockType === 'list' && <Text style={{ fontWeight: '700' }}>• </Text>}
              {segments.map((seg, segIdx) => {
                if (seg.type === 'bold') {
                  return (
                    <Text key={segIdx} style={{ fontWeight: '700' }}>
                      {seg.content}
                    </Text>
                  );
                }
                if (seg.type === 'italic') {
                  return (
                    <Text key={segIdx} style={{ fontStyle: 'italic' }}>
                      {seg.content}
                    </Text>
                  );
                }
                if (seg.type === 'link') {
                  return (
                    <Text
                      key={segIdx}
                      style={{
                        color: isMine ? '#fff' : theme.primary,
                        textDecorationLine: 'underline',
                        fontWeight: '700',
                      }}
                      onPress={() => handlePressLink(seg.url!)}
                    >
                      {seg.label}
                    </Text>
                  );
                }
                return seg.content;
              })}
            </Text>
          );
        })}
      </View>
    );
  };

  // ── Reaction handlers ─────────────────────────────────────────────────
  const handleDoubleTapMessage = (msg: any) => {
    setReactionTargetMsg(msg);
    setShowReactionPicker(true);
    reactionAnim.setValue(0);
    Animated.spring(reactionAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 6,
    }).start();
  };

  const handleAddReaction = async (emoji: string, msgArg?: any) => {
    const targetMsg = msgArg || reactionTargetMsg;
    if (!targetMsg || !activeGroup || !user) return;
    setShowReactionPicker(false);

    const userName =
      profile?.name || profile?.fullname || user.displayName || 'Unknown';
    const userId = user.uid;

    try {
      const msgDocRef = doc(db, 'chatGroups', activeGroup, 'messages', targetMsg.id);
      const msgSnap = await getDoc(msgDocRef);
      if (!msgSnap.exists()) return;

      // Normalize stored reactions – supports both old string[] and new {uid,name}[] formats
      const rawReactions: Record<string, any[]> = msgSnap.data().reactions || {};
      const existing: Record<string, { uid: string; name: string }[]> = {};
      Object.keys(rawReactions).forEach(e => {
        existing[e] = (rawReactions[e] || []).map((r: any) =>
          typeof r === 'string' ? { uid: r, name: 'Unknown' } : r
        );
      });

      // Find which emoji (if any) the user already reacted with
      const previousEmoji = Object.keys(existing).find(e =>
        existing[e].some(r => r.uid === userId)
      );

      // Build fresh reactions map
      const newReactions: Record<string, { uid: string; name: string }[]> = {};
      Object.keys(existing).forEach(e => {
        if (e === previousEmoji) {
          // Strip user from their old emoji
          const filtered = existing[e].filter(r => r.uid !== userId);
          if (filtered.length > 0) newReactions[e] = filtered;
          // if empty, omit the key entirely
        } else {
          newReactions[e] = existing[e];
        }
      });

      if (previousEmoji !== emoji) {
        // Add user to the new emoji
        newReactions[emoji] = [
          ...(newReactions[emoji] || []),
          { uid: userId, name: userName },
        ];
      }
      // (if previousEmoji === emoji, we just toggled it off — already removed above)

      await updateDoc(msgDocRef, { reactions: newReactions });
    } catch (err) {
      console.error('Reaction error:', err);
    }
  };

  // Option Action handlers
  const handleLongPressMessage = (msg: any) => {
    setSelectedMessage(msg);
    setShowActionSheet(true);
  };

  const handleCopy = async () => {
    if (selectedMessage) {
      await Clipboard.setStringAsync(selectedMessage.text);
      setShowActionSheet(false);
      Alert.alert('Copied ✓', 'Message copied to clipboard.');
    }
  };

  const handleStartEdit = () => {
    if (selectedMessage) {
      setInputText(selectedMessage.text);
      setEditingMessageId(selectedMessage.id);
      setShowActionSheet(false);
    }
  };

  const handleDelete = () => {
    if (selectedMessage) {
      setShowActionSheet(false);
      // Slight delay ensures ActionSheet fully closes before Modal appears
      setTimeout(() => setShowDeletePrompt(true), 50);
    }
  };

  const confirmDelete = async () => {
    if (selectedMessage) {
      setShowDeletePrompt(false);
      try {
        const msgDocRef = doc(db, 'chatGroups', activeGroup!, 'messages', selectedMessage.id);
        await deleteDoc(msgDocRef);
      } catch (err: any) {
        console.error('Error deleting message:', err);
        Alert.alert('Error', 'Failed to delete message.');
      }
    }
  };

  // Auto-Redirect directly into Group Chat when parameter is received
  const initialGroupId = route.params?.groupId;
  useEffect(() => {
    if (initialGroupId) {
      setActiveGroup(initialGroupId);
      navigation.setParams({ groupId: undefined });
    }
  }, [initialGroupId, navigation]);

  // ── FIX: Track keyboard visibility to avoid double safe-area padding ──
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = 'keyboardDidShow';
    const hideEvent = 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Messaging settings from Redux
  const messagingEnabled = useAppSelector((state: any) => state.messages.studentMessagingEnabled);
  const dailyMessageLimit = useAppSelector((state: any) => state.messages.dailyMessageLimit);
  const todayMsgCount = useAppSelector((state: any) => state.messages.todayMsgCount);

  const flatListRef = useRef<FlatList>(null);
  const prevMsgCountsRef = useRef<Record<string, number>>({});
  const bellSoundRef = useRef<InstanceType<typeof Audio.Sound> | null>(null);

  // User Profile
  const profile = useAppSelector((state: any) => state.auth.profile);
  const user = useAppSelector((state: any) => state.auth.user);
  const dispatch = useAppDispatch();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    dispatch(fetchMessagingSettings());
    if (user?.uid && activeGroup) {
      dispatch(fetchTodayMessageCount({ uid: user.uid, groupId: activeGroup }));
    }
    await new Promise((r) => setTimeout(r, 450));
    setRefreshing(false);
  }, [dispatch, user?.uid, activeGroup]);

  useFocusEffect(
    React.useCallback(() => {
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'none' },
        headerShown: false,
      });

      // We no longer clear global unread badge on screen load. We clear it on group open.
    }, [navigation])
  );

  // Load messaging settings & today's count via Redux
  useFocusEffect(
    React.useCallback(() => {
      dispatch(fetchMessagingSettings());
    }, [])
  );

  useFocusEffect(
    React.useCallback(() => {
      if (user?.uid && activeGroup) {
        dispatch(fetchTodayMessageCount({ uid: user.uid, groupId: activeGroup }));
      }
    }, [user?.uid, activeGroup])
  );

  // Subscribe to message counts for all groups
  useEffect(() => {
    AsyncStorage.getItem('chatReadCounts').then(res => {
      if (res) setReadCounts(JSON.parse(res));
    }).catch(console.error);
    AsyncStorage.getItem('chatReadMsgIds').then(res => {
      if (res) setReadMsgIds(JSON.parse(res));
    }).catch(console.error);

    const unsubs: (() => void)[] = [];
    GROUPS.forEach(g => {
      const q = query(
        collection(db, 'chatGroups', g.id, 'messages'),
        orderBy('timestamp', 'desc'),
        limit(99)
      );
      const unsub = onSnapshot(q, (snap) => {
        setGroupMsgCounts(prev => ({ ...prev, [g.id]: snap.size }));
        if (snap.docs.length > 0) {
          const latestDoc = snap.docs[0].data();
          const latestDocId = snap.docs[0].id;
          setLastMessages(prev => ({
            ...prev,
            [g.id]: { id: latestDocId, sender: latestDoc.sender || 'Unknown', text: latestDoc.text || '' }
          }));

          setReadMsgIds(currentReadIds => {
            const lastReadId = currentReadIds[g.id];
            let unreadCount = 0;
            if (lastReadId) {
              const index = snap.docs.findIndex(d => d.id === lastReadId);
              unreadCount = index === -1 ? snap.docs.length : index;
            } else {
              unreadCount = snap.docs.length;
            }
            setGroupUnreadCounts(prev => ({ ...prev, [g.id]: unreadCount }));
            return currentReadIds;
          });
        } else {
          setGroupUnreadCounts(prev => ({ ...prev, [g.id]: 0 }));
        }
      });
      unsubs.push(unsub);
    });
    return () => {
      unsubs.forEach(u => u());
    };
  }, []);

  // Ring bell when new messages arrive in any group
  useEffect(() => {
    const prev = prevMsgCountsRef.current;
    let hasNewMessage = false;

    for (const gId of Object.keys(groupMsgCounts)) {
      if (prev[gId] !== undefined && groupMsgCounts[gId] > prev[gId] && gId !== activeGroup) {
        hasNewMessage = true;
        break;
      }
    }

    prevMsgCountsRef.current = { ...groupMsgCounts };

    if (hasNewMessage) {
      // Vibrate briefly when a new message arrives (400ms)
      Vibration.vibrate(400);
    }
  }, [groupMsgCounts, activeGroup]);

  // Sync read count for active group
  useEffect(() => {
    if (activeGroup && groupMsgCounts[activeGroup] !== undefined) {
      setReadCounts(prev => {
        const currentCount = groupMsgCounts[activeGroup];
        if (prev[activeGroup] !== currentCount) {
          const newCounts = { ...prev, [activeGroup]: currentCount };
          AsyncStorage.setItem('chatReadCounts', JSON.stringify(newCounts)).catch(console.error);
          return newCounts;
        }
        return prev;
      });
    }

    if (activeGroup && lastMessages[activeGroup]?.id) {
      const latestId = lastMessages[activeGroup].id;
      if (latestId) {
        setReadMsgIds(prev => {
          if (prev[activeGroup] !== latestId) {
            const newIds = { ...prev, [activeGroup]: latestId };
            AsyncStorage.setItem('chatReadMsgIds', JSON.stringify(newIds)).catch(console.error);
            return newIds;
          }
          return prev;
        });
        setGroupUnreadCounts(prev => ({ ...prev, [activeGroup]: 0 }));
      }
    }
  }, [activeGroup, groupMsgCounts, lastMessages]);

  useEffect(() => {
    if (!activeGroup) return;

    const messagesRef = collection(db, 'chatGroups', activeGroup, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        let formattedTime = '';
        if (data.timestamp) {
          const dateObj = data.timestamp.toDate();
          formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
          formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        const isMine = data.senderId === user?.uid;

        return {
          id: doc.id,
          text: data.text,
          sender: data.sender,
          senderId: data.senderId,
          avatar: data.avatar || null,
          role: data.role || 'student',
          subject: data.subject || null,
          time: formattedTime,
          isMine,
          isAnnouncement: data.isAnnouncement || false,
          reactions: (() => {
            // Normalize: support both old string[] and new {uid,name}[] formats
            const raw: Record<string, any[]> = data.reactions || {};
            const out: Record<string, { uid: string; name: string }[]> = {};
            Object.keys(raw).forEach(e => {
              const arr = (raw[e] || []).map((r: any) =>
                typeof r === 'string' ? { uid: r, name: 'Unknown' } : r
              ).filter((r: any) => r.uid);
              if (arr.length > 0) out[e] = arr;
            });
            return out;
          })(),
        };
      });

      setMessages(prev => ({
        ...prev,
        [activeGroup]: fetchedMessages
      }));

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => unsubscribe();
  }, [activeGroup]);

  const normalizeGrade = (gradeStr: string): string => {
    const g = gradeStr.toLowerCase().trim();
    if (g.includes('9th') || g === '9') return '9';
    if (g.includes('10th') || g === '10') return '10';
    if (g.includes('1st') || g.includes('11') || g.includes('eleven')) return '11';
    if (g.includes('2nd') || g.includes('12') || g.includes('twelve')) return '12';
    return g.replace(/[^0-9]/g, '');
  };

  const filteredGroups = GROUPS.filter(g => {
    if (!profile) return false;

    const role = String(profile.role || '').trim().toLowerCase();

    if (role === 'admin' || role === 'teacher' || role === 'staff' || (role && role !== 'student')) return true;

    const studentGrade = String(profile.class || profile.grade || '').trim().toLowerCase();
    const studentGender = String(profile.gender || '').trim().toLowerCase();

    const isBoys = studentGender === 'male' || studentGender === 'boy' || studentGender === 'boys';
    const isGirls = studentGender === 'female' || studentGender === 'girl' || studentGender === 'girls';

    const groupGenderMatch = (g.gender === 'boy' && isBoys) || (g.gender === 'girl' && isGirls);
    const groupGradeMatch = normalizeGrade(studentGrade) === normalizeGrade(g.grade);

    return groupGenderMatch && groupGradeMatch;
  });

  useFocusEffect(
    React.useCallback(() => {
      if (profile && profile.role !== 'admin' && profile.role !== 'teacher' && filteredGroups.length === 1) {
        setActiveGroup(filteredGroups[0].id);
      }
    }, [profile, filteredGroups.length])
  );

  const isStudentRole = profile?.role === 'student' || (!profile?.role);
  const isPrivilegedRole = profile?.role === 'admin' || profile?.role === 'teacher' || profile?.role === 'staff';

  const canStudentSend = () => {
    if (isPrivilegedRole) return true;
    if (!messagingEnabled) return false;
    if (dailyMessageLimit === 0) return true;
    return todayMsgCount < dailyMessageLimit;
  };

  const remainingMessages = dailyMessageLimit === 0 ? Infinity : Math.max(0, dailyMessageLimit - todayMsgCount);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    if (!activeGroup) {
      Alert.alert('Error', 'No chat group selected.');
      return;
    }
    if (!user) {
      Alert.alert('Error', 'No user credentials found. Please sign in again.');
      return;
    }

    if (isStudentRole && !isPrivilegedRole && !editingMessageId) {
      if (!messagingEnabled) {
        Alert.alert('Messaging Disabled', 'The admin has disabled student messaging in this group.');
        return;
      }
      if (dailyMessageLimit > 0 && todayMsgCount >= dailyMessageLimit) {
        Alert.alert('Limit Reached', `You have reached your daily limit of ${dailyMessageLimit} messages. Try again tomorrow.`);
        return;
      }
    }

    const messageText = inputText.trim();
    const isEditMode = !!editingMessageId;
    setInputText('');
    setEditingMessageId(null);
    Keyboard.dismiss();

    try {
      if (isEditMode && editingMessageId) {
        const msgDocRef = doc(db, 'chatGroups', activeGroup, 'messages', editingMessageId);
        await updateDoc(msgDocRef, {
          text: messageText,
          updatedAt: serverTimestamp(),
          isEdited: true
        });
      } else {
        const messagesRef = collection(db, 'chatGroups', activeGroup, 'messages');
        await addDoc(messagesRef, {
          text: messageText,
          sender: profile?.name || profile?.fullname || user.displayName || 'Unknown User',
          senderId: user.uid,
          avatar: profile?.profileImage || profile?.avatar || profile?.image || user.photoURL || null,
          role: profile?.role || 'student',
          subject: profile?.class || null,
          timestamp: serverTimestamp(),
          isAnnouncement: false
        });
        if (isStudentRole && !isPrivilegedRole) {
          dispatch(incrementTodayMsgCount());
        }
      }
    } catch (error: any) {
      console.error('Error processing message action:', error);
      Alert.alert('Failed to send/edit message', error?.message || 'Please check your connection or database rules.');
    }
  };

  // ── FIX: Compute bottom padding for the input bar ──────────────────────
  // When keyboard is visible, the keyboard itself covers the bottom — no inset needed.
  // When keyboard is hidden, respect the device’s home indicator / safe area on all platforms.
  const inputBarPaddingBottom = showEmojiModal
    ? 0
    : keyboardVisible
      ? 8
      : Math.max(8, insets.bottom + 4);

  const totalUnread = filteredGroups.reduce((acc, g) => {
    return acc + (groupUnreadCounts[g.id] || 0);
  }, 0);

  // ── Render: Groups List ────────────────────────────────────────────────
  if (!activeGroup) {
    const girlGroups = filteredGroups.filter(g => g.gender === 'girl');
    const boyGroups = filteredGroups.filter(g => g.gender === 'boy');


    const renderGroupCard = (g: any, gender: 'girl' | 'boy') => {
      const lastMsg = lastMessages[g.id] || null;
      const unread = groupUnreadCounts[g.id] || 0;
      const isGirl = gender === 'girl';
      const accentColor = isGirl ? '#e91e8c' : '#6366f1';
      const avatarBg = isGirl ? 'rgba(233,30,140,0.1)' : 'rgba(99,102,241,0.1)';

      return (
        <TouchableOpacity
          key={g.id}
          style={[
            msgListStyles.listCard,
            { backgroundColor: isDark ? '#1e293b' : '#fff' },
            unread > 0 && { borderLeftColor: accentColor },
          ]}
          onPress={() => { setActiveGroup(g.id); dispatch(updateLastReadTimestamp(Date.now())); }}
          activeOpacity={0.72}
        >
          {/* Left color strip */}
          <View style={[msgListStyles.listCardStrip, { backgroundColor: accentColor }]} />

          {/* Avatar */}
          <View style={[msgListStyles.listCardAvatar, { backgroundColor: avatarBg }]}>
            <Ionicons name={isGirl ? 'woman' : 'man'} size={scale(22)} color={accentColor} />
            {unread > 0 && (
              <View style={[msgListStyles.avatarUnreadDot, { backgroundColor: accentColor }]} />
            )}
          </View>

          {/* Content */}
          <View style={msgListStyles.listCardContent}>
            <View style={msgListStyles.listCardTitleRow}>
              <Text style={[msgListStyles.listCardTitle, { color: isDark ? '#f1f5f9' : '#1e293b' }]} numberOfLines={1}>
                {g.name}
              </Text>
              {unread > 0 && (
                <View style={[msgListStyles.unreadPill, { backgroundColor: accentColor }]}>
                  <Text style={msgListStyles.unreadPillText}>{unread > 99 ? '99+' : unread}</Text>
                </View>
              )}
            </View>
            <Text style={msgListStyles.listCardPreview} numberOfLines={1}>
              {lastMsg
                ? <><Text style={[msgListStyles.listCardPreviewSender, { color: isDark ? '#94a3b8' : '#475569' }]}>{lastMsg.sender}: </Text>{lastMsg.text}</>
                : <Text style={{ fontStyle: 'italic', color: '#94a3b8' }}>No messages yet</Text>
              }
            </Text>
          </View>

          {/* Chevron */}
          <Ionicons name="chevron-forward" size={scale(16)} color={isDark ? '#475569' : '#cbd5e1'} style={{ marginRight: scale(4) }} />
        </TouchableOpacity>
      );
    };

    return (
      <View style={{ flex: 1, backgroundColor: isDark ? theme.background : '#f1f5f9' }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        {/* Navy wave header banner */}
        <Image
          source={require('../../../assets/header_bg.png')}
          style={msgListStyles.headerBanner}
          resizeMode="stretch"
        />

        {/* Header row: back + title + bell */}
        <SafeAreaView edges={['top']} style={msgListStyles.headerRow}>
          <TouchableOpacity style={msgListStyles.headerBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={scale(20)} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={msgListStyles.headerTitle}>Messages</Text>
            {totalUnread > 0 && (
              <Text style={msgListStyles.headerSubtitle}>{totalUnread} unread</Text>
            )}
          </View>
          <TouchableOpacity style={msgListStyles.headerBellBtn} onPress={() => navigation.navigate('LibraryScreen')}>
            <Ionicons name="notifications-outline" size={scale(20)} color="#fff" />
            {totalUnread > 0 && (
              <View style={msgListStyles.bellBadge}>
                <Text style={msgListStyles.bellBadgeText}>{totalUnread > 99 ? '99+' : totalUnread}</Text>
              </View>
            )}
          </TouchableOpacity>
        </SafeAreaView>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: insets.top + scale(60), paddingBottom: scale(100), paddingHorizontal: scale(16) }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
        >
          {filteredGroups.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: scale(60) }}>
              <View style={{ width: scale(80), height: scale(80), borderRadius: scale(40), backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center', marginBottom: scale(16) }}>
                <Ionicons name="chatbubbles-outline" size={scale(38)} color="#6366f1" />
              </View>
              <Text style={{ color: '#1e293b', fontSize: scale(16), fontWeight: '700', marginBottom: scale(6) }}>No Groups Yet</Text>
              <Text style={{ color: '#94a3b8', textAlign: 'center', fontSize: scale(13), lineHeight: scale(20) }}>No chat groups available for your class and role.</Text>
            </View>
          ) : (
            <>
              {/* Girls Sections */}
              {girlGroups.length > 0 && (
                <View style={{ marginBottom: scale(24) }}>
                  <View style={msgListStyles.sectionHeader}>
                    <View style={[msgListStyles.sectionAccentBar, { backgroundColor: '#e91e8c' }]} />
                    <View style={msgListStyles.sectionIconWrap}>
                      <Ionicons name="woman" size={scale(14)} color="#e91e8c" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={msgListStyles.sectionTitleGirls}>Girls Sections</Text>
                      <Text style={msgListStyles.sectionCount}>{girlGroups.length} group{girlGroups.length !== 1 ? 's' : ''}</Text>
                    </View>
                  </View>
                  <View style={msgListStyles.cardGroup}>
                    {girlGroups.map(g => renderGroupCard(g, 'girl'))}
                  </View>
                </View>
              )}

              {/* Boys Sections */}
              {boyGroups.length > 0 && (
                <View style={{ marginBottom: scale(24) }}>
                  <View style={msgListStyles.sectionHeader}>
                    <View style={[msgListStyles.sectionAccentBar, { backgroundColor: '#6366f1' }]} />
                    <View style={msgListStyles.sectionIconWrapBoy}>
                      <Ionicons name="man" size={scale(14)} color="#6366f1" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={msgListStyles.sectionTitleBoys}>Boys Sections</Text>
                      <Text style={msgListStyles.sectionCount}>{boyGroups.length} group{boyGroups.length !== 1 ? 's' : ''}</Text>
                    </View>
                  </View>
                  <View style={msgListStyles.cardGroup}>
                    {boyGroups.map(g => renderGroupCard(g, 'boy'))}
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    );
  }


  // ── Render: Chat Window ─────────────────────────────────────────────────
  const groupObj = GROUPS.find(g => g.id === activeGroup);
  const currentMessages = messages[activeGroup] || [];

  const renderMessage = ({ item }: { item: any }) => {
    if (item.isAnnouncement) {
      return (
        <View style={styles.announcementBubble}>
          <Text style={styles.announcementLabel}>🔔 {item.sender} (Announcement)</Text>
          <Text style={styles.announcementText}>{item.text}</Text>
          <Text style={styles.announcementTime}>{item.time}</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => {}}
        onLongPress={() => handleLongPressMessage(item)}
        delayLongPress={350}
        onPressOut={(e) => {
          // Detect double-tap via timestamp
          const now = Date.now();
          const lastTap = (handleDoubleTapMessage as any)._lastTap;
          if (lastTap && now - lastTap < 300) {
            handleDoubleTapMessage(item);
          }
          (handleDoubleTapMessage as any)._lastTap = now;
        }}
        style={[styles.msgRow, item.isMine ? styles.msgRight : styles.msgLeft]}>
        {!item.isMine && (
          item.avatar ? (
            <Image source={{ uri: item.avatar }} style={[styles.avatar, { backgroundColor: theme.border }]} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarText}>{item.sender ? item.sender[0] : '?'}</Text>
            </View>
          )
        )}

        <View style={[styles.msgContentWrapper, item.isMine ? { alignItems: 'flex-end', marginRight: scale(8) } : { alignItems: 'flex-start' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(5), marginBottom: scale(3) }}>
            <Text style={[styles.msgSender, { color: theme.textSecondary }]}>{item.sender}</Text>
            {item.role && (
              <View style={[styles.roleBadge, {
                backgroundColor:
                  item.role === 'admin' ? '#fef2f2' :
                    item.role === 'teacher' ? '#eff6ff' :
                      item.role === 'staff' ? '#f5f3ff' : '#f0fdf4',
              }]}>
                <Text style={[styles.roleBadgeText, {
                  color:
                    item.role === 'admin' ? '#ef4444' :
                      item.role === 'teacher' ? '#2b5fe7' :
                        item.role === 'staff' ? '#8b5cf6' : '#10b981',
                }]}>
                  {(item.role === 'teacher' || item.role?.toLowerCase().includes('teacher')) && item.subject
                    ? item.subject.toUpperCase()
                    : item.role.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onLongPress={() => handleLongPressMessage(item)}
            onPress={() => {}}
            delayLongPress={350}
            style={[
              styles.msgBubble,
              item.isMine
                ? { backgroundColor: theme.primary, borderTopRightRadius: scale(2) }
                : { backgroundColor: theme.card, borderTopLeftRadius: scale(2) }
            ]}
          >
            {/* Double-tap target - invisible overlay removed in favour of outer row handler */}
            {renderMessageText(item.text, item.isMine)}
            <View style={{ flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', gap: scale(3), marginTop: scale(2) }}>
              {item.isEdited && (
                <Text style={{ fontSize: scale(8), fontStyle: 'italic', color: item.isMine ? 'rgba(255,255,255,0.6)' : theme.textTertiary }}>
                  (edited)
                </Text>
              )}
              <Text style={[styles.msgTime, { color: item.isMine ? 'rgba(255,255,255,0.7)' : theme.textSecondary }]}>
                {item.time}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Reaction Pills — tap to see who reacted */}
          {item.reactions && Object.keys(item.reactions).length > 0 && (
            <View style={[
              styles.reactionRow,
              item.isMine ? { alignSelf: 'flex-end', marginRight: scale(4) } : { alignSelf: 'flex-start', marginLeft: scale(4) }
            ]}>
              {Object.entries(item.reactions as Record<string, { uid: string; name: string }[]>)
                .filter(([, users]) => users.length > 0)
                .map(([emoji, users]) => {
                  const myReaction = users.some(u => u.uid === (user?.uid || ''));
                  return (
                    <TouchableOpacity
                      key={emoji}
                      onPress={() => setReactionNamesModal({ emoji, users })}
                      onLongPress={() => handleAddReaction(emoji, item)}
                      activeOpacity={0.75}
                      style={[
                        styles.reactionPill,
                        myReaction && styles.reactionPillActive,
                        { borderColor: myReaction ? theme.primary : theme.border }
                      ]}
                    >
                      <Text style={styles.reactionEmoji}>{emoji}</Text>
                      <Text style={[
                        styles.reactionCount,
                        { color: myReaction ? theme.primary : theme.textSecondary }
                      ]}>{users.length}</Text>
                    </TouchableOpacity>
                  );
              })}
              {/* Add / change reaction button */}
              <TouchableOpacity
                onPress={() => handleDoubleTapMessage(item)}
                style={[
                  styles.reactionPill,
                  { borderColor: theme.border, paddingHorizontal: scale(7) }
                ]}
              >
                <Text style={{ fontSize: scale(13), opacity: 0.5 }}>+😊</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {item.isMine && (
          item.avatar ? (
            <Image source={{ uri: item.avatar }} style={[styles.avatar, { backgroundColor: theme.border, marginRight: 0, marginLeft: scale(8) }]} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.primary, marginRight: 0, marginLeft: scale(8) }]}>
              <Text style={styles.avatarText}>{item.sender ? item.sender[0] : 'U'}</Text>
            </View>
          )
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundSecondary }]} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {/* Header */}
      <View style={{ overflow: 'hidden', backgroundColor: '#030b2e', zIndex: 10, elevation: 4 }}>
        <Image
          source={require('../../../assets/header_bg.png')}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: scale(140), opacity: 0.85 }}
          resizeMode="cover"
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: scale(14), paddingTop: insets.top + scale(10), paddingBottom: scale(14) }}>
          <TouchableOpacity
            onPress={() => setActiveGroup(null)}
            style={{ width: scale(36), height: scale(36), borderRadius: scale(18), backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' }}
          >
            <Ionicons name="arrow-back" size={scale(20)} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: scale(12) }}>
            <Text style={{ fontSize: scale(17), fontWeight: '700', color: '#fff', letterSpacing: 0.3 }} numberOfLines={1}>
              {groupObj?.name || 'Chat'}
            </Text>
            <Text style={{ fontSize: scale(11), color: 'rgba(255,255,255,0.7)', marginTop: scale(2), fontWeight: '500' }}>
              {currentMessages.length} Messages
            </Text>
          </View>
          {isStudentRole && !isPrivilegedRole && dailyMessageLimit > 0 ? (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: remainingMessages <= 3 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.15)',
              paddingHorizontal: scale(10),
              paddingVertical: scale(5),
              borderRadius: scale(14),
              gap: scale(3),
            }}>
              <Text style={{
                fontSize: scale(14),
                fontWeight: '800',
                color: remainingMessages <= 3 ? '#fca5a5' : '#fff',
              }}>
                {remainingMessages}
              </Text>
              <Text style={{
                fontSize: scale(9),
                fontWeight: '700',
                color: remainingMessages <= 3 ? '#fca5a5' : '#fff',
                opacity: 0.8,
              }}>
                Left
              </Text>
            </View>
          ) : (
            <View style={{ width: scale(32) }} />
          )}
        </View>
      </View>

      {/*
        ── FIX: KeyboardAvoidingView ─────────────────────────────────────────
        iOS   → behavior="padding"  pushes content up as keyboard rises
        Android → behavior="height"  shrinks the view; combined with
                  windowSoftInputMode="adjustResize" in AndroidManifest this
                  gives the most reliable result on all Android versions.
        keyboardVerticalOffset on iOS must equal the height of everything
        rendered ABOVE this KeyboardAvoidingView (header inside SafeAreaView).
        We use scale(48) as the header height; adjust if your header is taller.
      */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
        enabled={keyboardVisible}
      >
        <FlatList
          ref={flatListRef}
          data={currentMessages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbox-ellipses-outline" size={48} color={theme.textTertiary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No messages here yet.{"\n"}Start the conversation!
              </Text>
            </View>
          }
        />

        {/* ── Edit Bar (Only visible when editing a message) ──────────────── */}
        {editingMessageId && (
          <View style={[styles.editBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
            <View style={styles.editBarContent}>
              <Ionicons name="pencil" size={14} color={theme.primary} />
              <Text style={[styles.editBarText, { color: theme.textSecondary }]}>
                Editing message...
              </Text>
            </View>
            <TouchableOpacity onPress={() => {
              setEditingMessageId(null);
              setInputText('');
            }}>
              <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Input Bar ──────────────────────────────────────────────────────
            paddingBottom is dynamic:
            • keyboard visible  → 8px  (keyboard itself covers the bottom)
            • keyboard hidden   → insets.bottom + 4  (home indicator safe area)
            This prevents the double-gap that appeared before.
        */}
        {isStudentRole && !isPrivilegedRole && !messagingEnabled ? (
          <View style={[
            styles.inputContainer,
            {
              backgroundColor: theme.card,
              borderTopColor: theme.border,
              justifyContent: 'center',
              paddingVertical: scale(14),
              paddingBottom: inputBarPaddingBottom,
            }
          ]}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Ionicons name="lock-closed" size={16} color={theme.textTertiary} />
              <Text style={{ color: theme.textSecondary, fontSize: scale(12), marginTop: scale(4), fontWeight: '600', textAlign: 'center' }}>
                Messaging is currently disabled by admin
              </Text>
            </View>
          </View>
        ) : (
          <View style={[
            styles.inputContainer,
            {
              backgroundColor: theme.card,
              borderTopColor: theme.border,
              paddingBottom: inputBarPaddingBottom,
            }
          ]}>
            <View style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'flex-end',
              borderWidth: 1,
              borderRadius: scale(22),
              paddingHorizontal: scale(12),
              paddingVertical: scale(4),
              backgroundColor: theme.background,
              borderColor: theme.border,
            }}>
              <TouchableOpacity
                onPress={() => {
                  if (!showEmojiModal) {
                    Keyboard.dismiss();
                    setTimeout(() => setShowEmojiModal(true), 50);
                  } else {
                    setShowEmojiModal(false);
                  }
                }}
                style={{ padding: scale(6), marginRight: scale(4), marginBottom: scale(2) }}
              >
                <Ionicons name="happy-outline" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
              
              <TextInput
                style={{
                  flex: 1,
                  minHeight: scale(34),
                  maxHeight: scale(100),
                  fontSize: scale(15),
                  paddingVertical: scale(6),
                  paddingRight: scale(6),
                  color: theme.text,
                }}
                placeholder={editingMessageId ? 'Edit your message...' : (canStudentSend() ? 'Type your message...' : 'Daily limit reached')}
                placeholderTextColor={theme.textTertiary}
                value={inputText}
                onChangeText={setInputText}
                onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
                onFocus={() => setShowEmojiModal(false)}
                multiline
                maxLength={1000}
                editable={canStudentSend() || !!editingMessageId}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.sendBtn,
                { backgroundColor: inputText.trim() && (canStudentSend() || editingMessageId) ? theme.primary : theme.border }
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || (!canStudentSend() && !editingMessageId)}
            >
              <Ionicons name={editingMessageId ? "checkmark" : "send"} size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Custom Inline Emoji Keyboard ── */}
        {showEmojiModal && (
          <View style={{
            height: scale(250) + insets.bottom,
            backgroundColor: theme.card,
            paddingBottom: insets.bottom,
          }}>
            <ScrollView contentContainerStyle={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: scale(12),
              justifyContent: 'center',
              paddingHorizontal: scale(16),
              paddingBottom: scale(20),
            }}
            keyboardShouldPersistTaps="handled"
            >
              {EMOJI_LIST.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => handleInsertEmoji(emoji)}
                  style={{
                    width: scale(40),
                    height: scale(40),
                    borderRadius: scale(20),
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: scale(22) }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ── Custom Action Sheet Bottom Modal (Now Centered) ── */}
      <Modal
        visible={showActionSheet}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowActionSheet(false)}
      >
        <TouchableOpacity
          style={[styles.centeredBackdrop, { backgroundColor: 'transparent' }]}
          activeOpacity={1}
          onPress={() => setShowActionSheet(false)}
        >
          <View style={[styles.centeredActionCard, { backgroundColor: theme.card, position: 'relative', paddingTop: scale(16) }]}>
            {/* Top-Right Close Button */}
            <TouchableOpacity
              style={{ position: 'absolute', top: scale(8), right: scale(8), zIndex: 10, padding: scale(2) }}
              onPress={() => setShowActionSheet(false)}
            >
              <Ionicons name="close" size={18} color={theme.textTertiary} />
            </TouchableOpacity>

            <Text style={[styles.sheetTitle, { color: theme.textSecondary, marginBottom: scale(4), textAlign: 'center' }]}>
              Message Options
            </Text>

            <TouchableOpacity style={styles.sheetOption} onPress={handleCopy}>
              <Ionicons name="copy-outline" size={20} color={theme.text} />
              <Text style={[styles.sheetOptionText, { color: theme.text }]}>Copy Text</Text>
            </TouchableOpacity>

            {selectedMessage?.isMine && (
              <TouchableOpacity style={styles.sheetOption} onPress={handleStartEdit}>
                <Ionicons name="pencil-outline" size={20} color={theme.primary} />
                <Text style={[styles.sheetOptionText, { color: theme.text }]}>Edit Message</Text>
              </TouchableOpacity>
            )}

            {(selectedMessage?.isMine || isPrivilegedRole) && (
              <TouchableOpacity style={[styles.sheetOption, { borderBottomWidth: 0 }]} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={20} color={theme.error} />
                <Text style={[styles.sheetOptionText, { color: theme.error }]}>Delete Message</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Custom Delete Prompt Modal ── */}
      <Modal
        visible={showDeletePrompt}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeletePrompt(false)}
      >
        <TouchableOpacity
          style={[styles.centeredBackdrop, { backgroundColor: 'transparent' }]}
          activeOpacity={1}
          onPress={() => setShowDeletePrompt(false)}
        >
          <View style={[styles.centeredActionCard, { backgroundColor: theme.card, padding: scale(16), alignItems: 'center' }]}>
            <Text style={{ fontSize: scale(14), fontWeight: '700', color: theme.text, marginBottom: scale(4), textAlign: 'center' }}>
              Delete Message?
            </Text>
            <Text style={{ fontSize: scale(12), color: theme.textSecondary, marginBottom: scale(16), lineHeight: scale(16), textAlign: 'center' }}>
              This message will be permanently deleted.
            </Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'center', width: '100%', gap: scale(16) }}>
              <TouchableOpacity onPress={() => setShowDeletePrompt(false)}>
                <Text style={{ color: theme.textSecondary, fontWeight: '600', fontSize: scale(14) }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmDelete}>
                <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: scale(14) }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Custom Emoji Modal Removed (Now Inline) ── */}

      {/* ── Reaction Picker Modal ── */}
      <Modal
        visible={showReactionPicker}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowReactionPicker(false)}
      >
        <TouchableOpacity
          style={styles.reactionBackdrop}
          activeOpacity={1}
          onPress={() => setShowReactionPicker(false)}
        >
          <Animated.View
            style={[
              styles.reactionPickerContainer,
              {
                backgroundColor: theme.card,
                transform: [
                  { scale: reactionAnim },
                  { translateY: reactionAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }
                ],
                opacity: reactionAnim,
              }
            ]}
          >
            {/* Quick Reactions Row */}
            <View style={styles.quickReactionsRow}>
              {QUICK_REACTIONS.map((emoji) => {
                // Look up live message data for current reaction state
                const liveMsg = currentMessages.find((m: any) => m.id === reactionTargetMsg?.id);
                const reactors: { uid: string; name: string }[] =
                  (liveMsg?.reactions || reactionTargetMsg?.reactions || {})[emoji] || [];
                const myReacted = reactors.some(r => r.uid === user?.uid);
                // If user has reacted with a DIFFERENT emoji, show which one
                const myCurrentEmoji = Object.keys(
                  liveMsg?.reactions || reactionTargetMsg?.reactions || {}
                ).find(e =>
                  ((liveMsg?.reactions || reactionTargetMsg?.reactions || {})[e] || []).some(
                    (r: any) => r.uid === user?.uid
                  )
                );
                return (
                  <TouchableOpacity
                    key={emoji}
                    onPress={() => handleAddReaction(emoji)}
                    style={[
                      styles.quickReactionBtn,
                      myReacted && { backgroundColor: `${theme.primary}22`, borderWidth: 1.5, borderColor: theme.primary },
                      myCurrentEmoji && myCurrentEmoji !== emoji && { opacity: 0.45 },
                    ]}
                  >
                    <Text style={styles.quickReactionEmoji}>{emoji}</Text>
                    {reactors.length > 0 && (
                      <Text style={{ fontSize: scale(9), color: theme.textTertiary, marginTop: scale(2) }}>
                        {reactors.length}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Hint */}
            <View style={[styles.reactionDivider, { backgroundColor: theme.border }]} />
            <Text style={[styles.reactionLabel, { color: theme.textTertiary }]}>One reaction per message · Tap to change</Text>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* ── Reaction Names Modal — shows who reacted ── */}
      <Modal
        visible={!!reactionNamesModal}
        transparent
        animationType="fade"
        onRequestClose={() => setReactionNamesModal(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setReactionNamesModal(null)}
        >
          <View style={[styles.reactionNamesCard, { backgroundColor: theme.card }]}>
            {/* Header */}
            <View style={styles.reactionNamesHeader}>
              <Text style={styles.reactionNamesEmoji}>{reactionNamesModal?.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.reactionNamesTitle, { color: theme.text }]}>
                  {reactionNamesModal?.users.length} Reaction{(reactionNamesModal?.users.length || 0) > 1 ? 's' : ''}
                </Text>
                <Text style={[styles.reactionNamesSubtitle, { color: theme.textTertiary }]}>
                  Long-press pill to change or remove
                </Text>
              </View>
            </View>

            <View style={[styles.reactionNamesDivider, { backgroundColor: theme.border }]} />

            {/* People list */}
            {(reactionNamesModal?.users || []).map((u, i) => (
              <View key={u.uid} style={[
                styles.reactionNameRow,
                i < (reactionNamesModal!.users.length - 1) && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }
              ]}>
                <View style={[styles.reactionNameAvatar, { backgroundColor: theme.primary }]}>
                  <Text style={{ color: '#fff', fontSize: scale(14), fontWeight: '700' }}>
                    {u.name?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
                <Text style={[styles.reactionNameText, { color: theme.text }]}>{u.name}</Text>
                {u.uid === user?.uid && (
                  <View style={[styles.reactionYouBadge, { backgroundColor: `${theme.primary}18` }]}>
                    <Text style={{ fontSize: scale(9), color: theme.primary, fontWeight: '700' }}>YOU</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  headerNoticeStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 10,
  },
  backButtonNoticeStyle: {
    padding: scale(4),
  },
  headerTitleNoticeStyle: {
    fontSize: scale(18),
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  placeholderButton: {
    width: scale(36),
    height: scale(36),
  },
  contentContainerNoticeStyle: {
    flex: 1,
  },
  listContentNoticeStyle: {
    padding: scale(16),
    paddingBottom: scale(100),
  },

  // Professional Compact Group List Items
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: scale(16),
    justifyContent: 'space-between',
  },
  chatCard: {
    width: '48%',
    marginBottom: scale(16),
    borderRadius: scale(16),
    padding: scale(12),
    borderWidth: 1,
    alignItems: 'flex-start',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: scale(4) },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  chatRowAvatar: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatRowInfo: {
    flex: 1,
    marginLeft: scale(12),
    justifyContent: 'center',
  },
  chatRowTitle: {
    fontSize: scale(15),
    fontWeight: '700',
    marginBottom: scale(2),
    letterSpacing: -0.2,
  },
  chatRowMessage: {
    fontSize: scale(13),
    opacity: 0.7,
  },
  chatRowRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: scale(8),
    minWidth: scale(24),
  },
  sectionLabel: {
    fontSize: scale(11),
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: scale(8),
    marginTop: scale(4),
    paddingLeft: scale(4),
    opacity: 0.5,
  },
  blinkingBadge: {
    backgroundColor: '#10b981',
    minWidth: scale(22),
    height: scale(22),
    borderRadius: scale(11),
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: scale(5),
    marginRight: scale(6),
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  blinkingBadgeText: {
    color: '#fff',
    fontSize: scale(10),
    fontWeight: '800',
  },

  // Chat header
  chatHeaderInfoCenter: { flex: 1, alignItems: 'center' },
  chatHeaderSubtitleStyle: {
    fontSize: scale(11),
    marginTop: scale(2),
    fontWeight: '500',
    opacity: 0.5,
  },

  // Messages list
  messagesList: { padding: scale(16), paddingBottom: scale(16) },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: scale(100) },
  emptyText: { textAlign: 'center', marginTop: scale(12), fontSize: scale(15), lineHeight: 22 },

  // Message bubbles
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: scale(2), flexWrap: 'wrap' },
  msgLeft: { justifyContent: 'flex-start' },
  msgRight: { justifyContent: 'flex-end' },
  avatar: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(6),
    overflow: 'hidden',
  },
  avatarText: { color: '#fff', fontSize: scale(11), fontWeight: 'bold' },
  msgContentWrapper: { maxWidth: width * 0.75 },
  msgBubble: { paddingHorizontal: scale(12), paddingVertical: scale(8), borderRadius: scale(14) },
  msgSender: { fontSize: scale(11), fontWeight: '600', marginBottom: 0 },
  roleBadge: { paddingHorizontal: scale(5), paddingVertical: scale(1), borderRadius: scale(4) },
  roleBadgeText: { fontSize: scale(8), fontWeight: '800', letterSpacing: 0.4 },
  msgTime: { fontSize: scale(9), alignSelf: 'flex-end', marginTop: scale(2) },

  announcementBubble: {
    backgroundColor: '#fff3cd',
    padding: scale(14),
    borderRadius: scale(12),
    marginVertical: scale(16),
    borderWidth: 1,
    borderColor: '#ffe69c',
    alignSelf: 'center',
    width: '90%',
  },
  announcementLabel: { color: '#856404', fontSize: scale(12), fontWeight: '700', marginBottom: scale(6) },
  announcementText: { color: '#856404', fontSize: scale(14), lineHeight: 20 },
  announcementTime: { color: '#856404', fontSize: scale(10), alignSelf: 'flex-end', marginTop: scale(6), opacity: 0.7 },

  // ── FIX: Input container ──────────────────────────────────────────────
  // Removed the static paddingBottom that was conflicting with the dynamic
  // inset-aware value computed above. Top/side padding kept as-is.
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    paddingTop: scale(10),
    paddingHorizontal: scale(12),
    borderTopWidth: 1,
    // paddingBottom is applied inline dynamically via inputBarPaddingBottom
  },
  inputField: {
    flex: 1,
    minHeight: scale(40),
    maxHeight: scale(100),
    borderWidth: 1,
    borderRadius: scale(20),
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    paddingRight: scale(12),
    fontSize: scale(15),
  },
  sendBtn: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(10),
    marginBottom: scale(2),
  },
  // Edit Bar above input
  editBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderTopWidth: 1,
  },
  editBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  editBarText: {
    fontSize: scale(12),
    fontWeight: '500',
  },
  // Bottom Sheet Modal (Now Centered Action Card)
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  centeredBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredActionCard: {
    width: scale(200),
    borderRadius: scale(12),
    paddingTop: scale(12),
    paddingBottom: scale(6),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  bottomSheetContainer: {
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    paddingBottom: 20,
    paddingHorizontal: scale(20),
    paddingTop: scale(12),
  },
  sheetIndicator: {
    width: scale(36),
    height: scale(4),
    borderRadius: scale(2),
    alignSelf: 'center',
    marginBottom: scale(16),
  },
  sheetTitle: {
    fontSize: scale(12),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: scale(12),
    textAlign: 'center',
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  sheetOptionText: {
    fontSize: scale(14),
    fontWeight: '600',
    marginLeft: scale(8),
  },
  cancelOption: {
    borderBottomWidth: 0,
    marginTop: scale(8),
    justifyContent: 'center',
  },

  // ── Reaction Pills ──────────────────────────────────────────────────────
  reactionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(5),
    marginTop: scale(5),
    marginBottom: scale(4),
    paddingHorizontal: scale(4),
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scale(12),
    borderWidth: 1,
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    gap: scale(3),
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  reactionPillActive: {
    backgroundColor: 'rgba(99,102,241,0.1)',
  },
  reactionEmoji: { fontSize: scale(14) },
  reactionCount: { fontSize: scale(11), fontWeight: '700' },

  // ── Reaction Picker Modal ───────────────────────────────────────────────
  reactionBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionPickerContainer: {
    borderRadius: scale(20),
    paddingTop: scale(16),
    paddingBottom: scale(12),
    paddingHorizontal: scale(16),
    width: width * 0.82,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(8) },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
    alignItems: 'center',
  },
  quickReactionsRow: {
    flexDirection: 'row',
    gap: scale(8),
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: scale(4),
  },
  quickReactionBtn: {
    width: scale(46),
    height: scale(46),
    borderRadius: scale(23),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  quickReactionEmoji: { fontSize: scale(26) },
  reactionDivider: { height: scale(1), width: '80%', marginVertical: scale(12), opacity: 0.3 },
  reactionLabel: { fontSize: scale(10), fontWeight: '500', opacity: 0.6, textAlign: 'center' },

  // ── Reaction Names Modal ───────────────────────────────────────────────
  reactionNamesCard: {
    borderRadius: scale(20),
    marginHorizontal: scale(24),
    padding: scale(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(10) },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 14,
    maxHeight: '60%',
  },
  reactionNamesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    marginBottom: scale(10),
  },
  reactionNamesEmoji: { fontSize: scale(34) },
  reactionNamesTitle: { fontSize: scale(15), fontWeight: '700' },
  reactionNamesSubtitle: { fontSize: scale(10), marginTop: scale(2), opacity: 0.7 },
  reactionNamesDivider: { height: StyleSheet.hairlineWidth, marginBottom: scale(6) },
  reactionNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(10),
    gap: scale(10),
  },
  reactionNameAvatar: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionNameText: { flex: 1, fontSize: scale(14), fontWeight: '500' },
  reactionYouBadge: {
    paddingHorizontal: scale(6),
    paddingVertical: scale(3),
    borderRadius: scale(8),
  },

  // ── Custom Delete Prompt Modal ──────────────────────────────────────────
  deletePromptCard: {
    width: scale(260),
    borderRadius: scale(16),
    padding: scale(18),
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  deletePromptIconContainer: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(10),
  },
  deletePromptTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    marginBottom: scale(4),
    textAlign: 'center',
  },
  deletePromptMessage: {
    fontSize: scale(10.5),
    textAlign: 'center',
    lineHeight: scale(16),
    marginBottom: scale(18),
  },
  deletePromptButtons: {
    flexDirection: 'row',
    gap: scale(8),
    width: '100%',
  },
  deletePromptButton: {
    flex: 1,
    height: scale(36),
    borderRadius: scale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  deletePromptButtonText: {
    fontSize: scale(11),
    fontWeight: '700',
  },
});

// ── Messages Groups List Styles ────────────────────────────────────────────
const msgListStyles = StyleSheet.create({
  // ── Header Banner ──
  headerBanner: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: scale(200),
    overflow: 'hidden',
    backgroundColor: '#030b2e',
    zIndex: 0,
  },
  bannerBase: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#02093a',
  },
  bannerWatermark: {
    position: 'absolute',
    top: scale(5), left: scale(10),
    width: scale(140), height: scale(140),
    opacity: 0.07, tintColor: '#4a90ff',
  },
  bannerGlow4: {
    position: 'absolute',
    top: scale(-50), right: -width * 0.30,
    width: width * 1.0, height: width * 1.0,
    borderRadius: width * 0.5,
    backgroundColor: '#0d2fa0', opacity: 0.35,
  },
  bannerGlow3: {
    position: 'absolute',
    top: scale(-30), right: -width * 0.22,
    width: width * 0.80, height: width * 0.80,
    borderRadius: width * 0.40,
    backgroundColor: '#1649cc', opacity: 0.55,
  },
  bannerGlow2: {
    position: 'absolute',
    top: scale(-12), right: -width * 0.15,
    width: width * 0.62, height: width * 0.62,
    borderRadius: width * 0.31,
    backgroundColor: '#2563eb', opacity: 0.80,
  },
  bannerGlow1: {
    position: 'absolute',
    top: scale(6), right: -width * 0.08,
    width: width * 0.46, height: width * 0.46,
    borderRadius: width * 0.23,
    backgroundColor: '#60a5fa', opacity: 0.75,
  },
  bannerDot: {
    position: 'absolute',
    width: scale(3), height: scale(3),
    borderRadius: scale(1.5),
    backgroundColor: 'rgba(56,189,248,0.50)',
  },
  bannerPill: {
    position: 'absolute',
    width: scale(5), borderRadius: scale(3),
    backgroundColor: '#60a5fa',
    transform: [{ rotate: '-45deg' }],
  },
  bannerWaveLeft: {
    position: 'absolute',
    bottom: -width * 0.82, left: -width * 0.3,
    width: width * 1.0, height: width * 1.0,
    borderRadius: width * 0.5,
    backgroundColor: '#f1f5f9',
  },
  bannerWaveRight: {
    position: 'absolute',
    bottom: -width * 0.9, right: -width * 0.25,
    width: width * 0.9, height: width * 0.9,
    borderRadius: width * 0.45,
    backgroundColor: '#f1f5f9',
  },
  bannerWaveGlowLeft: {
    position: 'absolute',
    bottom: -width * 0.82 - scale(3), left: -width * 0.30 - scale(3),
    width: width * 1.0 + scale(6), height: width * 1.0 + scale(6),
    borderRadius: (width * 1.0 + scale(6)) / 2,
    borderWidth: scale(2), borderColor: 'rgba(59,130,246,0.7)',
    backgroundColor: 'transparent',
  },
  bannerWaveGlowRight: {
    position: 'absolute',
    bottom: -width * 0.9 - scale(3), right: -width * 0.25 - scale(3),
    width: width * 0.9 + scale(6), height: width * 0.9 + scale(6),
    borderRadius: (width * 0.9 + scale(6)) / 2,
    borderWidth: scale(2), borderColor: 'rgba(59,130,246,0.7)',
    backgroundColor: 'transparent',
  },
  // ── Header Row ──
  headerRow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: scale(14),
    paddingTop: scale(8), paddingBottom: scale(8),
    zIndex: 10,
  },
  headerBtn: {
    width: scale(36), height: scale(36),
    borderRadius: scale(18),
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerBellBtn: {
    width: scale(36), height: scale(36),
    borderRadius: scale(18),
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  headerTitle: {
    fontSize: scale(16), fontWeight: '700',
    color: '#fff', letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: scale(10), color: 'rgba(255,255,255,0.65)',
    fontWeight: '500', marginTop: scale(1),
  },
  bellBadge: {
    position: 'absolute',
    top: -scale(3), right: -scale(3),
    backgroundColor: '#ef4444',
    minWidth: scale(16), height: scale(16),
    borderRadius: scale(8),
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: scale(3),
  },
  bellBadgeText: { color: '#fff', fontSize: scale(9), fontWeight: '700' },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: scale(12), gap: scale(10),
  },
  sectionAccentBar: {
    width: scale(4), height: scale(32),
    borderRadius: scale(2),
  },
  sectionIconWrap: {
    width: scale(28), height: scale(28),
    borderRadius: scale(14),
    backgroundColor: 'rgba(233,30,140,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  sectionIconWrapBoy: {
    width: scale(28), height: scale(28),
    borderRadius: scale(14),
    backgroundColor: 'rgba(99,102,241,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  sectionTitleGirls: {
    fontSize: scale(14), fontWeight: '700',
    color: '#e91e8c',
  },
  sectionTitleBoys: {
    fontSize: scale(14), fontWeight: '700',
    color: '#6366f1',
  },
  sectionCount: {
    fontSize: scale(10), color: '#94a3b8',
    fontWeight: '500', marginTop: scale(1),
  },

  // ── Card Group (list container) ──
  cardGroup: {
    borderRadius: scale(16),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(3) },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 4,
  },

  // ── Full-width List Card ──
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(14),
    paddingRight: scale(14),
    borderLeftWidth: scale(3),
    borderLeftColor: 'transparent',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  listCardStrip: {
    width: scale(3),
    alignSelf: 'stretch',
    marginRight: scale(12),
    borderRadius: scale(2),
  },
  listCardAvatar: {
    width: scale(46), height: scale(46),
    borderRadius: scale(23),
    justifyContent: 'center', alignItems: 'center',
    marginRight: scale(12),
    position: 'relative',
  },
  avatarUnreadDot: {
    position: 'absolute',
    top: 0, right: 0,
    width: scale(11), height: scale(11),
    borderRadius: scale(5.5),
    borderWidth: 2, borderColor: '#fff',
  },
  listCardContent: {
    flex: 1,
    justifyContent: 'center',
    gap: scale(3),
  },
  listCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: scale(8),
  },
  listCardTitle: {
    fontSize: scale(14), fontWeight: '700',
    flex: 1,
  },
  unreadPill: {
    paddingHorizontal: scale(7), paddingVertical: scale(2),
    borderRadius: scale(10),
    minWidth: scale(22), alignItems: 'center',
  },
  unreadPillText: {
    color: '#fff', fontSize: scale(10), fontWeight: '700',
  },
  listCardPreview: {
    fontSize: scale(12), color: '#94a3b8',
    lineHeight: scale(17),
  },
  listCardPreviewSender: {
    fontWeight: '600',
  },

  // ── Legacy (kept for safety, unused) ──
  sectionLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(12) },
  card: {
    width: (width - scale(14) * 2 - scale(12)) / 2,
    borderRadius: scale(14), padding: scale(14),
    shadowColor: '#000', shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.04)',
  },
  cardUnread: { borderColor: '#e91e8c', borderWidth: 1.5 },
  cardUnreadBoy: { borderColor: '#6366f1', borderWidth: 1.5 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: scale(10) },
  cardAvatarGirl: { width: scale(40), height: scale(40), borderRadius: scale(20), backgroundColor: 'rgba(233,30,140,0.1)', justifyContent: 'center', alignItems: 'center' },
  cardAvatarBoy: { width: scale(40), height: scale(40), borderRadius: scale(20), backgroundColor: 'rgba(99,102,241,0.1)', justifyContent: 'center', alignItems: 'center' },
  badge: { minWidth: scale(22), height: scale(22), borderRadius: scale(11), justifyContent: 'center', alignItems: 'center', paddingHorizontal: scale(5) },
  badgeText: { fontSize: scale(10), fontWeight: '700' },
  cardTitle: { fontSize: scale(13), fontWeight: '700', marginBottom: scale(4), lineHeight: scale(18) },
  cardPreview: { fontSize: scale(11), color: '#94a3b8', lineHeight: scale(15) },
  cardPreviewSender: { fontWeight: '700', color: '#64748b' },
});



