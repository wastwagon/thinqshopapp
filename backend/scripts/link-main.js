const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '../dist');
const candidates = [
  path.join(distDir, 'src/main.js'),
  path.join(distDir, 'backend/src/main.js'),
];
const linkPath = path.join(distDir, 'main.js');

const mainPath = candidates.find((p) => fs.existsSync(p));
if (!mainPath) {
  console.error('link-main: no main.js found under dist/ (expected dist/src/main.js)');
  process.exit(1);
}

if (!fs.existsSync(linkPath)) {
  const relative = path.relative(distDir, mainPath).split(path.sep).join('/');
  fs.symlinkSync(relative, linkPath);
  console.log(`link-main: dist/main.js -> ${relative}`);
}
