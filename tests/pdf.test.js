// Notes PDF export: character mapping (Turkish letters, symbols, invisible characters, compatibility
// forms), Markdown cleanup, long-word wrapping, and that the file opens in pdf.js with the text intact.
// The export code is taken from index.html and run in Node; no browser needed.
// Run: npm test
const path = require('path');
const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const cut = (from, to) => { const a = html.indexOf(from), b = html.indexOf(to, a); assert.ok(a > -1 && b > a, from); return html.slice(a, b); };
const src = cut('var HEADS=', '// Yapı tanınmadığında') + cut('// Not dosyasının bir satırı', 'function mdToHtmlBody') +
  cut('// ---- notlar PDF', 'function secList(');
const { pdfEnc, buildPDF, mdLine, PDF_W, splitHead, tidy, parseQuiz, parseGloss } = new Function(src + 'return {pdfEnc, buildPDF, mdLine, PDF_W, splitHead, tidy, parseQuiz, parseGloss};')();

// pdfEnc output is one byte per character in the PDF's encoding; decode it back for readable asserts.
const TR = { 0xD0: 'Ğ', 0xDD: 'İ', 0xDE: 'Ş', 0xF0: 'ğ', 0xFD: 'ı', 0xFE: 'ş' };
const dec = (e) => [...e].map((c) => TR[c.charCodeAt(0)] || (c.charCodeAt(0) === 0x95 ? '•' : c)).join('');

assert.strictEqual(dec(pdfEnc('Ağaç şık İĞÜŞÖÇ ığüşöç')), 'Ağaç şık İĞÜŞÖÇ ığüşöç');
assert.strictEqual(pdfEnc('Ð Ý Þ ð ý þ'), '? Y ? ? y ?', 'Latin-1 letters replaced by Turkish ones are not printed as Turkish');
assert.strictEqual(pdfEnc('✔️ Doğru\r').replace(/\xF0/g, 'ğ'), 'v Doğru', 'emoji variation selector and \\r dropped');
assert.strictEqual(pdfEnc('a​b‍c﻿d'), 'abcd', 'zero-width characters dropped');
assert.strictEqual(pdfEnc('H₂O x₁ + x² ﬁ １２'), 'H2O x1 + x\xB2 fi 12', 'compatibility forms reduce (² is in the encoding)');
assert.strictEqual(pdfEnc('λ = 0,5 θ ∂ ∫ ∈'), 'lambda = 0,5 teta d integral  i\xE7inde ');
assert.strictEqual(pdfEnc('→ ≥ 😀 🚩'), '-> >=  (i\xFEaretli)', 'emoji without a mapping is dropped');
assert.strictEqual(pdfEnc('漢'), '?', 'anything else becomes ?');
assert.strictEqual(pdfEnc('が'), '?', 'a character that decomposes into unencodable parts is one ?');
assert.strictEqual(dec(pdfEnc('s\u0327ok gu\u0308zel dag\u0306 I\u0307stanbul')), 'şok güzel dağ İstanbul', 'decomposed Turkish letters are composed first');
assert.strictEqual(pdfEnc('🇹🇷 bayrak 1️⃣ bir'), ' bayrak 1 bir', 'flags and keycaps dropped');
assert.strictEqual(pdfEnc('a\vb\fc\u0000d\u0085e'), 'abcde', 'control characters dropped');

// Markdown cleanup is shared by Word and PDF.
assert.deepStrictEqual(mdLine('#### Alt başlık'), { k: 'h', lv: 3, t: 'Alt başlık' });
assert.deepStrictEqual(mdLine('__önemli__ ve `kod`'), { k: 'p', t: 'önemli ve kod' });
assert.deepStrictEqual(mdLine('**AKILDA TUT:** ok'), { k: 'kv', h: 'AKILDA TUT', t: 'ok' });
assert.strictEqual(mdLine('   '), null);
assert.strictEqual(mdLine('# '), null, 'empty heading is skipped');
assert.strictEqual(mdLine('## '), null);
assert.deepStrictEqual(mdLine('def __init__(self): return 2**10'), { k: 'p', t: 'def __init__(self): return 2**10' }, 'unpaired markers stay');
assert.deepStrictEqual(mdLine('- **Açıklama:** a__b ve `__init__` ile **kalın**'), { k: 'kv', h: 'AÇIKLAMA', t: 'a__b ve __init__ ile kalın' }, 'body text keeps code');
// Emphasis only counts when it opens and closes outside a word; code spans are left alone.
const keep = ['a**2 + b**2 = c**2', '2**10 ve 3**4', 'def __init__(self):', '__init__.py dosyası', 'Boşluğu doldur: _____ ', '`**x**`'];
for (const k of keep) assert.strictEqual(tidy(k), k.replace(/`/g, ''), 'kept: ' + k);
assert.strictEqual(tidy('__Dikkat__: sınavda çıkar, __Note__ ve **NBD**’nin'), 'Dikkat: sınavda çıkar, Note ve NBD’nin');
assert.strictEqual(tidy('**kalın** metin (**parantez**)'), 'kalın metin (parantez)');
assert.deepStrictEqual(mdLine('## **'), null, 'marker-only heading is skipped');
// The text after a section heading keeps code on screen (fmt), in speech and in exports.
assert.deepStrictEqual(splitHead('**AÇIKLAMA:** Python’da `__init__` ve 2**10 = 1024'), ['AÇIKLAMA', 'Python’da __init__ ve 2**10 = 1024']);
assert.deepStrictEqual(splitHead('Akılda tut'), ['AKILDA TUT', '']);
// Quiz and glossary keep code too.
assert.deepStrictEqual(parseQuiz('**SORU 1:** Python’da 2**10 kaçtır?\n**CEVAP:** 1024, `__len__` değil'), [{ q: 'Python’da 2**10 kaçtır?', a: '1024, __len__ değil' }]);
assert.deepStrictEqual(parseGloss('- **Terim:** a**2 | kare | a**2 + b**2 toplamında'), [{ t: 'a**2', k: 'kare', d: 'a**2 + b**2 toplamında' }]);

(async () => {
  // pdf.js warns that the optional 'canvas' module is missing; only text is read here, so hide that.
  const warn = console.warn, log = console.log;
  console.warn = console.log = () => {};
  const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
  console.warn = warn; console.log = log;
  const md = '# Finans — Ders 3\n\n## Sayfa 1 🚩\n\n**AKILDA TUT:** \\(NBD=\\sum C_t\\) λ\r\n\n#### Dördüncü düzey\n\n__önemli__ `kod`\n\n# \n\nx ∈ A\n\nAKILDA TUT: ∈ işareti aitliktir\n\ndef __init__(self): return 2**10\n\n' +
    'https://ornek.com/' + 'x'.repeat(20000) + '\n\n' + Array.from({ length: 80 }, (_, i) => 'Satır ' + (i + 1) + ' ığüşöç İĞÜŞÖÇ').join('\n');
  const bytes = new Uint8Array(await buildPDF(md, 'Finans — Ders 3 ığş').arrayBuffer());
  const raw = Buffer.from(bytes).toString('latin1');
  assert.match(raw, /\/Differences \[208 \/Gbreve 221 \/Idotaccent 222 \/Scedilla 240 \/gbreve 253 \/dotlessi 254 \/scedilla\]/);

  const doc = await pdfjs.getDocument({ data: bytes, isEvalSupported: false, verbosity: 0 }).promise;
  assert.ok(doc.numPages >= 3);
  let text = '';
  for (let i = 1; i <= doc.numPages; i++) text += (await (await doc.getPage(i)).getTextContent()).items.map((x) => x.str).join('\n') + '\n';
  assert.match(text, /AKILDA TUT:/);
  assert.match(text, /NBD=\\sum C_t lambda/, 'formula delimiters dropped, Greek spelled out');
  assert.ok(!/[?`]|__|\(NBD|####/.test(text.replace(/https:\/\/ornek\.com\/x+/, '').replace('def __init__(self): return 2**10', '')), 'no stray markers or ?');
  assert.ok(text.includes('def __init__(self): return 2**10'), 'code survives');
  assert.match(text, /x içinde A/, 'substitutions do not double spaces');
  assert.match(text, /içinde işareti aitliktir/);
  assert.ok(!/\( \) Tj(?: \/F[12] \d+ Tf)? \( \) Tj/.test(raw), 'never two space words in a row, also across bold/normal runs');
  assert.match(text, /Dördüncü düzey/);
  assert.match(text, /Satır 80 ığüşöç İĞÜŞÖÇ/);
  const info = await doc.getMetadata();
  assert.strictEqual(info.info.Title, 'Finans — Ders 3 ığş');

  // Every printed line stays inside the right margin (A4 width 595.28 pt, 56 pt margins).
  for (let i = 1; i <= doc.numPages; i++) {
    for (const it of (await (await doc.getPage(i)).getTextContent()).items) {
      if (it.str) assert.ok(it.transform[4] + it.width <= 595.28 - 56 + 0.5, 'line inside margin: ' + it.str.slice(0, 30));
    }
  }
  assert.strictEqual(PDF_W.length, 224);
  console.log('pdf test passed');
})().catch((e) => { console.error(e); process.exit(1); });
