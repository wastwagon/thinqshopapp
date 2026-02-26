const fs = require('fs');
const path = require('path');
const mainPath = path.join(__dirname, '../dist/backend/src/main.js');
const linkPath = path.join(__dirname, '../dist/main.js');
if (fs.existsSync(mainPath) && !fs.existsSync(linkPath)) {
  fs.symlinkSync('backend/src/main.js', linkPath);
}
