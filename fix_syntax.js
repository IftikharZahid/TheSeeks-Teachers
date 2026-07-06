const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens', 'exams');
const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.tsx') && !f.includes('_backup'));

files.forEach(file => {
    const filePath = path.join(screensDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    const errorRegex = /<\/View>\s*<\/View>\s*<\/View>\s*<\/View>\s*<\/Modal>/g;
    const replacement = `</View>
          </View>
        </View>
      </Modal>`;

    if (content.match(errorRegex)) {
        content = content.replace(errorRegex, replacement);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed extra </View> in ${file}`);
    } else {
        console.log(`No extra </View> found in ${file}`);
    }
});
