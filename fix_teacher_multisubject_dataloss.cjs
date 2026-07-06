const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens', 'exams');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.tsx') && !f.includes('_backup'));

files.forEach(file => {
    const filePath = path.join(screensDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Finding the block to replace
    const searchString = `if (isTeacher && teacherSubjectsList && teacherSubjectsList.length > 0) {
        const otherBooks = editingExam.books.filter(b => 
          !teacherSubjectsList.some((s: string) => normalizeSubjectName(s) === normalizeSubjectName(b.name))
        );
        finalBooks = [...otherBooks, ...scopedEntryBooks];
      }`;

    const replaceString = `if (isTeacher) {
        // Keep all existing books that are NOT being updated in the current edit
        const otherBooks = editingExam.books.filter(b => 
          !scopedEntryBooks.some((sb: any) => normalizeSubjectName(sb.name) === normalizeSubjectName(b.name))
        );
        finalBooks = [...otherBooks, ...scopedEntryBooks];
      }`;

    if (content.includes(searchString)) {
        content = content.replace(searchString, replaceString);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed teacher multiple subject dataloss in ' + file);
    } else {
        console.log('Could not find search string in ' + file);
    }
});
