import React from "react";
import { View, Text } from "react-native";
import {
  BookOpen,
  GraduationCap,
  Laptop,
  Trophy,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";
import { scale } from '../utils/responsive';

export const TeacherProfileBanner = ({ children }: { children?: React.ReactNode }) => {
  const { theme } = useTheme();
  
  return (
    <View style={{ position: 'relative', height: scale(160), overflow: 'hidden' }}>
      {/* Gradient Background */}
      <LinearGradient
        colors={["#6C63FF", "#4F46E5", "#3B82F6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        {/* Decorative Icons */}
        <BookOpen
          size={70}
          color="rgba(255,255,255,0.08)"
          style={{
            position: "absolute",
            left: scale(15),
            top: scale(20),
          }}
        />

        <GraduationCap
          size={80}
          color="rgba(255,255,255,0.08)"
          style={{
            position: "absolute",
            right: scale(20),
            top: scale(15),
          }}
        />

        <Laptop
          size={60}
          color="rgba(255,255,255,0.08)"
          style={{
            position: "absolute",
            left: scale(120),
            bottom: scale(30),
          }}
        />

        <Trophy
          size={55}
          color="rgba(255,255,255,0.08)"
          style={{
            position: "absolute",
            right: scale(90),
            bottom: scale(25),
          }}
        />

        {/* Academy Watermark */}
        <View style={{ position: 'absolute', left: scale(24), top: scale(32) }}>
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
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50 }}>
            {children}
          </View>
        )}
      </LinearGradient>
    </View>
  );
};
