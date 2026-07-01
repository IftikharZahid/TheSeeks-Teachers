const fs = require('fs');
const path = require('path');

const files = [
  'Class9thExamsScreen.tsx',
  'Class10thExamsScreen.tsx',
  'Class1stYearExamsScreen.tsx',
  'Class2ndYearExamsScreen.tsx',
  'GenericExamsScreen.tsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace status bar absolute view
  content = content.replace(
    /backgroundColor:\s*theme\.primary,\s*zIndex:\s*999/g,
    "backgroundColor: isDark ? theme.card : theme.primary, zIndex: 999"
  );

  // Replace header background
  content = content.replace(
    /styles\.header,\s*\{\s*backgroundColor:\s*theme\.primary,\s*borderBottomColor:\s*'transparent'\s*\}/g,
    "styles.header, { backgroundColor: isDark ? theme.card : theme.primary, borderBottomColor: isDark ? theme.border : 'transparent' }"
  );

  // The text color '#ffffff' or '#fff' inside the headerTitle Block is actually fine in dark mode!
  // White text on dark `theme.card` looks standard and readable. 
  // But let's check if we want to change it.
  content = content.replace(
    /color:\s*'#ffffff'\s*\}\]\}>([^<]+)<\/Text>/g,
    "color: isDark ? theme.text : '#ffffff' }]}>$1</Text>"
  );

  content = content.replace(
    /color:\s*'rgba\(255,255,255,0\.7\)'\s*\}\]\}>(.*?)<\/Text>/g,
    "color: isDark ? theme.textSecondary : 'rgba(255,255,255,0.7)' }]}>$1</Text>"
  );

  // Also replace 'rgba(255, 255, 255, 0.15)' backgrounds for the back button 
  content = content.replace(
    /backgroundColor:\s*'rgba\(255,\s*255,\s*255,\s*0\.15\)'/g,
    "backgroundColor: isDark ? theme.border : 'rgba(255, 255, 255, 0.15)'"
  );
  
  // And the new button 'rgba(255,255,255,0.2)'
  content = content.replace(
    /backgroundColor:\s*'rgba\(255,255,255,0\.2\)'/g,
    "backgroundColor: isDark ? theme.primary + '30' : 'rgba(255,255,255,0.2)'"
  );
  
  // Icons inside those buttons
  content = content.replace(
    /color="#ffffff"/g,
    "color={isDark ? theme.text : '#ffffff'}"
  );
  content = content.replace(
    /color="#fff"/g,
    "color={isDark ? theme.text : '#fff'}"
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Patched ' + file);
});
