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

  // Fix the accidental replace of all Modals' ending.
  // We want to restore </View></View></Modal> for all EXCEPT the showOptionsModal.
  // The showOptionsModal is the very last Modal in the file.
  
  // First, let's revert all </ScrollView></View></Modal> that we added, back to </View></View></Modal>
  // Wait, the showOptionsModal originally had </View></View></Modal>.
  // But we want showOptionsModal to end with </ScrollView></View></Modal>.
  
  // Actually, we can split by showOptionsModal, fix the first half, and keep the second half.
  const modalStartStr = '<Modal visible={showOptionsModal}';
  const splitIndex = content.indexOf(modalStartStr);
  
  if (splitIndex !== -1) {
    let firstHalf = content.substring(0, splitIndex);
    let secondHalf = content.substring(splitIndex);
    
    // In the first half, any </ScrollView>\n        </View>\n      </Modal> should be reverted.
    firstHalf = firstHalf.replace(/<\/ScrollView>\s*<\/View>\s*<\/Modal>/g, '</View>\n        </View>\n      </Modal>');
    
    // And what if my regex also replaced something else?
    // Let's also check if secondHalf has </ScrollView></View></Modal>. Yes it should.
    
    content = firstHalf + secondHalf;
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed syntax in', f);
  }
});
