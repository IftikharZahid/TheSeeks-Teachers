const fs = require('fs');
const glob = require('glob');

const files = glob.sync('c:/Users/USER/Desktop/Mobile App Dev/TheSeeks Projects/TheSeeks-Teachers/src/screens/**/*.tsx');
let count = 0;

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;

  // Add isDark to useTheme if it's missing (only if we are going to use it)
  if (content.includes('<StatusBar') && content.includes('theme.primary')) {
    if (!content.includes('isDark')) {
      content = content.replace(/const\s+\{\s*theme\s*\}\s*=\s*useTheme\(\);/g, 'const { theme, isDark } = useTheme();');
    }
  }

  // Replace TeacherDashboardScreen
  content = content.replace(
    /<StatusBar backgroundColor="#1e3a8a" barStyle="light-content" translucent=\{false\} \/>/g,
    '<StatusBar backgroundColor={isDark ? theme.card : "#1e3a8a"} barStyle="light-content" translucent={false} />'
  );

  // Replace other StatusBars with theme.primary
  // Be careful not to replace already patched ones.
  // Match exact string: backgroundColor={theme.primary}
  content = content.replace(
    /backgroundColor=\{theme\.primary\}/g,
    'backgroundColor={isDark ? theme.card : theme.primary}'
  );

  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    console.log('Patched StatusBar in:', f);
    count++;
  }
});
console.log('Total patched:', count);
