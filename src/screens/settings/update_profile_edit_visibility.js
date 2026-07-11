const fs = require('fs');

// 1. Update SettingsScreen.tsx
let settingsFile = 'd:/ZahidCodes/TheSeeks-Teachers/src/screens/settings/SettingsScreen.tsx';
let settingsContent = fs.readFileSync(settingsFile, 'utf8');

settingsContent = settingsContent.replace(
  /navigation\.navigate\(\(item as any\)\.screen as never\)/g,
  "navigation.navigate((item as any).screen as any, { fromSettings: true })"
);
settingsContent = settingsContent.replace(
  /navigation\.navigate\(item\.screen as never\)/g,
  "navigation.navigate(item.screen as any, { fromSettings: true })"
);

fs.writeFileSync(settingsFile, settingsContent);
console.log('Updated SettingsScreen.tsx');

// 2. Update TeacherProfileScreen.tsx
let profileFile = 'd:/ZahidCodes/TheSeeks-Teachers/src/screens/settings/TeacherProfileScreen.tsx';
let profileContent = fs.readFileSync(profileFile, 'utf8');

if (!profileContent.includes('const route = useRoute')) {
  // Add useRoute import
  profileContent = profileContent.replace(
    "import { useNavigation } from '@react-navigation/native';",
    "import { useNavigation, useRoute } from '@react-navigation/native';"
  );
  
  // Add route hook inside component
  profileContent = profileContent.replace(
    "const navigation = useNavigation<any>();",
    "const navigation = useNavigation<any>();\n  const route = useRoute<any>();\n  const isFromSettings = route.params?.fromSettings === true;"
  );
}

// Conditionally render the edit button
profileContent = profileContent.replace(
  /<TouchableOpacity style=\{\[styles\.backButton, \{ backgroundColor: 'rgba\(255,255,255,0\.2\)' \}\]\} onPress=\{openEditModal\}>\s*<Ionicons name="pencil" size=\{scale\(18\)\} color="#fff" \/>\s*<\/TouchableOpacity>/g,
  `{isFromSettings && (
            <TouchableOpacity style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]} onPress={openEditModal}>
              <Ionicons name="pencil" size={scale(18)} color="#fff" />
            </TouchableOpacity>
          )}`
);

fs.writeFileSync(profileFile, profileContent);
console.log('Updated TeacherProfileScreen.tsx');
