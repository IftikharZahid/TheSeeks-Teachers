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

  // Manual parsing for reliable replacement
  let result = '';
  let i = 0;
  let changed = false;

  while (i < content.length) {
    let startIdx = content.indexOf('<TouchableOpacity', i);
    if (startIdx === -1) {
      result += content.substring(i);
      break;
    }

    // Find the closing '>' of the opening tag
    let count = 0;
    let endOfOpeningTag = -1;
    for (let j = startIdx + 17; j < content.length; j++) {
      if (content[j] === '{') count++;
      else if (content[j] === '}') count--;
      else if (content[j] === '>' && count === 0) {
        endOfOpeningTag = j;
        break;
      }
    }

    if (endOfOpeningTag === -1) {
      result += content.substring(i, startIdx + 17);
      i = startIdx + 17;
      continue;
    }

    let openingTag = content.substring(startIdx, endOfOpeningTag + 1);

    // Find closing tag </TouchableOpacity>
    let closingTagIdx = content.indexOf('</TouchableOpacity>', endOfOpeningTag);
    if (closingTagIdx === -1) {
      result += content.substring(i, startIdx + 17);
      i = startIdx + 17;
      continue;
    }

    let innerContent = content.substring(endOfOpeningTag + 1, closingTagIdx);
    
    // Check if inner content ONLY contains an arrow-back or chevron-back Ionicons
    // We can just check if it contains arrow-back or chevron-back and doesn't contain a lot of other things
    if ((innerContent.includes('name="arrow-back"') || innerContent.includes("name='arrow-back'") ||
         innerContent.includes('name="chevron-back"') || innerContent.includes("name='chevron-back'")) &&
        innerContent.includes('<Ionicons')) {
          
        let onPressStr = extractOnPress(openingTag);
        let replacement = `<TouchableOpacity${standardButtonProps}\n        ${onPressStr}\n      >\n        <Ionicons name="arrow-back" size={scale(22)} color="#ffffff" />\n      </TouchableOpacity>`;
        
        result += content.substring(i, startIdx) + replacement;
        i = closingTagIdx + 19; // length of </TouchableOpacity>
        changed = true;
    } else {
      result += content.substring(i, endOfOpeningTag + 1);
      i = endOfOpeningTag + 1;
    }
  }

  content = result;

  if (changed && content !== originalContent) {
    if (!content.includes('import { scale }') && !content.includes('import {scale}')) {
      if (content.includes('utils/responsive')) {
        content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]*)utils\/responsive['"];/, (m, p1, p2) => {
           if (!p1.includes('scale')) return `import { ${p1.trim()}, scale } from '${p2}utils/responsive';`;
           return m;
        });
      } else {
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
