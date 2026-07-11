const fs = require('fs');

let profileFile = 'd:/ZahidCodes/TheSeeks-Teachers/src/screens/settings/TeacherProfileScreen.tsx';
let content = fs.readFileSync(profileFile, 'utf8');

// Replace both occurrences of profileData.uid || profileData.id
// Using regex to ensure we catch it even if there's minor formatting differences
content = content.replace(/uid:\s*profileData\.uid\s*\|\|\s*profileData\.id/g, 'uid: user?.uid || profileData?.uid || profileData?.id');

fs.writeFileSync(profileFile, content);
console.log('Fixed undefined uid issue in TeacherProfileScreen.tsx');
