const fs = require('fs');
const path = require('path');

const files = [
  'Class9thExamsScreen.tsx',
  'Class10thExamsScreen.tsx',
  'Class1stYearExamsScreen.tsx',
  'Class2ndYearExamsScreen.tsx',
  'GenericExamsScreen.tsx'
];

const dir = 'd:/ZahidCodes/TheSeeks-Teachers/src/screens/exams';

for (const file of files) {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) {
    console.log('Skipping ' + file + ', not found');
    continue;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add searchQuery state
  if (!content.includes('const [searchQuery, setSearchQuery]')) {
    content = content.replace(
      /const \[filterGender, setFilterGender\] = useState\('All'\);/g,
      "const [filterGender, setFilterGender] = useState('All');\n  const [searchQuery, setSearchQuery] = useState('');"
    );
  }

  // 2. Add matchesSearch logic
  if (!content.includes('const matchesSearch =')) {
    content = content.replace(
      /matchesGender = isBoys \? \(g === 'male' \|\| g === 'boy' \|\| g === 'm'\) : \(g === 'female' \|\| g === 'girl' \|\| g === 'f'\);\n\s*\}\n\s*return matchesTestNo && matchesGender;/g,
      `matchesGender = isBoys ? (g === 'male' || g === 'boy' || g === 'm') : (g === 'female' || g === 'girl' || g === 'f');
      }
      const matchesSearch = searchQuery ? (e.studentName || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) : true;
      return matchesTestNo && matchesGender && matchesSearch;`
    );
  }

  // 3. Update activeFilterCount
  content = content.replace(
    /const activeFilterCount = \(filterTestNo \? 1 : 0\) \+ \(filterGender !== 'All' \? 1 : 0\);/g,
    "const activeFilterCount = (filterTestNo ? 1 : 0) + (filterGender !== 'All' ? 1 : 0) + (searchQuery.trim() !== '' ? 1 : 0);"
  );

  // 4. Update UI
  const newUI = `{/* ── Filter Dropdowns Row ── */}
      <View style={styles.filterRow}>

        {/* ── Filter: Search ── */}
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', height: scale(30), paddingHorizontal: scale(8), borderRadius: scale(7), backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, marginRight: scale(4) }}>
          <Ionicons name="search" size={14} color={theme.textSecondary} style={{ marginRight: scale(4) }} />
          <TextInput
            style={{ flex: 1, fontSize: scale(10), color: theme.text, padding: 0 }}
            placeholder="Search student..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={14} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Filter: Test No ── */}
        <View style={{ width: scale(80), position: 'relative', zIndex: 400 }}>
          <TouchableOpacity
            ref={filterTestNoAnchorRef}
            onPress={() => {
              setShowFilterTestNoDropdown(!showFilterTestNoDropdown);
              setShowFilterGenderDropdown(false);
            }}
            style={{
              flexDirection: 'row', alignItems: 'center', height: scale(30), paddingHorizontal: scale(6), borderRadius: scale(7),
              backgroundColor: filterTestNo ? theme.primary + '10' : theme.card,
              borderWidth: 1, borderColor: filterTestNo ? theme.primary + '30' : theme.border,
            }}
          >
            {!filterTestNo && <Ionicons name="document-text-outline" size={11} color={theme.textSecondary} style={{ marginRight: scale(2) }} />}
            <Text style={{ color: filterTestNo ? theme.primary : theme.textSecondary, flex: 1, fontSize: scale(9), fontWeight: filterTestNo ? '600' : '500' }} numberOfLines={1}>
              {filterTestNo || 'Test'}
            </Text>
            <Ionicons name={showFilterTestNoDropdown ? 'chevron-up' : 'chevron-down'} size={11} color={filterTestNo ? theme.primary : theme.textSecondary} style={{ marginLeft: scale(2) }} />
          </TouchableOpacity>
          {showFilterTestNoDropdown && (
            <View style={{ position: 'absolute', top: scale(34), left: 0, right: 0, zIndex: 2000 }}>
              <DropdownMenu
                options={[
                  { label: 'All Tests', value: '', icon: 'apps-outline' },
                  ...dynamicTestOptions.map(t => ({ label: t, value: t, icon: 'document-text-outline' })),
                ]}
                selectedValue={filterTestNo}
                onSelect={(val) => { setFilterTestNo(val); setShowFilterTestNoDropdown(false); }}
                theme={theme}
                zIndex={2000}
                maxHeight={DROPDOWN_ITEM_HEIGHT * 5}
                showScrollBar={true}
                anchorRef={filterTestNoAnchorRef}
                onClose={() => setShowFilterTestNoDropdown(false)}
              />
            </View>
          )}
        </View>

        {/* ── Filter: Gender ── */}
        <View style={{ width: scale(75), position: 'relative', zIndex: 300 }}>
          <TouchableOpacity
            ref={filterGenderAnchorRef}
            onPress={() => {
              setShowFilterGenderDropdown(!showFilterGenderDropdown);
              setShowFilterTestNoDropdown(false);
            }}
            style={{
              flexDirection: 'row', alignItems: 'center', height: scale(30), paddingHorizontal: scale(6), borderRadius: scale(7),
              backgroundColor: filterGender !== 'All' ? theme.primary + '10' : theme.card,
              borderWidth: 1, borderColor: filterGender !== 'All' ? theme.primary + '30' : theme.border,
            }}
          >
            {filterGender === 'All' && <Ionicons name="people-outline" size={11} color={theme.textSecondary} style={{ marginRight: scale(2) }} />}
            <Text style={{ color: filterGender !== 'All' ? theme.primary : theme.textSecondary, flex: 1, fontSize: scale(9), fontWeight: filterGender !== 'All' ? '600' : '500' }} numberOfLines={1}>
              {filterGender === 'All' ? 'Gender' : filterGender}
            </Text>
            <Ionicons name={showFilterGenderDropdown ? 'chevron-up' : 'chevron-down'} size={11} color={filterGender !== 'All' ? theme.primary : theme.textSecondary} style={{ marginLeft: scale(2) }} />
          </TouchableOpacity>
          {showFilterGenderDropdown && (
            <View style={{ position: 'absolute', top: scale(34), right: 0, zIndex: 2000, width: scale(100) }}>
              <DropdownMenu
                options={[
                  { label: 'All', value: 'All', icon: 'people-outline' },
                  { label: 'Boys', value: 'Boys', icon: 'man-outline' },
                  { label: 'Girls', value: 'Girls', icon: 'woman-outline' },
                ]}
                selectedValue={filterGender}
                onSelect={(val) => { setFilterGender(val); setShowFilterGenderDropdown(false); }}
                theme={theme}
                zIndex={2000}
                maxHeight={DROPDOWN_ITEM_HEIGHT * 3}
                anchorRef={filterGenderAnchorRef}
                onClose={() => setShowFilterGenderDropdown(false)}
              />
            </View>
          )}
        </View>

      </View>`;

  const filterRowRegex = /\{\/\*\s*── Filter Dropdowns Row ──\s*\*\/\}\s*<View style=\{styles\.filterRow\}>[\s\S]*?\{\/\*\s*── Filter: Gender ──\s*\*\/\}(?:(?!<\/View>\s*<\/View>\s*\{activeFilterCount > 0)[\s\S])*<\/View>\s*<\/View>/g;
  
  if (content.match(filterRowRegex)) {
    content = content.replace(filterRowRegex, newUI);
  } else {
    console.log('Failed to match filter row regex in ' + file);
  }

  fs.writeFileSync(filePath, content);
  console.log('Updated ' + file);
}
