const fs = require('fs');

let profileFile = 'd:/ZahidCodes/TheSeeks-Teachers/src/screens/settings/TeacherProfileScreen.tsx';
let content = fs.readFileSync(profileFile, 'utf8');

// Normalize line endings for easier matching
content = content.replace(/\r\n/g, '\n');

// 1. Add editingField state if not present
if (!content.includes('const [editingField')) {
  content = content.replace(
    /const \[editModalVisible, setEditModalVisible\] = React\.useState\(false\);/,
    "const [editModalVisible, setEditModalVisible] = React.useState(false);\n  const [editingField, setEditingField] = React.useState<string | null>(null);"
  );
}

// 2. Change openEditModal to openSpecificEdit
content = content.replace(
  /const openEditModal = \(\) => \{([\s\S]*?)\};/,
  `const openSpecificEdit = (field: string | null = null) => {$1  setEditingField(field);\n};`
);
content = content.replace(/openEditModal/g, "() => openSpecificEdit(null)");

// 3. Update InfoRow
// Safely match InfoRow
const infoRowRegex = /const InfoRow = \(\{ icon, iconColor, label, value, theme \}: any\) => \([\s\S]*?<\/View>\s*<\/View>\s*\);/;

const newInfoRow = `const InfoRow = ({ icon, iconColor, label, value, theme, onEdit }: any) => (
  <View style={styles.infoRow}>
    <View style={[styles.iconWrap, { backgroundColor: iconColor + '15' }]}>
      <Ionicons name={icon} size={scale(16)} color={iconColor} />
    </View>
    <View style={[styles.infoTexts, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
      <View style={{ flex: 1, paddingRight: scale(10) }}>
        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
      </View>
      {onEdit && (
        <TouchableOpacity 
          onPress={onEdit}
          style={{ width: scale(28), height: scale(28), borderRadius: scale(14), backgroundColor: theme.primary + '15', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil" size={scale(14)} color={theme.primary} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);`;

if (infoRowRegex.test(content)) {
  content = content.replace(infoRowRegex, newInfoRow);
  console.log('Replaced InfoRow component');
} else {
  console.log('Could not find InfoRow component');
}

// 4. Update InfoRow usages
content = content.replace(
  /<InfoRow icon="ribbon-outline" iconColor="#db2777" label="Qualification" value=\{displayQualification\} theme=\{theme\} \/>/g,
  `<InfoRow icon="ribbon-outline" iconColor="#db2777" label="Qualification" value={displayQualification} theme={theme} onEdit={() => openSpecificEdit('qualification')} />`
);
content = content.replace(
  /<InfoRow icon="calendar-outline" iconColor="#7c3aed" label="Experience" value=\{displayExperience\} theme=\{theme\} \/>/g,
  `<InfoRow icon="calendar-outline" iconColor="#7c3aed" label="Experience" value={displayExperience} theme={theme} onEdit={() => openSpecificEdit('experience')} />`
);
content = content.replace(
  /<InfoRow icon="call-outline" iconColor="#ea580c" label="Phone" value=\{displayPhone\} theme=\{theme\} \/>/g,
  `<InfoRow icon="call-outline" iconColor="#ea580c" label="Phone" value={displayPhone} theme={theme} onEdit={() => openSpecificEdit('phone')} />`
);

// 5. Update JSX in Modal (PROPER JSX SYNTAX)
// I will use string replace to be safe.
const modalScrollRegex = /<ScrollView style=\{\{ width: '100%', maxHeight: scale\(400\) \}\} showsVerticalScrollIndicator=\{false\}>[\s\S]*?<\/ScrollView>/;

const newModalScroll = `<ScrollView style={{ width: '100%', maxHeight: scale(400) }} showsVerticalScrollIndicator={false}>
              
              {(!editingField || editingField === 'image') && (<TouchableOpacity onPress={pickImage} style={{ alignSelf: 'center', marginVertical: scale(10) }}>
                <Image
                  source={editImage ? { uri: editImage } : require('../../../assets/icon.png')}
                  style={{ width: scale(80), height: scale(80), borderRadius: scale(40), backgroundColor: '#eee' }}
                />
                <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.primary, borderRadius: scale(12), padding: scale(4) }}>
                  <Ionicons name="camera" size={scale(16)} color="#fff" />
                </View>
              </TouchableOpacity>)}

              {(!editingField || editingField === 'name') && (
                <React.Fragment>
                  <Text style={{ color: theme.textSecondary, fontSize: scale(12), marginBottom: scale(4) }}>Full Name</Text>
                  <TextInput
                    style={{ backgroundColor: theme.backgroundSecondary, color: theme.text, borderRadius: scale(8), padding: scale(10), marginBottom: scale(12) }}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Full Name"
                    placeholderTextColor={theme.textTertiary}
                  />
                </React.Fragment>
              )}

              {(!editingField || editingField === 'phone') && (
                <React.Fragment>
                  <Text style={{ color: theme.textSecondary, fontSize: scale(12), marginBottom: scale(4) }}>Phone Number</Text>
                  <TextInput
                    style={{ backgroundColor: theme.backgroundSecondary, color: theme.text, borderRadius: scale(8), padding: scale(10), marginBottom: scale(12) }}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="Phone Number"
                    keyboardType="phone-pad"
                    placeholderTextColor={theme.textTertiary}
                  />
                </React.Fragment>
              )}

              {(!editingField || editingField === 'qualification') && (
                <React.Fragment>
                  <Text style={{ color: theme.textSecondary, fontSize: scale(12), marginBottom: scale(4) }}>Qualification</Text>
                  <TextInput
                    style={{ backgroundColor: theme.backgroundSecondary, color: theme.text, borderRadius: scale(8), padding: scale(10), marginBottom: scale(12) }}
                    value={editQualification}
                    onChangeText={setEditQualification}
                    placeholder="e.g., M.Sc Mathematics"
                    placeholderTextColor={theme.textTertiary}
                  />
                </React.Fragment>
              )}

              {(!editingField || editingField === 'experience') && (
                <React.Fragment>
                  <Text style={{ color: theme.textSecondary, fontSize: scale(12), marginBottom: scale(4) }}>Experience</Text>
                  <TextInput
                    style={{ backgroundColor: theme.backgroundSecondary, color: theme.text, borderRadius: scale(8), padding: scale(10), marginBottom: scale(20) }}
                    value={editExperience}
                    onChangeText={setEditExperience}
                    placeholder="e.g., 5 Years"
                    placeholderTextColor={theme.textTertiary}
                  />
                </React.Fragment>
              )}
            </ScrollView>`;

if (modalScrollRegex.test(content)) {
  content = content.replace(modalScrollRegex, newModalScroll);
  console.log('Replaced Modal ScrollView block');
} else {
  console.log('Could not find Modal ScrollView block');
}

fs.writeFileSync(profileFile, content);
console.log('Fixed inline logic in TeacherProfileScreen.tsx');
