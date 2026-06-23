const fs = require('fs');
let script = fs.readFileSync('fix_everything.js', 'utf8');
script = script.replace("'GenericExamsScreen.tsx',", "");
fs.writeFileSync('fix_classes_only.js', script);
console.log('Created fix_classes_only.js');
