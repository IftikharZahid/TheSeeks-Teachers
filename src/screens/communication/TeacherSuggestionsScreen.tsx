import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StatusBar, Keyboard } from 'react-native';
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
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleSubmit = async () => {
    Keyboard.dismiss();
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
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? theme.background : '#F3F4F6' }]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? theme.background : '#F3F4F6'} />
      
      {/* Modern Header */}
      <View style={[styles.header, { backgroundColor: isDark ? theme.card : '#ffffff' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <View style={[styles.iconCircle, { backgroundColor: isDark ? '#334155' : '#F3F4F6' }]}>
            <Ionicons name="chevron-back" size={scale(24)} color={theme.text} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Submit Suggestion</Text>
        <View style={{ width: scale(40) }} />
      </View>

        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior="padding"
          keyboardVerticalOffset={scale(20)}
        >
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, padding: scale(16) }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Info Card */}
            <View style={[styles.infoCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff', padding: scale(16), marginBottom: scale(16) }]}>
              <View style={[styles.infoIconContainer, { padding: scale(8), marginRight: scale(12), borderRadius: scale(12) }]}>
                <Ionicons name="bulb" size={scale(24)} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoTitle, { color: theme.text, fontSize: scale(15) }]}>Share Your Ideas</Text>
                <Text style={[styles.infoText, { color: theme.textSecondary, fontSize: scale(12) }]}>
                  Have an idea to improve the app? We'd love to hear it!
                </Text>
              </View>
            </View>

            {/* Form Area */}
            <View style={[styles.formContainer, { backgroundColor: isDark ? theme.card : '#ffffff', padding: scale(16) }]}>
              <Text style={[styles.inputLabel, { color: theme.text, fontSize: scale(13) }]}>Subject / Title</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: isDark ? '#334155' : '#F9FAFB', 
                    color: theme.text,
                    borderColor: focusedInput === 'title' ? theme.primary : (isDark ? '#475569' : '#E5E7EB'),
                    paddingVertical: scale(12),
                    paddingHorizontal: scale(14),
                    fontSize: scale(14)
                  }
                ]}
                placeholder="E.g., Add a new feature"
                placeholderTextColor={theme.textSecondary}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
                onFocus={() => setFocusedInput('title')}
                onBlur={() => setFocusedInput(null)}
              />

              <Text style={[styles.inputLabel, { color: theme.text, marginTop: scale(16), fontSize: scale(13) }]}>Detailed Suggestion</Text>
              <TextInput
                style={[
                  styles.textArea, 
                  { 
                    backgroundColor: isDark ? '#334155' : '#F9FAFB', 
                    color: theme.text,
                    borderColor: focusedInput === 'suggestion' ? theme.primary : (isDark ? '#475569' : '#E5E7EB'),
                    paddingVertical: scale(14),
                    paddingHorizontal: scale(14),
                    fontSize: scale(14),
                    minHeight: scale(140)
                  }
                ]}
                placeholder="Explain your suggestion in detail..."
                placeholderTextColor={theme.textSecondary}
                value={suggestion}
                onChangeText={setSuggestion}
                multiline
                scrollEnabled={false}
                textAlignVertical="top"
                onFocus={() => setFocusedInput('suggestion')}
                onBlur={() => setFocusedInput(null)}
              />

              {/* Submit Button */}
              <TouchableOpacity 
                style={[
                  styles.submitButton, 
                  { backgroundColor: theme.primary, paddingVertical: scale(14), marginTop: scale(24) },
                  (isSubmitting || !title.trim() || !suggestion.trim()) && { opacity: 0.5 }
                ]} 
                onPress={handleSubmit}
                disabled={isSubmitting || !title.trim() || !suggestion.trim()}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <View style={styles.submitButtonContent}>
                    <Ionicons name="paper-plane" size={scale(18)} color="#fff" style={{ marginRight: scale(8) }} />
                    <Text style={[styles.submitButtonText, { fontSize: scale(15) }]}>Submit Suggestion</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    paddingHorizontal: scale(16),
    paddingVertical: scale(16),
    borderBottomLeftRadius: scale(24),
    borderBottomRightRadius: scale(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  backButton: {
    width: scale(40),
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: scale(18),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  infoCard: {
    flexDirection: 'row',
    padding: scale(20),
    borderRadius: scale(20),
    marginBottom: scale(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'flex-start',
  },
  infoIconContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: scale(12),
    borderRadius: scale(16),
    marginRight: scale(16),
  },
  infoTitle: {
    fontSize: scale(16),
    fontWeight: '700',
    marginBottom: scale(4),
  },
  infoText: {
    fontSize: scale(13),
    lineHeight: scale(20),
    opacity: 0.9,
  },
  formContainer: {
    padding: scale(20),
    borderRadius: scale(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  inputLabel: {
    fontSize: scale(14),
    fontWeight: '700',
    marginBottom: scale(8),
    marginLeft: scale(4),
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: scale(16),
    paddingHorizontal: scale(16),
    paddingVertical: scale(16),
    fontSize: scale(15),
  },
  textArea: {
    borderWidth: 1.5,
    borderRadius: scale(16),
    paddingHorizontal: scale(16),
    paddingVertical: scale(16),
    fontSize: scale(15),
    minHeight: scale(180),
  },
  submitButton: {
    borderRadius: scale(16),
    paddingVertical: scale(18),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: scale(16),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
