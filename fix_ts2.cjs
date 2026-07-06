const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens', 'exams');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.tsx') && !f.includes('_backup'));

files.forEach(file => {
    const filePath = path.join(screensDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    content = content.replace(/parseFloat\(e\.obtainedMarks\)/g, "parseFloat(e.obtainedMarks || '0')");
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed typings in ' + file);
});
