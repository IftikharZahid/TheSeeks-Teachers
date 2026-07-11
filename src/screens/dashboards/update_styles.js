const fs = require('fs');
const file = 'd:/ZahidCodes/TheSeeks-Teachers/src/screens/dashboards/TeacherDashboardScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `  dropdownContainer: {
    width: '100%',
    borderRadius: scale(12),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scale(4) },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dropdownTitle: {
    fontSize: scale(13),
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: scale(11),
    fontWeight: '600',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: scale(12),
    paddingHorizontal: scale(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBox: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(12),
    marginTop: scale(2),
  },
  dropdownContent: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: scale(12),
    fontWeight: '600',
    flex: 1,
    marginRight: scale(6),
  },
  itemTime: {
    fontSize: scale(9),
    fontWeight: '500',
  },
  itemText: {
    fontSize: scale(11),
  },`;

// Use regex to replace everything from dropdownContainer to itemText definition
content = content.replace(/\s*dropdownContainer:[\s\S]*?itemText:\s*\{[\s\S]*?\},/g, '\n' + replacement);
fs.writeFileSync(file, content);
console.log('Styles updated.');
