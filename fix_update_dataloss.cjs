const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens', 'exams');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.tsx') && !f.includes('_backup'));

files.forEach(file => {
    const filePath = path.join(screensDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Finding the block to replace
    // We want to replace everything from "let computedStatus = 'Absent';" 
    // down to "try {" (before saving)

    const startIndex = content.indexOf("let computedStatus = 'Absent';");
    const endIndex = content.indexOf("try {", startIndex);

    if (startIndex !== -1 && endIndex !== -1) {
        const replacementCode = `let computedStatus = 'Absent';
    let totalObtained = 0;
    let totalPossible = 0;

    let finalBooks = scopedEntryBooks;
    if (editingExam && editingExam.books && editingExam.books.length > 0) {
      if (isTeacher && teacherSubjectsList && teacherSubjectsList.length > 0) {
        const otherBooks = editingExam.books.filter(b => 
          !teacherSubjectsList.some((s: string) => normalizeSubjectName(s) === normalizeSubjectName(b.name))
        );
        finalBooks = [...otherBooks, ...scopedEntryBooks];
      }
    }

    if (finalBooks.length > 0) {
      finalBooks.forEach(book => {
        const obtained = parseFloat(book.obtainedMarks);
        const total = parseFloat(book.totalMarks);
        if (!isNaN(obtained) && !isNaN(total)) {
          totalObtained += obtained;
          totalPossible += total;
        }
      });
      if (totalPossible > 0) {
        const percentage = (totalObtained / totalPossible) * 100;
        computedStatus = percentage >= 40 ? 'Pass' : 'Fail';
      }
    } else if (obtainedMarks && obtainedMarks.trim() !== '') {
      const marks = parseFloat(obtainedMarks);
      if (!isNaN(marks)) {
        computedStatus = marks >= 40 ? 'Pass' : 'Fail';
      }
    }

    const finalTotalMarks = finalBooks.length > 0 ? totalPossible.toString() : (totalMarks || '');
    const finalObtainedMarks = finalBooks.length > 0 ? totalObtained.toString() : (obtainedMarks || '');

    const examData: any = {
      title,
      date: formattedDate,
      category,
      rollNo: rollNo || '',
      studentName: studentName || '',
      studentEmail: studentEmail || '',
      studentClass: studentClass || '',
      books: finalBooks.length > 0 ? finalBooks : undefined,
      bookName: finalBooks.length > 0 ? finalBooks.map(b => b.name).join(', ') : (isTeacher && selectedTeacherSubject ? selectedTeacherSubject : (bookName || '')),
      totalMarks: finalTotalMarks,
      obtainedMarks: finalObtainedMarks,
      status: computedStatus,
      description: description || '',
      updatedAt: serverTimestamp(),
      // ─── Teacher Tracking ───────────────────────────────────────────────────
      ...(isTeacher && { teacherId, createdBy: teacherId }),
    };

    `;

        const newContent = content.substring(0, startIndex) + replacementCode + content.substring(endIndex);
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('Fixed data loss on update in ' + file);
    } else {
        console.log('Could not find boundaries in ' + file);
    }
});
