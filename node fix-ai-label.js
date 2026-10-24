// fix-transformers.js  →  node fix-transformers.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = process.cwd();

console.log('\n🧹 Fixing transformers installation...\n');

// 1. package.json — 改用稳定版 3.8.1
const pkgPath = path.join(ROOT, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

// 移除之前的错误版本
if (pkg.dependencies['@huggingface/transformers']) {
  delete pkg.dependencies['@huggingface/transformers'];
}

// 添加稳定版
pkg.dependencies['@huggingface/transformers'] = '^3.8.1';

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
console.log('  ✓ package.json: @huggingface/transformers@^3.8.1');

// 2. 删除 lock 文件
const lock = path.join(ROOT, 'package-lock.json');
if (fs.existsSync(lock)) {
  fs.unlinkSync(lock);
  console.log('  ✓ package-lock.json deleted');
}

// 3. 删除 node_modules（彻底清理）
const nm = path.join(ROOT, 'node_modules');
if (fs.existsSync(nm)) {
  try {
    fs.rmSync(nm, { recursive: true, force: true });
    console.log('  ✓ node_modules deleted');
  } catch (e) {
    console.error('  ✗ failed to delete node_modules:', e.message);
    console.error('    → close VS Code / all terminals, retry');
    process.exit(1);
  }
}

// 4. 清理 .next 缓存
const nextDir = path.join(ROOT, '.next');
if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log('  ✓ .next cache deleted');
}

console.log('\n📦 Running npm install...\n');
try {
  execSync('npm install --no-audit --no-fund', { stdio: 'inherit' });
  console.log('\n✅ Install complete!');
} catch (e) {
  console.error('\n❌ npm install failed');
  console.error('   If EPERM on Windows: close VS Code / Explorer, retry as Administrator.');
  process.exit(1);
}

console.log('\n📋 Next:');
console.log('   npm run dev');
console.log('   Ctrl+Shift+R\n');