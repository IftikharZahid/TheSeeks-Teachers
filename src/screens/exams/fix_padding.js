const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\USER\\Desktop\\Mobile App Dev\\TheSeeks Projects\\TheSeeks-Teachers\\src\\screens\\exams';
const files = [
  'GenericExamsScreen.tsx',
  'Class9thExamsScreen.tsx',
  'Class10thExamsScreen.tsx',
  'Class1stYearExamsScreen.tsx',
  'Class2ndYearExamsScreen.tsx'
];

files.forEach(file => {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace paddingHorizontal: 0 with padding: 0, textAlignVertical: 'center'
  content = content.replace(
    /paddingHorizontal:\s*0/g,
    `padding: 0, textAlignVertical: 'center'`
  );

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Successfully fixed padding and text centering for inputs.');
