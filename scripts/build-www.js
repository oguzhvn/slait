// Builds www/ for the Android app (Capacitor): index.html, vendor/ and icons/,
// plus Capacitor's runtime, so the app works offline.
// Run: npm run build:www
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const WWW = path.join(ROOT, 'www');
const mod = (name) => path.dirname(require.resolve(name + '/package.json', { paths: [ROOT] }));

fs.rmSync(WWW, { recursive: true, force: true });
fs.mkdirSync(path.join(WWW, 'vendor'), { recursive: true });

const copy = (from, to) => fs.cpSync(from, path.join(WWW, to), { recursive: true });
copy(path.join(ROOT, 'vendor'), 'vendor');
copy(path.join(mod('@capacitor/core'), 'dist/capacitor.js'), 'vendor/capacitor.js');
copy(path.join(ROOT, 'icons'), 'icons');

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const swap = (from, to) => {
  if (!html.includes(from)) throw new Error('not found in index.html: ' + from);
  html = html.split(from).join(to);
};
swap('<script>\n(function(){', '<script src="vendor/capacitor.js"></script>\n<script>\n(function(){');
swap('<link rel="manifest" href="manifest.webmanifest">\n', '');
fs.writeFileSync(path.join(WWW, 'index.html'), html);
console.log('www/ built');
