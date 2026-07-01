import os
import re

exams_dir = 'src/screens/exams'
files_to_fix = [
    'GenericExamsScreen.tsx',
    'Class9thExamsScreen.tsx',
    'Class10thExamsScreen.tsx',
    'Class1stYearExamsScreen.tsx',
    'Class2ndYearExamsScreen.tsx'
]

for filename in files_to_fix:
    filepath = os.path.join(exams_dir, filename)
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original_content = content

    # Fix the missing Footer closing View in the Modal
    # Replace:
    # </TouchableOpacity>\s*</KeyboardAvoidingView>\s*</View>\s*</Modal>
    # with
    # </TouchableOpacity>\s*</View>\s*</KeyboardAvoidingView>\s*</View>\s*</Modal>
    fix_modal_close_regex = r'</TouchableOpacity>\s*</KeyboardAvoidingView>\s*</View>\s*</Modal>'
    fix_modal_close_replacement = '''</TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>'''
    content = re.sub(fix_modal_close_regex, fix_modal_close_replacement, content)

    # Replace end of file </SafeAreaView> with </View>
    end_view_regex = r'</Modal>\s*</SafeAreaView>\s*\);\s*};'
    end_view_replacement = '''</Modal>
    </View>
  );
};'''
    content = re.sub(end_view_regex, end_view_replacement, content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {filename}")
    else:
        print(f"No changes made to {filename}")
