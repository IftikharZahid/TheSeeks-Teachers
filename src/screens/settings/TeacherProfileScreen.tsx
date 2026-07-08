import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Modal, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setProfile } from '../../store/slices/authSlice';
import { enqueueAction } from '../../store/slices/syncSlice';
import { processSyncQueue } from '../../store/syncManager';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { TextInput } from 'react-native';
import { scale } from '../../utils/responsive';
import { TeacherProfileBanner } from '../../components/TeacherProfileBanner';
import { signOut } from 'firebase/auth';
import { auth } from '../../api/firebaseConfig';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [logoutModalVisible, setLogoutModalVisible] = React.useState(false);
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const dispatch = useAppDispatch();
  const [editModalVisible, setEditModalVisible] = React.useState(false);
  const [editName, setEditName] = React.useState('');
  const [editPhone, setEditPhone] = React.useState('');
  const [editQualification, setEditQualification] = React.useState('');
  const [editExperience, setEditExperience] = React.useState('');
  const [editImage, setEditImage] = React.useState<string | null>(null);

  const openEditModal = () => {
    setEditName(displayName);
    setEditPhone(displayPhone !== 'N/A' ? displayPhone : '');
    setEditQualification(displayQualification !== 'N/A' ? displayQualification : '');
    setEditExperience(displayExperience !== 'N/A' ? displayExperience : '');
    setEditImage(displayImage);
    setEditModalVisible(true);
  };

  const pickImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        // Convert to base64 so we can upload it to Firestore
        const base64Data = await FileSystem.readAsStringAsync(fileUri, { encoding: 'base64' });
        const mimeType = result.assets[0].mimeType || 'image/jpeg';
        const imageStr = `data:${mimeType};base64,${base64Data}`;
        setEditImage(imageStr);
      }
    } catch (e) {
      console.warn('Image pick error:', e);
    }
  };

  const saveProfile = async () => {
    setEditModalVisible(false);
    if (!profileData) return;

    // Create an optimistic profile
    const updatedProfile = {
      ...profileData,
      fullname: editName.trim() || profileData.fullname,
      name: editName.trim() || profileData.fullname,
      phone: editPhone.trim(),
      qualification: editQualification.trim(),
      experience: editExperience.trim(),
      image: editImage || profileData.image,
    };

    // 1. Instantly update UI and Redux
    dispatch(setProfile(updatedProfile));

    // 2. Queue for Firebase (include the image now, since it's base64)
    const payloadForSync = {
      ...updatedProfile,
    };

    dispatch(enqueueAction({
      id: `update_profile_${Date.now()}`,
      actionType: 'UPDATE_PROFILE',
      payload: { uid: profileData.uid || profileData.id, payload: payloadForSync },
      timestamp: Date.now(),
    }));

    // @ts-ignore
    dispatch(processSyncQueue());

    Alert.alert('Success', 'Profile updated successfully.');
  };

  
  const profileData = useAppSelector((s: any) => s.auth.profile);
  const user = useAppSelector((s: any) => s.auth.user);
  const teachersList = useAppSelector((s: any) => s.teachers?.list || []);

  const currentTeacher = React.useMemo(() => {
    if (!profileData) return null;
    return teachersList.find((t: any) => t.id === profileData.uid || t.id === profileData.id || (t.email && profileData.email && t.email === profileData.email) || (t.name && profileData.fullname && t.name === profileData.fullname)) || profileData;
  }, [profileData, teachersList]);

  const displayName = profileData?.fullname || currentTeacher?.name || currentTeacher?.fullname || user?.displayName || 'Teacher';
  const displayEmail = profileData?.email || currentTeacher?.email || user?.email || 'N/A';
  const displayRole = profileData?.role || currentTeacher?.role ? (profileData?.role || currentTeacher.role).charAt(0).toUpperCase() + (profileData?.role || currentTeacher.role).slice(1) : 'Teacher';
  
  const displaySubject = profileData?.subject || ((currentTeacher?.subjects && currentTeacher.subjects.length > 0) ? currentTeacher.subjects.join(', ') : (currentTeacher?.subject ? currentTeacher.subject.split(',').map((s: string) => s.trim()).filter(Boolean).join(', ') : 'N/A'));
  const displayQualification = profileData?.qualification || currentTeacher?.qualification || 'N/A';
  const displayExperience = profileData?.experience || currentTeacher?.experience || 'N/A';
  const displayPhone = profileData?.phone || currentTeacher?.phone || 'N/A';
  const displayImage = profileData?.image?.trim() ? profileData.image : currentTeacher?.image?.trim() ? currentTeacher.image : user?.photoURL?.trim() ? user.photoURL : null;

  const confirmLogout = async () => {
    setLogoutModalVisible(false);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: StatusBar.currentHeight || 0 }]}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: StatusBar.currentHeight || 0, backgroundColor: theme.primary, zIndex: 999 }} />
      <StatusBar barStyle="light-content" backgroundColor={isDark ? theme.card : theme.primary} translucent={false} />
      
      {/* Fixed Header (Transparent, Absolute) */}
      <View style={[styles.header, { 
        position: 'absolute', 
        top: StatusBar.currentHeight || 0, 
        left: 0, 
        right: 0, 
        backgroundColor: 'transparent', 
        borderBottomColor: 'transparent', 
        paddingTop: scale(10),
        paddingBottom: scale(10),
        paddingHorizontal: scale(10), 
        zIndex: 100 
      }]}>
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
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={scale(22)} color="#ffffff" />
      </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#fff' }]} numberOfLines={1} adjustsFontSizeToFit>My Profile</Text>
        <View style={{ flexDirection: 'row', gap: scale(8) }}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]} onPress={openEditModal}>
            <Ionicons name="pencil" size={scale(18)} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]} onPress={() => setLogoutModalVisible(true)}>
            <Ionicons name="log-out-outline" size={scale(20)} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card & Header */}
        <TeacherProfileBanner />
          <View style={styles.avatarSection}>
          <View style={[styles.avatarContainer, { borderColor: theme.background }]}>
            <Image
              source={displayImage ? { uri: displayImage } : require('../../../assets/icon.png')}
              style={styles.avatar}
              defaultSource={require('../../../assets/icon.png')}
            />
          </View>
          <Text style={[styles.name, { color: theme.text }]}>{displayName}</Text>
          <View style={[styles.roleBadge, { backgroundColor: theme.primary + '15' }]}>
            <Text style={[styles.roleText, { color: theme.primary }]}>{displayRole}</Text>
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PROFESSIONAL DETAILS</Text>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <InfoRow icon="school-outline" iconColor="#0284c7" label="Subject" value={displaySubject} theme={theme} />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <InfoRow icon="ribbon-outline" iconColor="#db2777" label="Qualification" value={displayQualification} theme={theme} />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <InfoRow icon="calendar-outline" iconColor="#7c3aed" label="Experience" value={displayExperience} theme={theme} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>CONTACT INFO</Text>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <InfoRow icon="mail-outline" iconColor="#059669" label="Email" value={displayEmail} theme={theme} />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <InfoRow icon="call-outline" iconColor="#ea580c" label="Phone" value={displayPhone} theme={theme} />
          </View>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Log Out</Text>
            <Text style={[styles.modalMessage, { color: theme.textSecondary }]}>
              Are you sure you want to log out?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => setLogoutModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#ef4444' }]}
                onPress={confirmLogout}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, width: '90%', maxWidth: scale(340) }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</Text>
            <ScrollView style={{ width: '100%', maxHeight: scale(400) }} showsVerticalScrollIndicator={false}>
              
              <TouchableOpacity onPress={pickImage} style={{ alignSelf: 'center', marginVertical: scale(10) }}>
                <Image
                  source={editImage ? { uri: editImage } : require('../../../assets/icon.png')}
                  style={{ width: scale(80), height: scale(80), borderRadius: scale(40), backgroundColor: '#eee' }}
                />
                <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.primary, borderRadius: scale(12), padding: scale(4) }}>
                  <Ionicons name="camera" size={scale(16)} color="#fff" />
                </View>
              </TouchableOpacity>

              <Text style={{ color: theme.textSecondary, fontSize: scale(12), marginBottom: scale(4) }}>Full Name</Text>
              <TextInput
                style={{ backgroundColor: theme.backgroundSecondary, color: theme.text, borderRadius: scale(8), padding: scale(10), marginBottom: scale(12) }}
                value={editName}
                onChangeText={setEditName}
                placeholder="Full Name"
                placeholderTextColor={theme.textTertiary}
              />

              <Text style={{ color: theme.textSecondary, fontSize: scale(12), marginBottom: scale(4) }}>Phone Number</Text>
              <TextInput
                style={{ backgroundColor: theme.backgroundSecondary, color: theme.text, borderRadius: scale(8), padding: scale(10), marginBottom: scale(12) }}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Phone Number"
                keyboardType="phone-pad"
                placeholderTextColor={theme.textTertiary}
              />

              <Text style={{ color: theme.textSecondary, fontSize: scale(12), marginBottom: scale(4) }}>Qualification</Text>
              <TextInput
                style={{ backgroundColor: theme.backgroundSecondary, color: theme.text, borderRadius: scale(8), padding: scale(10), marginBottom: scale(12) }}
                value={editQualification}
                onChangeText={setEditQualification}
                placeholder="e.g., M.Sc Mathematics"
                placeholderTextColor={theme.textTertiary}
              />

              <Text style={{ color: theme.textSecondary, fontSize: scale(12), marginBottom: scale(4) }}>Experience</Text>
              <TextInput
                style={{ backgroundColor: theme.backgroundSecondary, color: theme.text, borderRadius: scale(8), padding: scale(10), marginBottom: scale(20) }}
                value={editExperience}
                onChangeText={setEditExperience}
                placeholder="e.g., 5 Years"
                placeholderTextColor={theme.textTertiary}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => setEditModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={saveProfile}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const InfoRow = ({ icon, iconColor, label, value, theme }: any) => (
  <View style={styles.infoRow}>
    <View style={[styles.iconWrap, { backgroundColor: iconColor + '15' }]}>
      <Ionicons name={icon} size={scale(16)} color={iconColor} />
    </View>
    <View style={styles.infoTexts}>
      <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: StatusBar.currentHeight || 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    borderBottomWidth: 1,
  },
  backButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: scale(16),
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  scrollContent: { paddingBottom: scale(40) },
  avatarSection: {
    alignItems: 'center',
    marginTop: -scale(80),
    paddingBottom: scale(16),
    zIndex: 10,
  },
  avatarContainer: {
    width: scale(110),
    height: scale(110),
    borderRadius: scale(55),
    borderWidth: 4,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  avatar: { width: '100%', height: '100%' },
  name: {
    fontSize: scale(20),
    fontWeight: '800',
    marginTop: scale(12),
    letterSpacing: -0.5,
  },
  roleBadge: {
    marginTop: scale(6),
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(12),
  },
  roleText: {
    fontSize: scale(11),
    fontWeight: '700',
  },
  section: {
    marginTop: scale(20),
    paddingHorizontal: scale(16),
  },
  sectionTitle: {
    fontSize: scale(11),
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: scale(8),
    marginLeft: scale(4),
  },
  card: {
    borderRadius: scale(14),
    borderWidth: 1,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(14),
    gap: scale(12),
  },
  iconWrap: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTexts: { flex: 1 },
  infoLabel: { fontSize: scale(11), fontWeight: '500', marginBottom: scale(2) },
  infoValue: { fontSize: scale(13), fontWeight: '700' },
  divider: { height: scale(1), marginLeft: scale(62) },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(20),
  },
  modalContent: {
    width: '100%',
    maxWidth: scale(280),
    borderRadius: scale(16),
    padding: scale(20),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: scale(18),
    fontWeight: '700',
    marginBottom: scale(8),
  },
  modalMessage: {
    fontSize: scale(14),
    textAlign: 'center',
    marginBottom: scale(20),
  },
  modalActions: {
    flexDirection: 'row',
    gap: scale(10),
    width: '100%',
  },
  modalButton: {
    flex: 1,
    height: scale(44),
    borderRadius: scale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: scale(14),
    fontWeight: '600',
  },
});
