const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens', 'exams');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.tsx') && !f.includes('_backup'));

files.forEach(file => {
    const filePath = path.join(screensDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\r\n/g, '\n');

    const searchStr = `onSelect={(val) => {
                            setSelectedTeacherSubject(val);
                            setShowTeacherSubjectDropdown(false);
                          }}`;
                          
    const replaceStr = `onSelect={(val) => {
                            setSelectedTeacherSubject(val);
                            setEntryBooks([{ name: val.trim(), totalMarks: '', obtainedMarks: '' }]);
                            setShowTeacherSubjectDropdown(false);
                          }}`;

    if (content.includes(searchStr)) {
        content = content.replace(searchStr, replaceStr);
        console.log(`Updated subject dropdown onSelect in ${file}`);
        fs.writeFileSync(filePath, content, 'utf8');
    } else {
        console.log(`Could not find onSelect in ${file}`);
    }
});
