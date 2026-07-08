const fs = require('fs');

const file = 'src/screens/settings/SettingsScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `  const accountItems = [
    { icon: 'key', color: '#8b5cf6', title: 'Change Password', screen: 'ChangePasswordScreen' },
    { icon: 'finger-print', color: '#10b981', title: 'Biometric Login' },
  ];`;

const replacement = `  const accountItems = [
    { icon: 'person', color: '#3b82f6', title: 'Personal Details', screen: 'ProfileScreen' },
    { icon: 'key', color: '#8b5cf6', title: 'Change Password', screen: 'ChangePasswordScreen' },
    { icon: 'finger-print', color: '#10b981', title: 'Biometric Login' },
  ];`;

if (content.includes(target)) {
  fs.writeFileSync(file, content.replace(target, replacement));
  console.log('Successfully inserted Personal Details in SettingsScreen.tsx');
} else {
  console.log('Target string not found!');
}
