const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\USER\\Desktop\\Mobile App Dev\\TheSeeks Projects\\TheSeeks-Teachers\\src\\screens\\diary\\ClassDiaryScreen.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetContent = `          <Text style={[styles.modalSubtitle, { color: 'rgba(255,255,255,0.75)' }]}>{selectedClass}</Text>
        </View>
      </View>`;

const replacementContent = `          <Text style={[styles.modalSubtitle, { color: 'rgba(255,255,255,0.75)' }]}>{selectedClass}</Text>
        </View>

        {/* Save button in header */}
        <TouchableOpacity
          style={{
            width: scale(38),
            height: scale(38),
            borderRadius: scale(12),
            backgroundColor: '#fff',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: scale(2) },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 3,
            opacity: submitting ? 0.6 : 1
          }}
          onPress={handleSave}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Ionicons name="checkmark" size={scale(22)} color={theme.primary} />
          )}
        </TouchableOpacity>
      </View>`;

if (content.includes(targetContent)) {
  content = content.replace(targetContent, replacementContent);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Save button successfully added to header.');
} else {
  console.log('Target content not found.');
}
