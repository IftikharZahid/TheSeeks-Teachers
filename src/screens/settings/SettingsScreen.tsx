import { scale } from '../../utils/responsive';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useTheme } from '../../context/ThemeContext';
import { signOut } from "firebase/auth";
import { auth } from "../../api/firebaseConfig";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface SettingItemProps {
  icon: string;
  iconColor: string;
  title: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  iconColor,
  title,
  onPress,
  rightElement,
  showChevron = true
}) => {
  const { theme } = useTheme();

  const Content = (
    <View style={styles.settingRow}>
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <Text style={[styles.settingText, { color: theme.text }]}>{title}</Text>
      {rightElement || (showChevron && (
        <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
      ))}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {Content}
      </TouchableOpacity>
    );
  }
  return Content;
};

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme, isDark, toggleTheme } = useTheme();

  const ADMIN_EMAILS = ['theseeksacademyfta@gmail.com', 'iftikharzahid@outlook.com'];
  const currentUserEmail = auth.currentUser?.email?.toLowerCase() || '';
  const isAdmin = ADMIN_EMAILS.includes(currentUserEmail);

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [comingSoonModalVisible, setComingSoonModalVisible] = useState(false);

  const confirmLogout = async () => {
    setLogoutModalVisible(false);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };



  const accountItems = [
    { icon: 'person', color: '#3b82f6', title: 'Personal Information' },
    { icon: 'key', color: '#8b5cf6', title: 'Change Password' },
    { icon: 'finger-print', color: '#10b981', title: 'Biometric Login' },
  ];

  const notificationItems = [
    { icon: 'notifications', color: '#f59e0b', title: 'Push Notifications' },
    { icon: 'mail', color: '#0ea5e9', title: 'Email Alerts' },
  ];

  const preferenceItems = [
    { icon: 'language', color: '#8b5cf6', title: 'App Language' },
    { icon: 'server', color: '#64748b', title: 'Data & Storage' },
    { icon: 'help-circle', color: '#f59e0b', title: 'Help Center', screen: 'HelpCenterScreen' },
    { icon: 'shield-checkmark', color: '#10b981', title: 'Privacy Policy', screen: 'PrivacyPolicyScreen' },
    { icon: 'information-circle', color: '#6366f1', title: 'About App', screen: 'AboutScreen' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Compact Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.backgroundSecondary }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={18} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.backgroundSecondary }]}
          onPress={() => setLogoutModalVisible(true)}
        >
          <Ionicons name="log-out-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >



        {/* Account & Security Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>ACCOUNT & SECURITY</Text>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {accountItems.map((item, index) => (
              <React.Fragment key={item.title}>
                {index > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                <SettingItem
                  icon={item.icon}
                  iconColor={item.color}
                  title={item.title}
                  onPress={() => setComingSoonModalVisible(true)}
                />
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>NOTIFICATIONS</Text>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {notificationItems.map((item, index) => (
              <React.Fragment key={item.title}>
                {index > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                <SettingItem
                  icon={item.icon}
                  iconColor={item.color}
                  title={item.title}
                  onPress={() => setComingSoonModalVisible(true)}
                />
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PREFERENCES</Text>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {preferenceItems.map((item, index) => (
              <React.Fragment key={item.title}>
                {index > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                <SettingItem
                  icon={item.icon}
                  iconColor={item.color}
                  title={item.title}
                  onPress={item.screen ? () => navigation.navigate(item.screen as never) : () => setComingSoonModalVisible(true)}
                />
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Admin Panel Removed */}


        <View style={{ height: scale(24) }} />
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

      {/* Coming Soon Modal */}
      <Modal
        visible={comingSoonModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setComingSoonModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: '#f3f4f6' }]}>
              <Ionicons name="time" size={32} color="#6b7280" />
            </View>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Coming Soon</Text>
            <Text style={[styles.modalMessage, { color: theme.textSecondary }]}>
              This feature will be available in the next update!
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={() => setComingSoonModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Okay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: scale(16),
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: scale(16),
  },
  section: {
    marginTop: scale(16),
    paddingHorizontal: scale(12),
  },
  sectionTitle: {
    fontSize: scale(11),
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: scale(8),
    marginLeft: scale(4),
  },
  card: {
    borderRadius: scale(14),
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: scale(11),
  },
  iconContainer: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  settingText: {
    flex: 1,
    fontSize: scale(14),
    fontWeight: '500',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  valueText: {
    fontSize: scale(13),
    fontWeight: '500',
  },
  divider: {
    height: scale(1),
    marginLeft: scale(56),
  },
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: scale(11),
  },
  adminIconGradient: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
  },
  adminTextContainer: {
    flex: 1,
  },
  adminTitle: {
    fontSize: scale(14),
    fontWeight: '600',
  },
  adminSubtitle: {
    fontSize: scale(11),
    marginTop: scale(1),
  },
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
  modalIconContainer: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(16),
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
