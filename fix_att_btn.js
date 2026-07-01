const fs = require('fs');
const filePath = 'src/screens/academics/AttendanceClassesListScreen.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldBtn = `<TouchableOpacity
          style={{ 
            width: scale(38), 
            height: scale(38), 
            borderRadius: scale(12), 
            backgroundColor: 'rgba(255, 255, 255, 0.15)', 
            justifyContent: 'center', 
            alignItems: 'center', 
            marginRight: scale(12) 
          }} 
        >
          <Ionicons name="arrow-back" size={scale(22)} color="#ffffff" />
        </TouchableOpacity>`;

const newBtn = `<TouchableOpacity
          style={{ 
            width: scale(38), 
            height: scale(38), 
            borderRadius: scale(12), 
            backgroundColor: 'rgba(255, 255, 255, 0.15)', 
            justifyContent: 'center', 
            alignItems: 'center', 
            marginRight: scale(12) 
          }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={scale(22)} color="#ffffff" />
        </TouchableOpacity>`;

if (content.includes(oldBtn)) {
  content = content.replace(oldBtn, newBtn);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed');
} else {
  console.log('Not found');
}
