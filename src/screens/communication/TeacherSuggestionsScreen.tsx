import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale } from '../../utils/responsive';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../api/firebaseConfig';
import { useAppSelector } from '../../store/hooks';

export const TeacherSuggestionsScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  
  const profileData = useAppSelector(s => s.auth.profile);
  const user = useAppSelector(s => s.auth.user);

  const [title, setTitle] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !suggestion.trim()) {
      Alert.alert('Incomplete', 'Please fill in both the title and your suggestion.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'suggestions'), {
        title: title.trim(),
        suggestion: suggestion.trim(),
        teacherId: user?.uid || 'unknown',
        teacherName: profileData?.fullname || user?.displayName || 'Unknown Teacher',
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      
      Alert.alert(
        'Thank You!',
        'Your suggestion has been successfully submitted to the management.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.log('Error submitting suggestion:', error);
      Alert.alert('Error', 'Could not submit your suggestion. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? theme.background : '#f8fafc' }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={scale(24)} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Submit Suggestion</Text>
        <View style={{ width: scale(40) }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, padding: scale(16), paddingBottom: insets.bottom + scale(20) }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.infoBox}>
            <Ionicons name="bulb" size={scale(24)} color="#f59e0b" style={{ marginRight: scale(12) }} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              Have an idea to improve the app? Or a suggestion for management? We'd love to hear it!
            </Text>
          </View>

          <Text style={[styles.inputLabel, { color: theme.text }]}>Subject / Title</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
            placeholder="E.g., Add a new attendance report feature"
            placeholderTextColor={theme.textSecondary + '80'}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          <Text style={[styles.inputLabel, { color: theme.text, marginTop: scale(16) }]}>Detailed Suggestion</Text>
          <View style={{ flex: 1 }}>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border, flex: 1 }]}
              placeholder="Explain your suggestion in detail..."
              placeholderTextColor={theme.textSecondary + '80'}
              value={suggestion}
              onChangeText={setSuggestion}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={{ height: scale(20) }} />
        </ScrollView>

        {/* ── Fixed Footer: Submit Button pinned to keyboard edge ── */}
        <View style={{ padding: scale(16), borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.1)', backgroundColor: theme.card }}>
          <TouchableOpacity 
            style={[styles.submitButton, (isSubmitting || !title.trim() || !suggestion.trim()) && { opacity: 0.7 }]} 
            onPress={handleSubmit}
            disabled={isSubmitting || !title.trim() || !suggestion.trim()}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Submit to Management</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(10),
    paddingVertical: scale(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  backButton: {
    padding: scale(8),
    width: scale(40),
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: scale(18),
    fontWeight: '700',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: scale(16),
    borderRadius: scale(12),
    marginBottom: scale(24),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  infoText: {
    flex: 1,
    fontSize: scale(14),
    lineHeight: scale(20),
  },
  inputLabel: {
    fontSize: scale(14),
    fontWeight: '600',
    marginBottom: scale(8),
    marginLeft: scale(4),
  },
  input: {
    borderWidth: 1,
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
    fontSize: scale(15),
  },
  textArea: {
    borderWidth: 1,
    borderRadius: scale(12),
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
    fontSize: scale(15),
    minHeight: scale(150),
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: scale(12),
    paddingVertical: scale(16),
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: scale(16),
    fontWeight: '700',
  },
});
