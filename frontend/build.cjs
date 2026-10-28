const fs = require('fs');
const path = require('path');

let babel;
try {
  babel = require(path.join(__dirname, 'vendor', 'babel.min.cjs'));
} catch (e0) {
  try {
    babel = require('/tmp/babel.min.js');
  } catch (e) {
    try {
      babel = require('@babel/standalone');
    } catch (e2) {
      console.error("Please ensure @babel/standalone is available at vendor/babel.min.cjs or /tmp/babel.min.js");
      process.exit(1);
    }
  }
}

const srcPath = path.join(__dirname, 'src', 'App.jsx');
const outPath = path.join(__dirname, 'app.js');

const source = fs.readFileSync(srcPath, 'utf8');
const result = babel.transform(source, {
  presets: [
    ['react', { runtime: 'classic' }]
  ]
});

fs.writeFileSync(outPath, result.code);
console.log(`[NeoScan Build] Compiled App.jsx -> app.js (${result.code.length} bytes) successfully!`);
