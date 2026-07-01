const fs = require('fs');
const path = require('path');

const files = [
  'src/screens/academics/AttendanceClassesListScreen.tsx',
  'src/screens/academics/ClassesListScreen.tsx',
  'src/screens/academics/PastPapersScreen.tsx',
  'src/screens/diary/ClassListDiaryScreen.tsx',
  'src/screens/settings/ChangePasswordScreen.tsx',
  'src/screens/users/LikedTeachersScreen.tsx',
  'src/screens/users/TeacherDetailsScreen.tsx',
  'src/screens/users/TeachersListScreen.tsx'
];

files.forEach(file => {
  const filePath = path.join('c:/Users/USER/Desktop/Mobile App Dev/TheSeeks Projects/TheSeeks-Teachers', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/paddingTop:\s*StatusBar\.currentHeight\s*\|\|\s*0,\s*paddingTop:\s*StatusBar\.currentHeight\s*\|\|\s*0,/g, 'paddingTop: StatusBar.currentHeight || 0,');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${file}`);
  } else {
    console.log(`Not found: ${file}`);
  }
});
