const fs = require('fs');

const files = [
  'GenericExamsScreen.tsx',
  'Class9thExamsScreen.tsx',
  'Class10thExamsScreen.tsx',
  'Class1stYearExamsScreen.tsx',
  'Class2ndYearExamsScreen.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // Replace implicit any array with explicit string array type
    const target = `let existingSubjects = [];`;
    const replacement = `let existingSubjects: string[] = [];`;

    if (content.includes(target)) {
      content = content.replace(new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
      fs.writeFileSync(file, content);
      console.log('Fixed TS errors in', file);
    }
  }
}
