const fs = require('fs');

let profileFile = 'd:/ZahidCodes/TheSeeks-Teachers/src/screens/settings/TeacherProfileScreen.tsx';
let content = fs.readFileSync(profileFile, 'utf8');

// 1. Add editingField state
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

// We should replace any usage of openEditModal
content = content.replace(/openEditModal/g, "() => openSpecificEdit(null)");

// 3. Update InfoRow definition
const oldInfoRow = `const InfoRow = ({ icon, iconColor, label, value, theme }: any) => (
  <View style={styles.infoRow}>
    <View style={[styles.iconWrap, { backgroundColor: iconColor + '15' }]}>
      <Ionicons name={icon} size={scale(16)} color={iconColor} />
    </View>
    <View style={styles.infoTexts}>
      <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
    </View>
  </View>
);`;

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

content = content.replace(oldInfoRow, newInfoRow);

// 4. Update InfoRows in JSX
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

// 5. Update Modal JSX to conditionally render based on editingField
// For Image
content = content.replace(
  /<TouchableOpacity onPress=\{pickImage\}/g,
  `{(!editingField || editingField === 'image') && (<TouchableOpacity onPress={pickImage}`
);
content = content.replace(
  /<\/TouchableOpacity>\s*<Text style=\{\{ color: theme\.textSecondary, fontSize: scale\(12\), marginBottom: scale\(4\) \}\}>Full Name<\/Text>/,
  `</TouchableOpacity>)}\n\n              {(!editingField || editingField === 'name') && (<>\n              <Text style={{ color: theme.textSecondary, fontSize: scale(12), marginBottom: scale(4) }}>Full Name</Text>`
);

// For Name
content = content.replace(
  /placeholderTextColor=\{theme\.textTertiary\}\s*\/>\s*<Text style=\{\{ color: theme\.textSecondary, fontSize: scale\(12\), marginBottom: scale\(4\) \}\}>Phone<\/Text>/,
  `placeholderTextColor={theme.textTertiary}\n              />\n              </>)}\n\n              {(!editingField || editingField === 'phone') && (<>\n              <Text style={{ color: theme.textSecondary, fontSize: scale(12), marginBottom: scale(4) }}>Phone</Text>`
);

// For Phone
content = content.replace(
  /keyboardType="phone-pad"\s*\/>\s*<Text style=\{\{ color: theme\.textSecondary, fontSize: scale\(12\), marginBottom: scale\(4\) \}\}>Qualification<\/Text>/,
  `keyboardType="phone-pad"\n              />\n              </>)}\n\n              {(!editingField || editingField === 'qualification') && (<>\n              <Text style={{ color: theme.textSecondary, fontSize: scale(12), marginBottom: scale(4) }}>Qualification</Text>`
);

// For Qualification
content = content.replace(
  /placeholderTextColor=\{theme\.textTertiary\}\s*\/>\s*<Text style=\{\{ color: theme\.textSecondary, fontSize: scale\(12\), marginBottom: scale\(4\) \}\}>Experience \(Years\)<\/Text>/,
  `placeholderTextColor={theme.textTertiary}\n              />\n              </>)}\n\n              {(!editingField || editingField === 'experience') && (<>\n              <Text style={{ color: theme.textSecondary, fontSize: scale(12), marginBottom: scale(4) }}>Experience (Years)</Text>`
);

// For Experience (Close the conditional)
content = content.replace(
  /keyboardType="numeric"\s*\/>\s*<\/ScrollView>/,
  `keyboardType="numeric"\n              />\n              </>)}\n            </ScrollView>`
);


fs.writeFileSync(profileFile, content);
console.log('Updated TeacherProfileScreen.tsx with inline editing fields');
