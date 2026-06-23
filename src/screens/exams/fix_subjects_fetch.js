const fs = require('fs');
const path = require('path');

const examFiles = ['GenericExamsScreen.tsx', 'Class9thExamsScreen.tsx', 'Class10thExamsScreen.tsx', 'Class1stYearExamsScreen.tsx', 'Class2ndYearExamsScreen.tsx'];

examFiles.forEach(file => {
  const filePath = path.join('c:/Users/USER/Desktop/Mobile App Dev/TheSeeks Projects/TheSeeks-Teachers/src/screens/exams', file);
  let content = fs.readFileSync(filePath, 'utf8');

  const searchStr = `  const teacherId = profile?.id || profile?.uid || profile?.email || '';
  const teacherSubjectStr = profile?.subject || profile?.class || profile?.booktitle || profile?.bookTitle || '';
  const teacherSubjectsList = useMemo(() => {
    return profile?.subjects || (teacherSubjectStr ? teacherSubjectStr.split(',').map((s: string) => s.trim()) : []);
  }, [profile, teacherSubjectStr]);
  const defaultTeacherSubject = teacherSubjectsList.length > 0 ? teacherSubjectsList[0] : teacherSubjectStr;`;

  const replacementStr = `  const teacherId = profile?.id || profile?.uid || profile?.email || '';
  const _teachers = useAppSelector(state => state.teachers.list);
  const currentAdminTeacher = _teachers.find(t => t.id === profile?.uid || t.id === profile?.id || (t as any).email === profile?.email || t.name === profile?.fullname);
  const adminSubjectStr = currentAdminTeacher?.subject;
  const adminSubjectsArr = (currentAdminTeacher as any)?.subjects;

  const teacherSubjectStr = adminSubjectStr || profile?.subject || profile?.class || profile?.booktitle || profile?.bookTitle || '';
  const teacherSubjectsList = useMemo(() => {
    let list: string[] = [];
    if (adminSubjectsArr && Array.isArray(adminSubjectsArr) && adminSubjectsArr.length > 0) {
      list = adminSubjectsArr;
    } else if (teacherSubjectStr) {
      list = teacherSubjectStr.split(',').map((s: string) => s.trim()).filter(Boolean);
    } else if (profile?.subjects && Array.isArray(profile?.subjects)) {
      list = profile.subjects;
    }
    return Array.from(new Set(list));
  }, [profile, teacherSubjectStr, adminSubjectsArr]);
  const defaultTeacherSubject = teacherSubjectsList.length > 0 ? teacherSubjectsList[0] : teacherSubjectStr;`;

  let contentNorm = content.replace(/\r\n/g, '\n');
  let searchNorm = searchStr.replace(/\r\n/g, '\n');
  let replaceNorm = replacementStr.replace(/\r\n/g, '\n');

  if (contentNorm.includes(searchNorm)) {
    contentNorm = contentNorm.replace(searchNorm, replaceNorm);
    
    // Also we need to remove the duplicate `const teachers = useAppSelector(state => state.teachers.list);` that's further down
    contentNorm = contentNorm.replace(/  const teachers = useAppSelector\(state => state\.teachers\.list\);\n/, '');
    
    fs.writeFileSync(filePath, contentNorm);
    console.log(`Updated ${file}`);
  } else {
    console.log(`Could not find target in ${file}`);
  }
});

const diaryFile = 'c:/Users/USER/Desktop/Mobile App Dev/TheSeeks Projects/TheSeeks-Teachers/src/screens/diary/ClassDiaryScreen.tsx';
let diaryContent = fs.readFileSync(diaryFile, 'utf8');

const diarySearchStr = `  const currentTeacher = teachers.find(t => t.name === profile?.fullname);

  const teacherSubjectStr = profile?.class || profile?.subject || '';
  const teacherSubjectsList = profile?.subjects || (teacherSubjectStr ? teacherSubjectStr.split(',').map((s: string) => s.trim()) : []);
  const defaultSubject = teacherSubjectsList.length > 0 ? teacherSubjectsList[0] : (profile?.class || profile?.subject || profile?.role || 'General');`;

const diaryReplacementStr = `  const currentTeacher = teachers.find(t => t.id === profile?.uid || t.id === profile?.id || (t as any).email === profile?.email || t.name === profile?.fullname);
  const adminSubjectStr = currentTeacher?.subject;
  const adminSubjectsArr = (currentTeacher as any)?.subjects;

  const teacherSubjectStr = adminSubjectStr || profile?.class || profile?.subject || '';
  let list: string[] = [];
  if (adminSubjectsArr && Array.isArray(adminSubjectsArr) && adminSubjectsArr.length > 0) {
    list = adminSubjectsArr;
  } else if (teacherSubjectStr) {
    list = teacherSubjectStr.split(',').map((s: string) => s.trim()).filter(Boolean);
  } else if (profile?.subjects && Array.isArray(profile?.subjects)) {
    list = profile.subjects;
  }
  const teacherSubjectsList = Array.from(new Set(list));
  const defaultSubject = teacherSubjectsList.length > 0 ? teacherSubjectsList[0] : (profile?.class || profile?.subject || profile?.role || 'General');`;

let diaryNorm = diaryContent.replace(/\r\n/g, '\n');
let diarySearchNorm = diarySearchStr.replace(/\r\n/g, '\n');
let diaryReplaceNorm = diaryReplacementStr.replace(/\r\n/g, '\n');

if (diaryNorm.includes(diarySearchNorm)) {
  diaryNorm = diaryNorm.replace(diarySearchNorm, diaryReplaceNorm);
  fs.writeFileSync(diaryFile, diaryNorm);
  console.log('Updated ClassDiaryScreen.tsx');
} else {
  console.log('Could not find target in ClassDiaryScreen.tsx');
}
