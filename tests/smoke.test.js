// Browser smoke test for index.html. No real AI calls: the OpenAI-compatible
// endpoint is mocked and pdf.js is served from node_modules (pdfjs-dist).
// Run: npm test
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const PDFJS = path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'build');

// Two-page PDF with a line of text on each page.
const PDF = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R 6 0 R]/Count 2>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 200]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 52>>stream
BT /F1 18 Tf 20 100 Td (Net bugunku deger) Tj ET
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
6 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 200]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
trailer<</Root 1 0 R>>`;

(async () => {
  const browser = await chromium.launch();
  const pg = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const errors = [];
  pg.on('pageerror', (e) => errors.push(e.message));

  await pg.route('https://cdnjs.cloudflare.com/**', (r) =>
    r.fulfill({ path: path.join(PDFJS, r.request().url().split('/').pop()), contentType: 'application/javascript' }));

  // Mock a model without vision: rejects image input, answers text-only requests slowly.
  const bodies = [];
  await pg.route('https://api.test/**', async (r) => {
    const body = r.request().postData();
    bodies.push(body);
    if (body.includes('image_url'))
      return r.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: { message: 'model does not support image input' } }) });
    await new Promise((x) => setTimeout(x, 1500));
    r.fulfill({ status: 200, contentType: 'text/event-stream',
      body: 'data: {"choices":[{"delta":{"content":"ANA FİKİR: test\\nAKILDA TUT: ok"}}]}\n\ndata: [DONE]\n\n' });
  });

  await pg.goto('file://' + path.join(ROOT, 'index.html'));
  await pg.selectOption('#prov', 'custom');
  await pg.fill('#curl', 'https://api.test/v1');
  await pg.fill('#cmodel', 'm');
  await pg.evaluate(() => ['curl', 'cmodel'].forEach((i) => document.getElementById(i).dispatchEvent(new Event('change'))));
  await pg.setInputFiles('#file', { name: 'a.pdf', mimeType: 'application/pdf', buffer: Buffer.from(PDF) });
  await pg.waitForTimeout(1200);

  // Asking while the explanation streams must not cancel the explanation.
  await pg.fill('#q', 'neden?');
  await pg.click('#ask');
  await pg.waitForTimeout(3500);
  assert.match(await pg.textContent('#out'), /AKILDA TUT/, 'explanation survives a question');
  assert.match(await pg.textContent('#chat'), /Soru: neden\?/, 'question answered');

  // No-vision fallback sends slide text, and only tries the image once.
  assert.ok(bodies.some((b) => b.includes('Net bugunku deger')), 'slide text sent to text-only model');
  assert.strictEqual(bodies.filter((b) => b.includes('image_url')).length, 1, 'no-vision result is remembered');

  // Arrow keys: ignored inside a textarea, navigate otherwise.
  await pg.click('#pnote');
  await pg.keyboard.press('ArrowRight');
  assert.strictEqual(await pg.inputValue('#jump'), '1', 'arrow in textarea keeps page');
  await pg.click('body', { position: { x: 5, y: 5 } });
  await pg.keyboard.press('ArrowRight');
  assert.strictEqual(await pg.inputValue('#jump'), '2', 'arrow on page navigates');

  // → on the last page must not abort a running explanation.
  await pg.click('#again');
  await pg.waitForTimeout(200);
  await pg.keyboard.press('ArrowRight');
  await pg.waitForTimeout(2500);
  assert.match(await pg.textContent('#out'), /AKILDA TUT/, 'last-page arrow keeps explanation');

  // Ratio buttons: two columns on desktop, one column on phones.
  await pg.click('#r5050');
  assert.strictEqual((await pg.$eval('#app', (e) => getComputedStyle(e).gridTemplateColumns)).split(' ').length, 2);
  await pg.setViewportSize({ width: 390, height: 800 });
  assert.strictEqual((await pg.$eval('#app', (e) => getComputedStyle(e).gridTemplateColumns)).split(' ').length, 1);

  // Full storage shows a warning.
  await pg.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('full', 'QuotaExceededError'); }; });
  await pg.fill('#pnote', 'x');
  await pg.waitForTimeout(600);
  assert.strictEqual(await pg.$eval('#stWarn', (e) => e.hidden), false, 'storage warning shown');

  assert.deepStrictEqual(errors, [], 'no page errors');
  await browser.close();
  console.log('smoke test passed');
})().catch((e) => { console.error(e); process.exit(1); });
