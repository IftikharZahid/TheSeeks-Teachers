const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // We want to insert the absolute view before StatusBar IF it's not already there
  // AND the file uses the theme.primary header
  
  if (content.includes('backgroundColor={theme.primary}') && content.includes('<StatusBar')) {
    if (!content.includes("position: 'absolute', top: 0, left: 0, right: 0, height: StatusBar.currentHeight")) {
      
      // Find where the StatusBar is, and insert the View right before it.
      // Easiest is to replace StatusBar with the View + StatusBar
      content = content.replace(
        /(<StatusBar[^>]*backgroundColor=\{theme\.primary\}[^>]*\/>)/g,
        `<View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: StatusBar.currentHeight || 0, backgroundColor: theme.primary, zIndex: 999 }} />\n      $1`
      );
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed transition in ' + path.basename(filePath));
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
