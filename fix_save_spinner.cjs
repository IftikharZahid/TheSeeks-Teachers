const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'screens', 'exams');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') && !f.includes('_backup'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    if (!content.includes('const [isSaving, setIsSaving]')) {
        content = content.replace(
            'const [modalVisible, setModalVisible] = useState(false);',
            'const [modalVisible, setModalVisible] = useState(false);\n  const [isSaving, setIsSaving] = useState(false);'
        );
    }

    if (content.includes('const handleSaveExam = async () => {') && !content.includes('const _handleSaveExamCore = async () => {')) {
        content = content.replace('const handleSaveExam = async () => {', 'const _handleSaveExamCore = async () => {');
        
        const wrapper = `
  const handleSaveExam = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await _handleSaveExamCore();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExam`;

        content = content.replace(/\s+const handleDeleteExam/g, '\n\n' + wrapper);
    }

    content = content.replace(
        /<TouchableOpacity onPress=\{handleSaveExam\} style=\{\{ paddingHorizontal: scale\(14\)(.*?)\}\}>/g,
        '<TouchableOpacity disabled={isSaving} onPress={handleSaveExam} style={{ paddingHorizontal: scale(14)$1, opacity: isSaving ? 0.7 : 1 }}>'
    );
    content = content.replace(
        /<Ionicons name="checkmark" size=\{16\} color=\{isDark \? theme\.text : '#fff'\} \/>[\s\r\n]*<Text style=\{\{ fontSize: scale\(12\), fontWeight: '700', color: '#fff' \}\}>Save<\/Text>/g,
        `{isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark" size={16} color={isDark ? theme.text : '#fff'} />}\n              <Text style={{ fontSize: scale(12), fontWeight: '700', color: '#fff' }}>{isSaving ? '...' : 'Save'}</Text>`
    );

    content = content.replace(
        /<TouchableOpacity onPress=\{handleSaveExam\} style=\{\[styles\.fsFormSaveButton([^\]]*)\]\}>/g,
        '<TouchableOpacity disabled={isSaving} onPress={handleSaveExam} style={[styles.fsFormSaveButton$1, { opacity: isSaving ? 0.7 : 1 }]}>'
    );
    
    content = content.replace(
        /<Ionicons name=\{editingExam \? 'checkmark-circle' : 'save-outline'\} size=\{18\} color=\{isDark \? theme\.text : '#fff'\} \/>[\s\r\n]*<Text style=\{styles\.fsFormSaveButtonText\}>\{editingExam \? 'Update Record' : 'Save Record'\}<\/Text>/g,
        `{isSaving ? <ActivityIndicator size="small" color={isDark ? theme.text : '#fff'} /> : <Ionicons name={editingExam ? 'checkmark-circle' : 'save-outline'} size={18} color={isDark ? theme.text : '#fff'} />}\n                <Text style={styles.fsFormSaveButtonText}>{isSaving ? 'Processing...' : (editingExam ? 'Update Record' : 'Save Record')}</Text>`
    );

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed spinner in', file);
});
