const fs = require('fs');

const file = 'src/screens/settings/TeacherProfileScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "{ encoding: FileSystem.EncodingType.Base64 }",
  "{ encoding: 'base64' }"
);

fs.writeFileSync(file, content);
console.log('Fixed EncodingType!');
