import { scale } from '../../utils/responsive';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../api/firebaseConfig';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors = { currentPassword: '', newPassword: '', confirmPassword: '' };

    if (!currentPassword) {
      newErrors.currentPassword = 'Required';
      isValid = false;
    }

    if (!newPassword) {
      newErrors.newPassword = 'Required';
      isValid = false;
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Min 6 characters';
      isValid = false;
    } else if (newPassword === currentPassword) {
      newErrors.newPassword = 'Must be different';
      isValid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Required';
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Does not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleUpdatePassword = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        Alert.alert('Error', 'No user logged in');
        return;
      }

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      try {
        await reauthenticateWithCredential(user, credential);
      } catch (verifyError) {
        setErrors({ ...errors, currentPassword: 'Incorrect password' });
        setLoading(false);
        return;
      }

      await updatePassword(user, newPassword);

      try {
        const staffQuery = query(collection(db, 'staff'), where('uid', '==', user.uid));
        const staffSnap = await getDocs(staffQuery);
        if (!staffSnap.empty) {
          const staffDoc = staffSnap.docs[0];
          await updateDoc(doc(db, 'staff', staffDoc.id), { password: newPassword });
        }
      } catch (staffError) {
        console.error('Failed to update password in staff collection:', staffError);
      }

      Alert.alert('Success', 'Password updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Error updating password:', error);
      Alert.alert('Error', error.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    setValue: (val: string) => void,
    show: boolean,
    setShow: (val: boolean) => void,
    error: string,
    placeholder: string
  ) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View style={[
        styles.inputWrapper,
        { backgroundColor: isDark ? theme.card : '#fff', borderColor: error ? '#ef4444' : theme.border }
      ]}>
        <Ionicons name="lock-closed-outline" size={18} color={theme.textTertiary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          value={value}
          onChangeText={(text) => {
            setValue(text);
            setErrors({ ...errors, [label.toLowerCase().includes('current') ? 'currentPassword' : label.toLowerCase().includes('confirm') ? 'confirmPassword' : 'newPassword']: '' });
          }}
          secureTextEntry={!show}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.eyeButton} onPress={() => setShow(!show)}>
          <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={20} color={theme.textTertiary} />
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: StatusBar.currentHeight || 0 }]}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: StatusBar.currentHeight || 0, backgroundColor: theme.primary, zIndex: 999 }} />
      <StatusBar barStyle="light-content" backgroundColor={isDark ? theme.card : theme.primary} translucent={false} />
      {/* Compact Header matching SettingsScreen */}
      <View style={[styles.header, { backgroundColor: theme.primary, borderBottomColor: 'transparent' }]}>
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
        <Text style={[styles.headerTitle, { color: '#fff' }]}>Change Password</Text>
        <View style={{ width: scale(36) }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior="height"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.infoCard, { backgroundColor: isDark ? theme.card : '#f8fafc', borderColor: theme.border }]}>
            <Ionicons name="shield-checkmark" size={24} color={theme.primary} style={{ marginBottom: scale(8) }} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              Secure your account by choosing a strong password. It must be at least 6 characters long and different from your current one.
            </Text>
          </View>

          {renderInput('Current Password', currentPassword, setCurrentPassword, showCurrent, setShowCurrent, errors.currentPassword, 'Enter current password')}
          {renderInput('New Password', newPassword, setNewPassword, showNew, setShowNew, errors.newPassword, 'Enter new password')}
          {renderInput('Confirm Password', confirmPassword, setConfirmPassword, showConfirm, setShowConfirm, errors.confirmPassword, 'Confirm new password')}

          <TouchableOpacity
            style={[styles.updateButton, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]}
            onPress={handleUpdatePassword}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#fff" style={{ marginRight: scale(8) }} />
                <Text style={styles.updateButtonText}>Update Password</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 0,
  },
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
    fontSize: scale(18),
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: scale(16),
    paddingBottom: scale(40),
  },
  infoCard: {
    padding: scale(16),
    borderRadius: scale(12),
    borderWidth: 1,
    marginBottom: scale(24),
  },
  infoText: {
    fontSize: scale(13),
    lineHeight: 20,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: scale(16),
  },
  label: {
    fontSize: scale(13),
    fontWeight: '600',
    marginBottom: scale(6),
    marginLeft: scale(4),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: scale(12),
    height: scale(50),
    paddingHorizontal: scale(12),
  },
  inputIcon: {
    marginRight: scale(8),
  },
  input: {
    flex: 1,
    fontSize: scale(14),
    fontWeight: '500',
  },
  eyeButton: {
    padding: scale(4),
  },
  errorText: {
    color: '#ef4444',
    fontSize: scale(12),
    marginTop: scale(4),
    marginLeft: scale(4),
    fontWeight: '500',
  },
  updateButton: {
    flexDirection: 'row',
    height: scale(50),
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scale(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(2) },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: scale(15),
    fontWeight: '700',
  },
});

export default ChangePasswordScreen;

