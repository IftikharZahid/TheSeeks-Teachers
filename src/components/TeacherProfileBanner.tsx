import React from "react";
import { View, Text, Image, Platform, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";
import { scale } from '../utils/responsive';
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const TeacherProfileBanner = ({ children }: { children?: React.ReactNode }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{ position: 'relative', height: scale(160) + insets.top, overflow: 'hidden' }}>
      {/* Gradient Background */}
      <LinearGradient
        colors={["#6C63FF", "#4F46E5", "#3B82F6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, paddingTop: insets.top }}
      >
        {/* Academy Logo (Faint) */}
        <Image 
          source={require('../../assets/the-seeks-logo.png')}
          style={{
            position: 'absolute',
            right: scale(-10),
            top: scale(10) + insets.top,
            width: scale(140),
            height: scale(140),
            opacity: 0.15,
          }}
          resizeMode="contain"
        />

        {/* Academy Watermark */}
        <View style={{ position: 'absolute', left: scale(24), top: scale(32) + insets.top }}>
          <Text
            style={{
              color: "rgba(255,255,255,0.15)",
              fontSize: scale(24),
              fontWeight: "900",
              letterSpacing: 2,
            }}
          >
            THE SEEKS
          </Text>

          <Text
            style={{
              color: "rgba(255,255,255,0.15)",
              fontSize: scale(18),
              fontWeight: "700",
              letterSpacing: 1,
            }}
          >
            ACADEMY
          </Text>

          <Text
            style={{
              color: "rgba(255,255,255,0.12)",
              fontSize: scale(12),
              marginTop: scale(4),
            }}
          >
            Fort Abbas
          </Text>
        </View>

        {/* Bottom Wave */}
        <View
          style={{
            position: "absolute",
            bottom: scale(-30),
            left: scale(-20),
            right: scale(-20),
            height: scale(70),
            backgroundColor: theme.background,
            borderTopLeftRadius: scale(100),
            borderTopRightRadius: scale(100),
          }}
        />

        {/* Optional Header/Content over Banner */}
        {children && (
          <View style={{ position: 'absolute', top: StatusBar.currentHeight || 24, left: 0, right: 0, zIndex: 50 }}>
            {children}
          </View>
        )}
      </LinearGradient>
    </View>
  );
};
