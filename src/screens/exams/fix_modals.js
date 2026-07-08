const fs = require('fs');
const path = require('path');

const files = [
  'Class9thExamsScreen.tsx',
  'Class10thExamsScreen.tsx',
  'Class1stYearExamsScreen.tsx',
  'Class2ndYearExamsScreen.tsx',
  'GenericExamsScreen.tsx'
];

files.forEach(f => {
  const filePath = path.join(__dirname, f);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  // Fix 1: KeyboardAvoidingView behavior on Android inside translucent modal
  // We change `behavior={Platform.OS === 'ios' ? 'padding' : undefined}` to `behavior="padding"`
  content = content.replace(/behavior=\{Platform\.OS === 'ios' \? 'padding' : undefined\}/g, 'behavior="padding"');
  
  // Fix 2: Bottom action buttons pushed behind navigation keys in Result Detail Modal
  // We replace `marginTop: 'auto'` with `marginTop: scale(10)`
  content = content.replace(/marginTop: 'auto'/g, "marginTop: scale(10)");
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', f);
  } else {
    console.log('No changes needed for', f);
  }
});
