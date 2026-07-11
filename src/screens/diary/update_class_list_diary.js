const fs = require('fs');
const file = 'd:/ZahidCodes/TheSeeks-Teachers/src/screens/diary/ClassListDiaryScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add Animated to react-native import
content = content.replace(
  "import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';",
  "import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar, Animated } from 'react-native';"
);

// 2. Add useRef, useEffect to react import
if (!content.includes('useEffect')) {
  content = content.replace("import React from 'react';", "import React, { useRef, useEffect } from 'react';");
}

// 3. Define the Animated component
const animatedComponent = `const AnimatedClassItem = ({ cls, index, theme, isDark, count, onSelect }: any) => {
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay: index * 120,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        friction: 7,
        tension: 40,
        delay: index * 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.card, borderColor: isDark ? theme.border : '#f1f5f9' }]}
        activeOpacity={0.7}
        onPress={() => onSelect(cls.id)}
      >
        <View style={[styles.iconContainer, { backgroundColor: isDark ? cls.color + '20' : cls.bg }]}>
          <Ionicons name={cls.icon} size={scale(24)} color={cls.color} />
        </View>
        
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{cls.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: scale(2) }}>
            <Ionicons name="people-outline" size={scale(12)} color={theme.textTertiary || '#94a3b8'} />
            <Text style={[styles.studentCount, { color: theme.textTertiary || '#94a3b8' }]}> {count} {count === 1 ? 'Student' : 'Students'}</Text>
          </View>
        </View>

        <View style={[styles.badge, { backgroundColor: isDark ? cls.color + '20' : cls.bg }]}>
          <Text style={[styles.badgeText, { color: cls.color }]}>Manage Diary</Text>
        </View>
        
        <Ionicons name="chevron-forward" size={scale(18)} color={theme.textTertiary || '#94a3b8'} style={{ marginLeft: scale(8) }} />
      </TouchableOpacity>
    </Animated.View>
  );
};
`;

if (!content.includes('const AnimatedClassItem')) {
  content = content.replace('export const DiaryScreen: React.FC = () => {', animatedComponent + '\nexport const DiaryScreen: React.FC = () => {');
}

// 4. Replace the map loop
const mapRegex = /\{dynamicClasses\.map\(\(cls, idx\) => \{[\s\S]*?const count = getStudentCount\(cls\.id\);[\s\S]*?return \([\s\S]*?<TouchableOpacity[\s\S]*?key=\{cls\.id\}[\s\S]*?style=\\{\[styles\.card[\s\S]*?activeOpacity=\{0\.7\}[\s\S]*?onPress=\{\(\) => handleSelectClass\(cls\.id\)\}[\s\S]*?>[\s\S]*?<\/TouchableOpacity>[\s\S]*?\);[\s\S]*?\}\)\}/;

const mapReplacement = `{dynamicClasses.map((cls, idx) => {
            const count = getStudentCount(cls.id);
            return (
              <AnimatedClassItem
                key={cls.id}
                cls={cls}
                index={idx}
                theme={theme}
                isDark={isDark}
                count={count}
                onSelect={handleSelectClass}
              />
            );
          })}`;

content = content.replace(mapRegex, mapReplacement);

fs.writeFileSync(file, content);
console.log('done');
