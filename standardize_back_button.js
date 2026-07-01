const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens');

const standardButtonProps = `
        style={{ 
          width: scale(38), 
          height: scale(38), 
          borderRadius: scale(12), 
          backgroundColor: 'rgba(255, 255, 255, 0.15)', 
          justifyContent: 'center', 
          alignItems: 'center', 
          marginRight: scale(12) 
        }} 
        activeOpacity={0.7}`;

function extractOnPress(str) {
  let idx = str.indexOf('onPress={');
  if (idx === -1) return "onPress={() => navigation.goBack()}";
  let count = 0;
  let start = idx + 8; // index of '{'
  for (let i = start; i < str.length; i++) {
    if (str[i] === '{') count++;
    else if (str[i] === '}') {
      count--;
      if (count === 0) {
        return str.substring(idx, i + 1);
      }
    }
  }
  return "onPress={() => navigation.goBack()}"; // fallback
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // We are looking for a TouchableOpacity containing an arrow-back or chevron-back icon
  const buttonRegex = /<TouchableOpacity([^>]*?)>[\s\n]*<Ionicons\s+name=["'](?:arrow-back|chevron-back)["'][^>]*?\/>[\s\n]*<\/TouchableOpacity>/g;

  content = content.replace(buttonRegex, (match, p1) => {
    let onPressStr = extractOnPress(p1);

    return `<TouchableOpacity${standardButtonProps}
        ${onPressStr}
      >
        <Ionicons name="arrow-back" size={scale(22)} color="#ffffff" />
      </TouchableOpacity>`;
  });

  // Make sure `scale` is imported if we are using it
  if (content !== originalContent) {
    if (!content.includes('import { scale }') && !content.includes('import {scale}')) {
      if (content.includes('utils/responsive')) {
        content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]*)utils\/responsive['"];/, (m, p1, p2) => {
           if (!p1.includes('scale')) return `import { ${p1.trim()}, scale } from '${p2}utils/responsive';`;
           return m;
        });
      } else {
        // Need to add scale import
        let relativePath = path.relative(path.dirname(filePath), path.join(__dirname, 'src', 'utils', 'responsive')).replace(/\\\\/g, '/');
        if (!relativePath.startsWith('.')) relativePath = './' + relativePath;
        content = `import { scale } from '${relativePath}';\n` + content;
      }
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Standardized back button in ' + path.basename(filePath));
  }
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (file.endsWith('.tsx')) {
       processFile(fullPath);
    }
  }
}

traverse(screensDir);
