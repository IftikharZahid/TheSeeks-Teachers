const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens');

function fixMissingStatusBar(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  if (content.includes('StatusBar') && content.includes(`from 'react-native'`)) {
    // If it has StatusBar usage, but react-native import lacks it
    content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['"]react-native['"];/g, (match, p1) => {
      const parts = p1.split(',').map(s => s.trim()).filter(Boolean);
      if (!parts.includes('StatusBar')) {
        parts.push('StatusBar');
      }
      return `import { ${parts.join(', ')} } from 'react-native';`;
    });
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Added StatusBar back to ' + path.basename(filePath));
  }
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (file.endsWith('.tsx')) {
       fixMissingStatusBar(fullPath);
    }
  }
}

traverse(screensDir);
