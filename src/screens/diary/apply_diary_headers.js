const fs = require('fs');
const path = require('path');

const directory = __dirname;
// Filter for real screen files, excluding backups and scripts
const files = fs.readdirSync(directory).filter(f => f.endsWith('.tsx') && !f.includes('backup'));

for (const file of files) {
    const filePath = path.join(directory, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Change header background from dark mode conditional to theme.primary
    content = content.replace(/backgroundColor:\s*isDark\s*\?\s*theme\.card\s*:\s*theme\.primary/g, "backgroundColor: theme.primary");
    content = content.replace(/borderBottomColor:\s*isDark\s*\?\s*theme\.border\s*:\s*'transparent'/g, "borderBottomColor: 'transparent'");

    // 2. Change header back button background
    content = content.replace(/backgroundColor:\s*isDark\s*\?\s*theme\.border\s*:\s*'rgba\(255,\s*255,\s*255,\s*0\.15\)'/g, "backgroundColor: 'rgba(255, 255, 255, 0.15)'");

    // 3. Ensure styles.header has borderBottomLeftRadius and borderBottomRightRadius
    if (content.includes('header: {') || content.includes('header:  {') || content.includes('header:\n')) {
        if (!content.includes('borderBottomLeftRadius: scale(24)')) {
            content = content.replace(/header:\s*\{/, "header: { borderBottomLeftRadius: scale(24), borderBottomRightRadius: scale(24),");
        }
    }
    
    // 4. Change status bar absolute view back to theme.primary if it was isDark ? theme.card : theme.primary
    content = content.replace(/<View style=\{\{\s*position:\s*'absolute',\s*top:\s*0,\s*left:\s*0,\s*right:\s*0,\s*height:\s*StatusBar\.currentHeight\s*\|\|\s*0,\s*backgroundColor:\s*isDark\s*\?\s*theme\.card\s*:\s*theme\.primary,\s*zIndex:\s*999\s*\}\}\s*\/>/g, "<View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: StatusBar.currentHeight || 0, backgroundColor: theme.primary, zIndex: 999 }} />");
    content = content.replace(/<StatusBar barStyle="light-content" backgroundColor=\{isDark \? theme\.card : theme\.primary\} translucent=\{false\} \/>/g, "<StatusBar barStyle=\"light-content\" backgroundColor={theme.primary} translucent={false} />");
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Processed ${file}`);
}
