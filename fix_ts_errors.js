const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens', 'exams');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.tsx') && !f.includes('_backup'));

files.forEach(file => {
    const filePath = path.join(screensDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Fix 1: let allBooks = []; -> let allBooks: any[] = [];
    content = content.replace(/let allBooks = \[\];/g, 'let allBooks: any[] = [];');

    // Fix 2: parseFloat(e.totalMarks) -> parseFloat(e.totalMarks as string)
    // Wait, the regex could be tricky, let's just use string replace.
    content = content.replace(/parseFloat\(e\.totalMarks\)/g, "parseFloat((e.totalMarks || '0') as string)");
    content = content.replace(/parseFloat\(e\.obtainedMarks\)/g, "parseFloat((e.obtainedMarks || '0') as string)");

    // Fix 3: disabled prop: disabled={isTeacher && selectedExamForOptions && selectedExamForOptions.teacherId !== teacherId}
    content = content.replace(/disabled=\{isTeacher && selectedExamForOptions && selectedExamForOptions\.teacherId !== teacherId\}/g, "disabled={!!(isTeacher && selectedExamForOptions && selectedExamForOptions.teacherId !== teacherId)}");

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Applied TS fixes to ${file}`);
});
