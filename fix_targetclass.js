const fs = require('fs');
const path = require('path');

const map = {
  'Class9thExamsScreen.tsx': '9th Class',
  'Class10thExamsScreen.tsx': '10th Class',
  'Class1stYearExamsScreen.tsx': '1st Year',
  'Class2ndYearExamsScreen.tsx': '2nd Year'
};

const examsDir = path.join(__dirname, 'src', 'screens', 'exams');

for (const [file, className] of Object.entries(map)) {
  const filePath = path.join(examsDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\{targetClass\} Exams/g, `${className} Exams`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed targetClass in ${file}`);
  }
}
