const fs = require('fs');

function patchLibraryScreen() {
    const file = 'src/screens/academics/TeacherLibraryScreen.tsx';
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace StatusBar
    content = content.replace(
        /<StatusBar barStyle=\{isDark \? 'light-content' : 'dark-content'\} backgroundColor=\{theme\.card\} \/>/,
        `<StatusBar backgroundColor={theme.primary} barStyle="light-content" translucent={false} />`
    );
    
    // Replace header background
    content = content.replace(
        /<View style=\{\[styles\.header, \{ backgroundColor: theme\.card, borderBottomColor: theme\.border \}\]\}>/,
        `<View style={[styles.header, { backgroundColor: theme.primary, borderBottomColor: 'transparent' }]}>`
    );
    
    // Replace headerBtn
    content = content.replace(
        /style=\{styles\.headerBtn\}/g,
        `style={[styles.headerBtn, { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 4 }]}`
    );
    
    // Replace text colors
    content = content.replace(
        /<Ionicons name="arrow-back" size=\{scale\(22\)\} color=\{theme\.text\} \/>/g,
        `<Ionicons name="arrow-back" size={scale(22)} color="#fff" />`
    );
    content = content.replace(
        /<Ionicons name="library" size=\{scale\(26\)\} color="#6366f1"/,
        `<Ionicons name="library" size={scale(26)} color="#fff"`
    );
    content = content.replace(
        /<Text style=\{\[styles\.headerTitle, \{ color: theme\.text \}\]\}>e-Library<\/Text>/,
        `<Text style={[styles.headerTitle, { color: '#fff' }]}>e-Library</Text>`
    );
    content = content.replace(
        /<Text style=\{\[styles\.headerSub, \{ color: theme\.placeholder \}\]\}>Educational resources & materials<\/Text>/,
        `<Text style={[styles.headerSub, { color: 'rgba(255,255,255,0.8)' }]}>Educational resources & materials</Text>`
    );
    
    // Search icon
    content = content.replace(
        /<TouchableOpacity style=\{styles\.searchBtn\} onPress=\{\(\) => setIsSearching\(true\)\}>\s*<Ionicons name="search" size=\{scale\(18\)\} color="#6366f1" \/>\s*<\/TouchableOpacity>/,
        `<TouchableOpacity style={[styles.searchBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]} onPress={() => setIsSearching(true)}>\n              <Ionicons name="search" size={scale(18)} color="#fff" />\n            </TouchableOpacity>`
    );
    
    // Search input
    content = content.replace(
        /<TextInput\s*style=\{\[styles\.searchInput, \{ color: theme\.text, backgroundColor: isDark \? 'rgba\(255,255,255,0\.05\)' : '#f3f4f6' \}\]\}\s*placeholder="Search materials\.\.\."\s*placeholderTextColor=\{theme\.placeholder\}/,
        `<TextInput\n              style={[styles.searchInput, { color: '#fff', backgroundColor: 'rgba(255,255,255,0.2)' }]}\n              placeholder="Search materials..."\n              placeholderTextColor="rgba(255,255,255,0.6)"`
    );
    
    fs.writeFileSync(file, content, 'utf8');
}

function patchDocumentsScreen() {
    const file = 'src/screens/academics/DocumentsScreen.tsx';
    let content = fs.readFileSync(file, 'utf8');
    
    content = content.replace(
        /<StatusBar\s*barStyle=\{isDark \? 'light-content' : 'dark-content'\}\s*backgroundColor=\{theme\.card\}\s*\/>/m,
        `<StatusBar backgroundColor={theme.primary} barStyle="light-content" translucent={false} />`
    );
    
    content = content.replace(
        /<View style=\{\[styles\.header, \{ backgroundColor: theme\.card, borderBottomColor: theme\.border \}\]\}>/,
        `<View style={[styles.header, { backgroundColor: theme.primary, borderBottomColor: 'transparent' }]}>`
    );
    
    content = content.replace(
        /style=\{styles\.headerBtn\}/,
        `style={[styles.headerBtn, { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 4 }]}`
    );
    
    content = content.replace(
        /<Ionicons name="arrow-back" size=\{scale\(22\)\} color=\{theme\.text\} \/>/,
        `<Ionicons name="arrow-back" size={scale(22)} color="#fff" />`
    );
    
    content = content.replace(
        /<Text style=\{\[styles\.headerTitle, \{ color: theme\.text \}\]\} numberOfLines=\{1\}>/,
        `<Text style={[styles.headerTitle, { color: '#fff' }]} numberOfLines={1}>`
    );
    content = content.replace(
        /<Text style=\{\[styles\.headerSub, \{ color: theme\.placeholder \}\]\}>/,
        `<Text style={[styles.headerSub, { color: 'rgba(255,255,255,0.8)' }]>`
    );
    
    content = content.replace(
        /<TouchableOpacity style=\{styles\.searchBtn\} onPress=\{\(\) => setIsSearchActive\(true\)\}>\s*<Ionicons name="search" size=\{scale\(18\)\} color="#6366f1" \/>\s*<\/TouchableOpacity>/,
        `<TouchableOpacity style={[styles.searchBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]} onPress={() => setIsSearchActive(true)}>\n          <Ionicons name="search" size={scale(18)} color="#fff" />\n        </TouchableOpacity>`
    );
    
    content = content.replace(
        /<TouchableOpacity style=\{\[styles\.searchBtn, \{ marginLeft: scale\(8\) \}\]\} onPress=\{\(\) => setShowFilters\(true\)\}>\s*<Ionicons name="options" size=\{scale\(18\)\} color="#6366f1" \/>/,
        `<TouchableOpacity style={[styles.searchBtn, { marginLeft: scale(8), backgroundColor: 'rgba(255,255,255,0.2)' }]} onPress={() => setShowFilters(true)}>\n          <Ionicons name="options" size={scale(18)} color="#fff" />`
    );
    
    // If search is active
    content = content.replace(
        /<View style=\{\[styles\.searchActiveRow, \{ backgroundColor: theme\.card, borderBottomColor: theme\.border \}\]\}>/,
        `<View style={[styles.searchActiveRow, { backgroundColor: theme.primary, borderBottomColor: 'transparent' }]}>`
    );
    
    // We also need to fix the search input inside searchActiveRow
    content = content.replace(
        /<TextInput\s*style=\{\[styles\.searchActiveInput, \{ color: theme\.text, backgroundColor: isDark \? 'rgba\(255,255,255,0\.05\)' : '#f3f4f6' \}\]\}\s*placeholder="Search materials\.\.\."\s*placeholderTextColor=\{theme\.placeholder\}/m,
        `<TextInput\n          style={[styles.searchActiveInput, { color: '#fff', backgroundColor: 'rgba(255,255,255,0.2)' }]}\n          placeholder="Search materials..."\n          placeholderTextColor="rgba(255,255,255,0.6)"`
    );
    content = content.replace(
        /<TouchableOpacity onPress=\{\(\) => \{ setIsSearchActive\(false\); setSearchQuery\(''\); \}\} style=\{styles\.headerBtn\}>\s*<Ionicons name="arrow-back" size=\{scale\(22\)\} color=\{theme\.text\} \/>\s*<\/TouchableOpacity>/,
        `<TouchableOpacity onPress={() => { setIsSearchActive(false); setSearchQuery(''); }} style={[styles.headerBtn, { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 4 }]}>\n          <Ionicons name="arrow-back" size={scale(22)} color="#fff" />\n        </TouchableOpacity>`
    );
    
    fs.writeFileSync(file, content, 'utf8');
}

function patchPastPapersScreen() {
    const file = 'src/screens/academics/PastPapersScreen.tsx';
    let content = fs.readFileSync(file, 'utf8');
    
    content = content.replace(
        /<StatusBar\s*barStyle=\{isDark \? 'light-content' : 'dark-content'\}\s*backgroundColor=\{theme\.card\}\s*\/>/m,
        `<StatusBar backgroundColor={theme.primary} barStyle="light-content" translucent={false} />`
    );
    
    content = content.replace(
        /<View style=\{\[styles\.header, \{ backgroundColor: theme\.card, borderBottomColor: theme\.border \}\]\}>/,
        `<View style={[styles.header, { backgroundColor: theme.primary, borderBottomColor: 'transparent' }]}>`
    );
    
    content = content.replace(
        /style=\{styles\.headerBtn\}/,
        `style={[styles.headerBtn, { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 4 }]}`
    );
    
    content = content.replace(
        /<Ionicons name="arrow-back" size=\{scale\(22\)\} color=\{theme\.text\} \/>/,
        `<Ionicons name="arrow-back" size={scale(22)} color="#fff" />`
    );
    
    content = content.replace(
        /<Text style=\{\[styles\.headerTitle, \{ color: theme\.text \}\]\}>Past Papers<\/Text>/,
        `<Text style={[styles.headerTitle, { color: '#fff' }]}>Past Papers</Text>`
    );
    content = content.replace(
        /<Text style=\{\[styles\.headerSub, \{ color: theme\.placeholder \}\]\}>Coming soon<\/Text>/,
        `<Text style={[styles.headerSub, { color: 'rgba(255,255,255,0.8)' }]}>Coming soon</Text>`
    );
    
    fs.writeFileSync(file, content, 'utf8');
}

function patchVideoGalleriesScreen() {
    const file = 'src/screens/academics/VideoGalleriesScreen.tsx';
    let content = fs.readFileSync(file, 'utf8');
    
    content = content.replace(
        /<StatusBar\s*barStyle=\{isDark \? 'light-content' : 'dark-content'\}\s*backgroundColor=\{theme\.card\}\s*\/>/m,
        `<StatusBar backgroundColor={theme.primary} barStyle="light-content" translucent={false} />`
    );
    
    content = content.replace(
        /<View style=\{\[styles\.header, \{ backgroundColor: theme\.card, borderBottomColor: theme\.border \}\]\}>/,
        `<View style={[styles.header, { backgroundColor: theme.primary, borderBottomColor: 'transparent' }]}>`
    );
    
    content = content.replace(
        /style=\{styles\.headerBtn\}/,
        `style={[styles.headerBtn, { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 4 }]}`
    );
    
    content = content.replace(
        /<Ionicons name="arrow-back" size=\{scale\(22\)\} color=\{theme\.text\} \/>/,
        `<Ionicons name="arrow-back" size={scale(22)} color="#fff" />`
    );
    
    content = content.replace(
        /<Text style=\{\[styles\.headerTitle, \{ color: theme\.text \}\]\}>\{selectedClass \? \`\$\{selectedClass\} Lectures\` : 'Select Class'\}<\/Text>/,
        `<Text style={[styles.headerTitle, { color: '#fff' }]}>{selectedClass ? \`\${selectedClass} Lectures\` : 'Select Class'}</Text>`
    );
    content = content.replace(
        /<Text style=\{\[styles\.headerSub, \{ color: theme\.placeholder \}\]\}>\{selectedClass \? 'Educational video collections' : 'Choose a class to view subjects'\}<\/Text>/,
        `<Text style={[styles.headerSub, { color: 'rgba(255,255,255,0.8)' }]}>{selectedClass ? 'Educational video collections' : 'Choose a class to view subjects'}</Text>`
    );
    
    fs.writeFileSync(file, content, 'utf8');
}

try {
    patchLibraryScreen();
    patchDocumentsScreen();
    patchPastPapersScreen();
    patchVideoGalleriesScreen();
    console.log("All patches applied.");
} catch (e) {
    console.error(e);
}
