/**
 * Cross-platform ts-node runner (avoids broken JSON quoting in npm scripts on Windows).
 * Usage: node scripts/run-ts.cjs path/to/script.ts [args...]
 */
const path = require('path');

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS' });

const script = process.argv[2];
if (!script) {
  console.error('Usage: node scripts/run-ts.cjs <script.ts> [args...]');
  process.exit(1);
}

require('ts-node/register');
require(path.resolve(process.cwd(), script));
