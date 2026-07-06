const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens', 'exams');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.tsx') && !f.includes('_backup'));

files.forEach(file => {
    const filePath = path.join(screensDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    content = content.replace(/let combinedBooks = \[\];/g, 'let combinedBooks: any[] = [];');
    content = content.replace(/const myKey = \(selOriginal\.rollNo \|\| selOriginal\.studentName \|\| ''\);/g, "const myKey = (selOriginal?.rollNo || selOriginal?.studentName || '') as string;");
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed typings in ' + file);
});
