const fs = require('fs');
let file = 'src/screens/settings/ChangePasswordScreen.tsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(/import \{ auth \} from '\.\.\/\.\.\/api\/firebaseConfig';/, "import { auth, db } from '../../api/firebaseConfig';");
c = c.replace(/import \{ EmailAuthProvider, reauthenticateWithCredential, updatePassword \} from 'firebase\/auth';/, "import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';\nimport { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';");

const targetRegex = /await updatePassword\(user,\s*newPassword\);\s*Alert\.alert\('Success',\s*'Password updated successfully\.',\s*\[/;
const replacement = `await updatePassword(user, newPassword);

      try {
        const staffQuery = query(collection(db, 'staff'), where('uid', '==', user.uid));
        const staffSnap = await getDocs(staffQuery);
        if (!staffSnap.empty) {
          const staffDoc = staffSnap.docs[0];
          await updateDoc(doc(db, 'staff', staffDoc.id), { password: newPassword });
        }
      } catch (staffError) {
        console.error('Failed to update password in staff collection:', staffError);
      }

      Alert.alert('Success', 'Password updated successfully.', [`;

c = c.replace(targetRegex, replacement);

fs.writeFileSync(file, c);
console.log('Fixed ChangePasswordScreen successfully');
