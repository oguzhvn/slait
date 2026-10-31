// Copies the browser libraries the app loads (pdf.js, KaTeX) from node_modules
// into vendor/, so the site serves them itself instead of from a CDN.
// Run after changing their versions in package.json: npm run vendor
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'vendor');
const mod = (name) => path.dirname(require.resolve(name + '/package.json', { paths: [ROOT] }));
const copy = (from, to) => {
  fs.mkdirSync(path.dirname(path.join(OUT, to)), { recursive: true });
  fs.copyFileSync(from, path.join(OUT, to));
};

fs.rmSync(OUT, { recursive: true, force: true });
const pdfjs = path.join(mod('pdfjs-dist'), 'build');
copy(path.join(pdfjs, 'pdf.min.js'), 'pdfjs/pdf.min.js');
copy(path.join(pdfjs, 'pdf.worker.min.js'), 'pdfjs/pdf.worker.min.js');
const katex = path.join(mod('katex'), 'dist');
for (const f of ['katex.min.js', 'katex.min.css', 'contrib/auto-render.min.js']) copy(path.join(katex, f), 'katex/' + f);
// Every browser the app supports reads woff2, so the .woff/.ttf fallbacks are left out.
for (const f of fs.readdirSync(path.join(katex, 'fonts')).filter((f) => f.endsWith('.woff2'))) {
  copy(path.join(katex, 'fonts', f), 'katex/fonts/' + f);
}
copy(path.join(mod('pdfjs-dist'), 'LICENSE'), 'pdfjs/LICENSE');
copy(path.join(mod('katex'), 'LICENSE'), 'katex/LICENSE');
const versions = { 'pdfjs-dist': require(path.join(mod('pdfjs-dist'), 'package.json')).version, katex: require(path.join(mod('katex'), 'package.json')).version };
fs.writeFileSync(path.join(OUT, 'VERSIONS.json'), JSON.stringify(versions, null, 2) + '\n');
console.log('vendor/ written', versions);
