const fs = require('fs');

const file = 'src/screens/settings/SettingsScreen.tsx';
const content = fs.readFileSync(file, 'utf8');

const target = `    } catch (error) {
  ];

  const preferenceItems = [`;

const replacement = `    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const accountItems = [
    { icon: 'person', color: '#3b82f6', title: 'Personal Details', screen: 'ProfileScreen' },
    { icon: 'key', color: '#8b5cf6', title: 'Change Password', screen: 'ChangePasswordScreen' },
    { icon: 'finger-print', color: '#10b981', title: 'Biometric Login' },
  ];

  const notificationItems = [
    { icon: 'notifications', color: '#f59e0b', title: 'Push Notifications' },
    { icon: 'mail', color: '#0ea5e9', title: 'Email Alerts' },
  ];

  const preferenceItems = [`;

if (content.includes(target)) {
  fs.writeFileSync(file, content.replace(target, replacement));
  console.log('Fixed SettingsScreen.tsx');
} else {
  console.log('Target not found in SettingsScreen.tsx');
}
