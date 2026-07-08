const fs = require('fs');

const file = 'src/screens/settings/TeacherProfileScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix the escaped backticks
content = content.replace("const imageStr = \\`data:\\${mimeType};base64,\\${base64Data}\\`;", "const imageStr = `data:${mimeType};base64,${base64Data}`;");

// Fix any other escaped backticks if they exist
content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');

fs.writeFileSync(file, content);
console.log('Fixed backticks!');
