import os

def add_image_picker():
    path = r"c:\Users\USER\Desktop\Mobile App Dev\TheSeeks Projects\TheSeeks-Teachers\src\screens\settings\TeacherProfileScreen.tsx"
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Imports
    if "import * as ImagePicker" not in content:
        content = content.replace(
            "import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Modal, StatusBar } from 'react-native';",
            "import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Modal, StatusBar, ActivityIndicator } from 'react-native';\nimport * as ImagePicker from 'expo-image-picker';\nimport * as ImageManipulator from 'expo-image-manipulator';\nimport AsyncStorage from '@react-native-async-storage/async-storage';"
        )

    # 2. State Hooks
    state_hooks = """
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [localImageUri, setLocalImageUri] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user?.uid) {
      AsyncStorage.getItem(`profile_picture_${user.uid}`).then(res => {
        if (res) setLocalImageUri(res);
      }).catch(() => {});
    }
  }, [user?.uid]);
"""
    if "const [uploadingImage, setUploadingImage]" not in content:
        content = content.replace(
            "const [editImage, setEditImage] = React.useState<string | null>(null);",
            "const [editImage, setEditImage] = React.useState<string | null>(null);\n" + state_hooks
        )

    # 3. handleImagePick Function
    handle_image_pick = """
  const handleImagePick = async () => {
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
        setUploadingImage(true);
        const asset = pickerResult.assets[0];
        
        const manipResult = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: scale(300), height: scale(300) } }],
          { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );

        if (manipResult.base64 && user?.uid) {
          const imageData = `data:image/jpeg;base64,${manipResult.base64}`;
          await AsyncStorage.setItem(`profile_picture_${user.uid}`, imageData);
          setLocalImageUri(imageData);
          if (profileData) {
            dispatch(setProfile({ ...profileData, image: imageData }));
            dispatch(enqueueAction({
              type: 'UPDATE_PROFILE',
              payload: { ...profileData, image: imageData },
              timestamp: Date.now(),
            }));
            processSyncQueue(dispatch);
          }
          Alert.alert('Success', 'Profile picture saved locally in cache!');
        } else {
          Alert.alert('Error', 'Could not process image.');
        }
      }
    } catch (error) {
      console.error('Image pick/upload error:', error);
      Alert.alert('Error', 'Failed to update profile picture. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };
"""
    if "const handleImagePick" not in content:
        content = content.replace(
            "const openEditModal = () => {",
            handle_image_pick + "\n  const openEditModal = () => {"
        )

    # 4. Modify displayImage
    old_display_image = "const displayImage = profileData?.image?.trim() ? profileData.image : currentTeacher?.image?.trim() ? currentTeacher.image : user?.photoURL?.trim() ? user.photoURL : null;"
    new_display_image = "const displayImage = localImageUri || (profileData?.image?.trim() ? profileData.image : currentTeacher?.image?.trim() ? currentTeacher.image : user?.photoURL?.trim() ? user.photoURL : null);"
    if old_display_image in content:
        content = content.replace(old_display_image, new_display_image)

    # 5. Wrap Avatar
    old_avatar = """          <View style={[styles.avatarContainer, { borderColor: theme.background }]}>
            <Image
              source={displayImage ? { uri: displayImage } : require('../../../assets/icon.png')}
              style={styles.avatar}
              defaultSource={require('../../../assets/icon.png')}
            />
          </View>"""
    new_avatar = """          <TouchableOpacity 
            style={[styles.avatarContainer, { borderColor: theme.background }]}
            onPress={handleImagePick}
            disabled={uploadingImage}
            activeOpacity={0.7}
          >
            {uploadingImage ? (
              <ActivityIndicator size="large" color={theme.primary} />
            ) : (
              <>
                <Image
                  source={displayImage ? { uri: displayImage } : require('../../../assets/icon.png')}
                  style={styles.avatar}
                  defaultSource={require('../../../assets/icon.png')}
                />
                <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.primary, borderRadius: scale(15), width: scale(30), height: scale(30), justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.background }}>
                  <Ionicons name="camera" size={scale(16)} color="#fff" />
                </View>
              </>
            )}
          </TouchableOpacity>"""
    if old_avatar in content:
        content = content.replace(old_avatar, new_avatar)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

add_image_picker()
