const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'TeacherMessagesScreen.tsx');
if (!fs.existsSync(filePath)) return;

let content = fs.readFileSync(filePath, 'utf8');

// Fix imports
if (!content.includes('import { sendMessage')) {
  content = content.replace(
    /import \{ updateLastReadTimestamp/g,
    `import { sendMessage, editMessage, deleteMessage, updateLastReadTimestamp`
  );
}

// Replace delete message
/*
  deleteDoc(doc(db, 'chatGroups', activeGroup, 'messages', targetMsg.id))
*/
content = content.replace(
  /deleteDoc\(doc\(db, 'chatGroups', (.*?), 'messages', (.*?)\)\)/g,
  `dispatch(deleteMessage({ groupId: $1, messageId: $2 })).unwrap()`
);

// Replace edit message
/*
  await updateDoc(msgDocRef, { text: editMessageText });
  from line: const msgDocRef = doc(db, 'chatGroups', activeGroup, 'messages', editingMessageId);
*/
content = content.replace(
  /const msgDocRef = doc\(db, 'chatGroups', activeGroup, 'messages', editingMessageId\);\s+await updateDoc\(msgDocRef, \{ text: editMessageText \}\);/g,
  `await dispatch(editMessage({ groupId: activeGroup, messageId: editingMessageId, text: editMessageText })).unwrap();`
);

// Replace send message
/*
  const messagesRef = collection(db, 'chatGroups', activeGroup, 'messages');
  await addDoc(messagesRef, payload);
*/
content = content.replace(
  /const messagesRef = collection\(db, 'chatGroups', activeGroup, 'messages'\);\s+await addDoc\(messagesRef, (.*?)\);/g,
  `
  // Create a predictable ID and serializable payload for the queue
  const newMsgId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5);
  const serializablePayload = {
      ...$1,
      id: newMsgId,
      timestampMs: Date.now(),
      createdAtMs: Date.now(),
  };
  delete serializablePayload.timestamp;
  delete serializablePayload.createdAt;
  await dispatch(sendMessage({ groupId: activeGroup, message: serializablePayload as any })).unwrap();
  `
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Refactored TeacherMessagesScreen');
