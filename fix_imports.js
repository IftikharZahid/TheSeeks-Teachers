const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens');

function fixDuplicates(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // We need to fix `import { ..., StatusBar, StatusBar } from 'react-native'` or similar
  content = content.replace(/,\s*StatusBar\s*,/g, ', ');
  content = content.replace(/StatusBar\s*,\s*StatusBar/g, 'StatusBar');
  // Or if it was added like `import { View, Text, StatusBar, StatusBar } from 'react-native'`
  
  // A robust way is to extract the react-native import, parse it, and deduplicate
  content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['"]react-native['"];/g, (match, p1) => {
    const parts = p1.split(',').map(s => s.trim()).filter(Boolean);
    const unique = [...new Set(parts)];
    return `import { ${unique.join(', ')} } from 'react-native';`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed imports in ' + path.basename(filePath));
  }
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (file.endsWith('.tsx')) {
       fixDuplicates(fullPath);
    }
  }
}

traverse(screensDir);
