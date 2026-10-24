// recover3.js  →  node recover3.js
const fs = require('fs');

if (!fs.existsSync('extend3.js')) {
  console.error('❌ extend3.js not found');
  process.exit(1);
}

let c = fs.readFileSync('extend3.js', 'utf8');

// Find the first "function write(" — everything after this is intact content
const marker = 'function write(rel, content)';
const idx = c.indexOf(marker);
if (idx === -1) {
  console.error('❌ Cannot find function write() marker in extend3.js');
  console.error('   The file may have been corrupted beyond repair.');
  console.error('   Please delete extend3.js and ask for a fresh copy.');
  process.exit(1);
}

const header = `// extend3.js
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();

console.log('\\n🚀 Extending CLIPROOM with Follow/Search/Settings/Report/XP...\\n');

`;

fs.writeFileSync('extend3.js', header + c.slice(idx), 'utf8');
console.log('✅ extend3.js repaired.');
console.log('\nNow run:');
console.log('  node extend3.js');