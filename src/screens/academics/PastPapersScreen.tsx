import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { scale } from '../../utils/responsive';

export const PastPapersScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: StatusBar.currentHeight || 0 }]}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: StatusBar.currentHeight || 0, backgroundColor: theme.primary, zIndex: 999 }} />
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

      {/* ── Header ── */}
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
        onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('LibraryScreen' as any)}
      >
        <Ionicons name="arrow-back" size={scale(22)} color={isDark ? theme.text : '#ffffff'} />
      </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: isDark ? theme.text : '#fff' }]}>Past Papers</Text>
          <Text style={[styles.headerSub, { color: isDark ? theme.textSecondary : 'rgba(255,255,255,0.8)' }]}>Coming soon</Text>
        </View>
      </View>

      {/* ── Content ── */}
      <View style={styles.empty}>
        <View style={[styles.emptyIconWrap, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
          <Ionicons name="construct-outline" size={scale(40)} color={theme.placeholder} />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>Work in Progress</Text>
        <Text style={[styles.emptySub, { color: theme.placeholder }]}>
          The Past Papers section is currently under development. Please check back later.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 0,
  },
  header: { borderBottomLeftRadius: scale(24), borderBottomRightRadius: scale(24),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
    borderBottomWidth: 1,
  },
  headerBtn: {
    marginRight: scale(14),
  },
  headerTitle: {
    fontSize: scale(18),
    fontWeight: '700',
  },
  headerSub: {
    fontSize: scale(12),
    marginTop: scale(2),
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(40),
  },
  emptyIconWrap: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(16),
  },
  emptyTitle: {
    fontSize: scale(16),
    fontWeight: '600',
    marginBottom: scale(8),
  },
  emptySub: {
    fontSize: scale(13),
    textAlign: 'center',
    lineHeight: scale(20),
  },
});
