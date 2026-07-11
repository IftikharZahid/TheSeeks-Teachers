const fs = require('fs');
let profileFile = 'd:/ZahidCodes/TheSeeks-Teachers/src/screens/settings/TeacherProfileScreen.tsx';
let content = fs.readFileSync(profileFile, 'utf8');

const regex = /<TouchableOpacity style=\{\[styles\.backButton, \{ backgroundColor: 'rgba\(255,255,255,0\.2\)' \}\]\} onPress=\{\(\) => openSpecificEdit\(null\)\}>\s*<Ionicons name="pencil" size=\{scale\(18\)\} color="#fff" \/>\s*<\/TouchableOpacity>\s*/g;

content = content.replace(regex, "");

fs.writeFileSync(profileFile, content);
console.log('Removed top right edit button safely using Regex');
