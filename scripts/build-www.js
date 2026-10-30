// Builds www/ for the Android app (Capacitor): the same index.html, but with
// pdf.js, KaTeX and Capacitor's runtime bundled locally so the app works offline.
// Run: npm run build:www
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const WWW = path.join(ROOT, 'www');
const mod = (name) => path.dirname(require.resolve(name + '/package.json', { paths: [ROOT] }));

fs.rmSync(WWW, { recursive: true, force: true });
fs.mkdirSync(path.join(WWW, 'vendor'), { recursive: true });

const copy = (from, to) => fs.cpSync(from, path.join(WWW, to), { recursive: true });
copy(path.join(mod('pdfjs-dist'), 'build/pdf.min.js'), 'vendor/pdf.min.js');
copy(path.join(mod('pdfjs-dist'), 'build/pdf.worker.min.js'), 'vendor/pdf.worker.min.js');
copy(path.join(mod('katex'), 'dist/katex.min.css'), 'vendor/katex/katex.min.css');
copy(path.join(mod('katex'), 'dist/katex.min.js'), 'vendor/katex/katex.min.js');
copy(path.join(mod('katex'), 'dist/contrib/auto-render.min.js'), 'vendor/katex/contrib/auto-render.min.js');
copy(path.join(mod('katex'), 'dist/fonts'), 'vendor/katex/fonts');
copy(path.join(mod('@capacitor/core'), 'dist/capacitor.js'), 'vendor/capacitor.js');
copy(path.join(ROOT, 'icons'), 'icons');

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const swap = (from, to) => {
  if (!html.includes(from)) throw new Error('not found in index.html: ' + from);
  html = html.split(from).join(to);
};
swap('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/', 'vendor/');
swap('https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/', 'vendor/katex/');
swap('<script src="vendor/pdf.min.js"></script>', '<script src="vendor/capacitor.js"></script>\n<script src="vendor/pdf.min.js"></script>');
swap('<link rel="manifest" href="manifest.webmanifest">\n', '');
if (html.includes('cdnjs.cloudflare.com')) throw new Error('index.html still references the CDN');
fs.writeFileSync(path.join(WWW, 'index.html'), html);
console.log('www/ built');
