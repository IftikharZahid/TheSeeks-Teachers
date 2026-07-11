const fs = require('fs');
let file = 'd:/ZahidCodes/TheSeeks-Teachers/src/screens/settings/TeacherProfileScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetRegex = /<TouchableOpacity style=\{\[styles\.backButton, \{ backgroundColor: 'rgba\(255,255,255,0\.2\)' \}\]\} onPress=\{\(\) => openSpecificEdit\(null\)\}>\s*<Ionicons name="pencil" size=\{scale\(18\)\} color="#fff" \/>\s*<\/TouchableOpacity>/g;

content = content.replace(targetRegex, "");

fs.writeFileSync(file, content);
console.log('Removed top right edit button safely');
