const fs = require('fs');
const path = require('path');

const baseDir = 'C:\\Users\\USER\\Desktop\\Mobile App Dev\\TheSeeks Projects\\TheSeeks-Teachers\\src\\screens';

const targets = [
  'diary/ClassListDiaryScreen.tsx',
  'diary/ClassDiaryScreen.tsx',
  'exams/Class10thExamsScreen.tsx',
  'exams/Class1stYearExamsScreen.tsx',
  'exams/Class2ndYearExamsScreen.tsx',
  'exams/Class9thExamsScreen.tsx',
  'exams/GenericExamsScreen.tsx',
];

targets.forEach(target => {
  const filePath = path.join(baseDir, target);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Look for `header: {` inside the styles object and add `marginTop: -1,`
    // It might be single-line or multi-line
    
    // Check if it already has marginTop: -1
    if (content.includes('marginTop: -1')) {
      console.log(`Skipped (already has marginTop): ${target}`);
      return;
    }

    // Find header style block. We will replace `header: {` or `header: { ` with `header: { marginTop: -1, `
    let modified = content.replace(/header:\s*\{\s*/g, 'header: { marginTop: -1, ');
    
    if (modified !== content) {
      fs.writeFileSync(filePath, modified, 'utf8');
      console.log(`Updated: ${target}`);
    } else {
      console.log(`Could not find header style in: ${target}`);
    }
  } else {
    console.log(`File not found: ${target}`);
  }
});
