const fs = require('fs');
let profileFile = 'd:/ZahidCodes/TheSeeks-Teachers/src/screens/settings/TeacherProfileScreen.tsx';
let content = fs.readFileSync(profileFile, 'utf8');

const targetStr = `<TouchableOpacity style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]} onPress={() => openSpecificEdit(null)}>
            <Ionicons name="pencil" size={scale(18)} color="#fff" />
          </TouchableOpacity>`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, "");
  fs.writeFileSync(profileFile, content);
  console.log('Successfully removed the top right edit button');
} else {
  console.log('Top right edit button not found. Maybe already removed?');
}
