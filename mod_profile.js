const fs = require('fs');

const file = 'src/screens/settings/TeacherProfileScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

// Imports
content = content.replace(
  "import { useAppSelector } from '../../store/hooks';",
  "import { useAppSelector, useAppDispatch } from '../../store/hooks';\nimport { setProfile } from '../../store/slices/authSlice';\nimport { enqueueAction } from '../../store/slices/syncSlice';\nimport { processSyncQueue } from '../../store/syncManager';\nimport * as DocumentPicker from 'expo-document-picker';\nimport { TextInput } from 'react-native';"
);

// State vars
const stateInsertion = `
  const dispatch = useAppDispatch();
  const [editModalVisible, setEditModalVisible] = React.useState(false);
  const [editName, setEditName] = React.useState('');
  const [editPhone, setEditPhone] = React.useState('');
  const [editQualification, setEditQualification] = React.useState('');
  const [editExperience, setEditExperience] = React.useState('');
  const [editImage, setEditImage] = React.useState<string | null>(null);

  const openEditModal = () => {
    setEditName(displayName);
    setEditPhone(displayPhone !== 'N/A' ? displayPhone : '');
    setEditQualification(displayQualification !== 'N/A' ? displayQualification : '');
    setEditExperience(displayExperience !== 'N/A' ? displayExperience : '');
    setEditImage(displayImage);
    setEditModalVisible(true);
  };

  const pickImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        setEditImage(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Image pick error:', e);
    }
  };

  const saveProfile = async () => {
    setEditModalVisible(false);
    if (!profileData) return;

    // Create an optimistic profile
    const updatedProfile = {
      ...profileData,
      fullname: editName.trim() || profileData.fullname,
      name: editName.trim() || profileData.fullname,
      phone: editPhone.trim(),
      qualification: editQualification.trim(),
      experience: editExperience.trim(),
      image: editImage || profileData.image,
    };

    // 1. Instantly update UI and Redux
    dispatch(setProfile(updatedProfile));

    // 2. Queue for Firebase (skip image since we keep it local only)
    const payloadForSync = {
      ...updatedProfile,
      image: profileData.image || '', // Keep old image or blank in Firebase
    };

    dispatch(enqueueAction({
      id: \`update_profile_\${Date.now()}\`,
      actionType: 'UPDATE_PROFILE',
      payload: { uid: profileData.uid || profileData.id, payload: payloadForSync },
      timestamp: Date.now(),
    }));

    // @ts-ignore
    dispatch(processSyncQueue());

    Alert.alert('Success', 'Profile updated successfully.');
  };
`;

content = content.replace(
  "  const { theme, isDark } = useTheme();\n  const insets = useSafeAreaInsets();",
  "  const { theme, isDark } = useTheme();\n  const insets = useSafeAreaInsets();\n" + stateInsertion
);

// Add Edit Button in header
content = content.replace(
  "<TouchableOpacity style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]} onPress={() => setLogoutModalVisible(true)}>\n          <Ionicons name=\"log-out-outline\" size={scale(20)} color=\"#fff\" />\n        </TouchableOpacity>",
  `<View style={{ flexDirection: 'row', gap: scale(8) }}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]} onPress={openEditModal}>
            <Ionicons name="pencil" size={scale(18)} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]} onPress={() => setLogoutModalVisible(true)}>
            <Ionicons name="log-out-outline" size={scale(20)} color="#fff" />
          </TouchableOpacity>
        </View>`
);

// Add Edit Modal at the bottom
const modalUI = `
      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, width: '90%', maxWidth: scale(340) }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</Text>
            <ScrollView style={{ width: '100%', maxHeight: scale(400) }} showsVerticalScrollIndicator={false}>
              
              <TouchableOpacity onPress={pickImage} style={{ alignSelf: 'center', marginVertical: scale(10) }}>
                <Image
                  source={editImage ? { uri: editImage } : require('../../../assets/icon.png')}
                  style={{ width: scale(80), height: scale(80), borderRadius: scale(40), backgroundColor: '#eee' }}
                />
                <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.primary, borderRadius: scale(12), padding: scale(4) }}>
                  <Ionicons name="camera" size={scale(16)} color="#fff" />
                </View>
              </TouchableOpacity>

              <Text style={{ color: theme.textSecondary, fontSize: scale(12), marginBottom: scale(4) }}>Full Name</Text>
              <TextInput
                style={{ backgroundColor: theme.backgroundSecondary, color: theme.text, borderRadius: scale(8), padding: scale(10), marginBottom: scale(12) }}
                value={editName}
                onChangeText={setEditName}
                placeholder="Full Name"
                placeholderTextColor={theme.textTertiary}
              />

              <Text style={{ color: theme.textSecondary, fontSize: scale(12), marginBottom: scale(4) }}>Phone Number</Text>
              <TextInput
                style={{ backgroundColor: theme.backgroundSecondary, color: theme.text, borderRadius: scale(8), padding: scale(10), marginBottom: scale(12) }}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Phone Number"
                keyboardType="phone-pad"
                placeholderTextColor={theme.textTertiary}
              />

              <Text style={{ color: theme.textSecondary, fontSize: scale(12), marginBottom: scale(4) }}>Qualification</Text>
              <TextInput
                style={{ backgroundColor: theme.backgroundSecondary, color: theme.text, borderRadius: scale(8), padding: scale(10), marginBottom: scale(12) }}
                value={editQualification}
                onChangeText={setEditQualification}
                placeholder="e.g., M.Sc Mathematics"
                placeholderTextColor={theme.textTertiary}
              />

              <Text style={{ color: theme.textSecondary, fontSize: scale(12), marginBottom: scale(4) }}>Experience</Text>
              <TextInput
                style={{ backgroundColor: theme.backgroundSecondary, color: theme.text, borderRadius: scale(8), padding: scale(10), marginBottom: scale(20) }}
                value={editExperience}
                onChangeText={setEditExperience}
                placeholder="e.g., 5 Years"
                placeholderTextColor={theme.textTertiary}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => setEditModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={saveProfile}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
`;

content = content.replace("    </View>\n  );\n};", modalUI + "    </View>\n  );\n};");

fs.writeFileSync(file, content);
console.log('Modified TeacherProfileScreen.tsx successfully!');
