// Past-exam flow in the Sınav tab: a photographed exam is read by the model (one request with the page
// images), the questions are matched to slides in one more request, and a quote the slides do not contain
// is flagged. A Word file is read locally with no model call. The Gemini API is mocked.
// Run: npm test
const path = require('path');
const zlib = require('zlib');
const assert = require('assert');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');

// A minimal .docx: a ZIP with a deflated word/document.xml (enough for the app's reader).
function docx(paragraphs) {
  const name = Buffer.from('word/document.xml');
  const xml = Buffer.from('<w:document><w:body>' + paragraphs.map((p) => '<w:p><w:r><w:t>' + p + '</w:t></w:r></w:p>').join('') + '</w:body></w:document>');
  const data = zlib.deflateRawSync(xml);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(8, 8);
  local.writeUInt32LE(zlib.crc32 ? zlib.crc32(xml) : 0, 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(xml.length, 22); local.writeUInt16LE(name.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(8, 10);
  central.writeUInt32LE(zlib.crc32 ? zlib.crc32(xml) : 0, 16); central.writeUInt32LE(data.length, 20); central.writeUInt32LE(xml.length, 24); central.writeUInt16LE(name.length, 28);
  const cdOffset = local.length + name.length + data.length;
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(1, 8); end.writeUInt16LE(1, 10);
  end.writeUInt32LE(central.length + name.length, 12); end.writeUInt32LE(cdOffset, 16);
  return Buffer.concat([local, name, data, central, name, end]);
}

(async () => {
  const browser = await chromium.launch();
  const maker = await browser.newPage();
  // Three-page slide deck with real text, and a photographed exam (a PNG with no text layer).
  await maker.setContent('<style>section{height:700px;page-break-after:always;font:32px Arial;padding:40px}</style>' +
    '<section>Net bugünkü değer: gelecekteki nakit akışlarının bugünkü değeri</section>' +
    '<section>İç verim oranı: net bugünkü değeri sıfır yapan oran</section>' +
    '<section>Geri ödeme süresi: yatırımın kendini geri ödediği süre</section>');
  const deck = await maker.pdf({ width: '1280px', height: '780px' });
  await maker.setViewportSize({ width: 800, height: 500 });
  await maker.setContent('<div style="font:24px Arial;padding:30px">1) NBD nasıl hesaplanır?<br><br>2) Geri ödeme süresi nedir?</div>');
  const examPng = await maker.screenshot();
  await maker.close();

  const pg = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  const errors = [], calls = { read: [], match: [] };
  pg.on('pageerror', (e) => errors.push(e.message));
  await pg.route(/^https?:\/\/(?!generativelanguage)/, (r) => (r.request().url().startsWith('file:') ? r.continue() : r.abort()));
  await pg.route('https://generativelanguage.googleapis.com/**', (r) => {
    const body = JSON.parse(r.request().postData());
    const text = body.contents[0].parts.map((p) => p.text || '').join('');
    let answer = 'ANA FİKİR: x';
    if (text.includes('sınav kâğıdının')) {
      calls.read.push(body.contents[0].parts.filter((p) => p.inline_data).length);
      answer = 'SORU 1: NBD nasıl hesaplanır?\nSORU 2: Geri ödeme süresi nedir?';
    } else if (text.includes('ESLESME')) {
      calls.match.push(text);
      answer = 'ESLESME: 1 | 1 | Net bugünkü değer: gelecekteki nakit akışlarının\nESLESME: 2 | 3 | burada geçmeyen uydurma bir cümle';
    }
    r.fulfill({ status: 200, contentType: 'text/event-stream', body: 'data: ' + JSON.stringify({ candidates: [{ content: { parts: [{ text: answer }] } }] }) + '\n\n' });
  });
  await pg.goto('file://' + path.join(ROOT, 'index.html'));
  await pg.evaluate(() => localStorage.setItem('gk', 'test-key'));
  await pg.reload();
  await pg.setInputFiles('#file', { name: 'ders.pdf', mimeType: 'application/pdf', buffer: deck });
  await pg.waitForTimeout(1500);
  await pg.click('#tS');
  assert.strictEqual(await pg.textContent('#pRun'), 'Tüm sayfaları değerlendir');

  // Photographed exam: one request carrying the image, the questions land in the box.
  await pg.setInputFiles('#examFile', { name: 'vize.png', mimeType: 'image/png', buffer: examPng });
  await pg.waitForFunction(() => document.getElementById('exam').value.includes('SORU 2'));
  assert.deepStrictEqual(calls.read, [1], 'one read request with one image');
  assert.strictEqual(await pg.textContent('#pRun'), 'Slaytlarla eşleştir');

  // Matching: one request for all questions and all slides.
  await pg.click('#pRun');
  await pg.waitForSelector('#emList .em');
  assert.strictEqual(calls.match.length, 1);
  assert.ok(calls.match[0].includes('[s.3] Geri ödeme süresi'), 'slide text sent');
  const rows = await pg.$$eval('#emList .em', (e) => e.map((x) => x.textContent));
  assert.match(rows[0], /S1 · NBD nasıl hesaplanır\?s\.1"Net bugünkü değer/);
  assert.ok(!rows[0].includes('bulunamadı'), 'real quote is accepted');
  assert.match(rows[1], /S2[\s\S]*s\.3[\s\S]*alıntı slaytta bulunamadı/, 'made-up quote is flagged');

  // Chips jump to the slide; priorities follow the matches.
  await pg.click('#emList .em:nth-of-type(3) button');
  await pg.waitForTimeout(500);
  assert.strictEqual(await pg.inputValue('#jump'), '3');
  assert.match(await pg.textContent('#pbadge'), /Orta/);
  assert.match(await pg.textContent('#pstat'), /2 soru eşleştirildi/);
  const prio = await pg.evaluate(() => JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => k.startsWith('sa:deck:')))).p);
  assert.deepStrictEqual(Object.fromEntries(Object.entries(prio).map(([k, v]) => [k, v.l])), { 1: 'Orta', 2: 'Düşük', 3: 'Orta' });

  // Word file: read in the browser, no model call.
  await pg.fill('#exam', '');
  await pg.setInputFiles('#examFile', { name: 'final.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: docx(['1. İç verim oranı nedir?', '2. NBD ile farkı nedir?']) });
  await pg.waitForFunction(() => document.getElementById('exam').value.includes('İç verim oranı nedir?'));
  assert.deepStrictEqual(calls.read, [1], 'no extra read request for a Word file');

  assert.deepStrictEqual(errors, [], 'no page errors');
  await browser.close();
  console.log('exam test passed');
})().catch((e) => { console.error(e); process.exit(1); });
