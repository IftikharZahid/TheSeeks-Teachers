const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens', 'exams');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.tsx') && !f.includes('_backup'));

files.forEach(file => {
    const filePath = path.join(screensDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Finding the block in openModal
    const searchBlock = `      let loadedBooks: BookEntry[] = [];
      if (exam.books && exam.books.length > 0) {
        loadedBooks = JSON.parse(JSON.stringify(exam.books));
      } else if (exam.bookName || exam.totalMarks || exam.obtainedMarks) {
        loadedBooks = [{ name: exam.bookName || '', totalMarks: exam.totalMarks || '', obtainedMarks: exam.obtainedMarks || '' }];
      }

      if (isTeacher && selectedTeacherSubject) {
        loadedBooks = loadedBooks.filter(b => normalizeSubjectName(b.name) === normalizeSubjectName(selectedTeacherSubject));
        const hasSubject = loadedBooks.some(b => normalizeSubjectName(b.name) === normalizeSubjectName(selectedTeacherSubject));
        if (!hasSubject) {
          loadedBooks.push({ name: selectedTeacherSubject.trim(), totalMarks: '', obtainedMarks: '' });
        }
      }`;

    const replaceBlock = `      let loadedBooks: BookEntry[] = [];
      if (exam.books && exam.books.length > 0) {
        loadedBooks = JSON.parse(JSON.stringify(exam.books)).map((b: any) => ({
          name: b.name || '',
          totalMarks: b.totalMarks != null ? String(b.totalMarks) : '',
          obtainedMarks: b.obtainedMarks != null ? String(b.obtainedMarks) : ''
        }));
      } else if (exam.bookName || exam.totalMarks != null || exam.obtainedMarks != null) {
        loadedBooks = [{ 
          name: exam.bookName || '', 
          totalMarks: exam.totalMarks != null ? String(exam.totalMarks) : '', 
          obtainedMarks: exam.obtainedMarks != null ? String(exam.obtainedMarks) : '' 
        }];
      }

      if (isTeacher && selectedTeacherSubject) {
        const normalizedTeacherSubject = normalizeSubjectName(selectedTeacherSubject);
        const exactMatch = loadedBooks.find(b => normalizeSubjectName(b.name) === normalizedTeacherSubject);
        
        if (exactMatch) {
          loadedBooks = [exactMatch];
        } else {
          const partialMatch = loadedBooks.find(b => normalizeSubjectName(b.name).includes(normalizedTeacherSubject));
          if (partialMatch) {
             loadedBooks = [{
               name: selectedTeacherSubject.trim(),
               totalMarks: partialMatch.totalMarks,
               obtainedMarks: partialMatch.obtainedMarks
             }];
          } else {
             loadedBooks = [{ name: selectedTeacherSubject.trim(), totalMarks: '', obtainedMarks: '' }];
          }
        }
      }`;

    if (content.includes(searchBlock)) {
        content = content.replace(searchBlock, replaceBlock);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed marks display issue in ' + file);
    } else {
        console.log('Could not find search block in ' + file);
    }
});
