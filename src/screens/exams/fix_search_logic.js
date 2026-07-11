const fs = require('fs');
const path = require('path');

const files = [
  'Class9thExamsScreen.tsx',
  'Class10thExamsScreen.tsx',
  'Class1stYearExamsScreen.tsx',
  'Class2ndYearExamsScreen.tsx',
  'GenericExamsScreen.tsx'
];

const dir = 'd:/ZahidCodes/TheSeeks-Teachers/src/screens/exams';

for (const file of files) {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) {
    console.log('Skipping ' + file + ', not found');
    continue;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace the return logic for filteredExams
  const targetStr = `      }
      return matchesTestNo && matchesGender;`;
  
  const replacementStr = `      }
      const matchesSearch = searchQuery ? (e.studentName || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) : true;
      return matchesTestNo && matchesGender && matchesSearch;`;

  if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync(filePath, content);
    console.log('Successfully updated search logic in ' + file);
  } else {
    console.log('Target string not found in ' + file + ' or already updated.');
  }
}
