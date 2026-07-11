const fs = require('fs');

let profileFile = 'd:/ZahidCodes/TheSeeks-Teachers/src/screens/settings/TeacherProfileScreen.tsx';
let content = fs.readFileSync(profileFile, 'utf8');

const oldPickImage = `  const pickImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        // Convert to base64 so we can upload it to Firestore
        const base64Data = await FileSystem.readAsStringAsync(fileUri, { encoding: 'base64' });
        const mimeType = result.assets[0].mimeType || 'image/jpeg';
        const imageStr = \`data:\${mimeType};base64,\${base64Data}\`;
        setEditImage(imageStr);
      }
    } catch (e) {
      console.warn('Image pick error:', e);
    }
  };`;

const newPickImage = `  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        const asset = pickerResult.assets[0];
        const manipResult = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: scale(300), height: scale(300) } }],
          { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        if (manipResult.base64) {
          const imageStr = \`data:image/jpeg;base64,\${manipResult.base64}\`;
          setEditImage(imageStr);
        }
      }
    } catch (e) {
      console.warn('Image pick error:', e);
    }
  };`;

if (content.includes('const pickImage = async () => {')) {
  // Use regex to replace carefully
  const regex = /const pickImage = async \(\) => \{[\s\S]*?console\.warn\('Image pick error:', e\);\s*\}\s*\};/;
  content = content.replace(regex, newPickImage);
  fs.writeFileSync(profileFile, content);
  console.log('Fixed pickImage compression logic!');
} else {
  console.log('pickImage not found');
}
