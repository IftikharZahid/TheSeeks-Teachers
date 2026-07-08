const fs = require('fs');

const file = 'src/screens/settings/SettingsScreen.tsx';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('const accountItems'));
if (idx !== -1) {
  lines.splice(idx + 1, 0, "    { icon: 'person', color: '#3b82f6', title: 'Personal Details', screen: 'ProfileScreen' },");
  fs.writeFileSync(file, lines.join('\n'));
  console.log('Fixed SettingsScreen.tsx');
} else {
  console.log('Could not find accountItems');
}
