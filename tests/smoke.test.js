// Browser smoke test for index.html. No real AI calls: the OpenAI-compatible
// endpoint is mocked; pdf.js and KaTeX load from vendor/.
// Run: npm test
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');

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

  // No request may leave for a third-party host except the mocked AI API.
  const external = [];
  await pg.route(/^https?:\/\/(?!api\.test)/, (r) => { external.push(r.request().url()); r.abort(); });

  // Mock a model without vision: rejects image input, answers text-only requests slowly.
  const bodies = [];
  await pg.route('https://api.test/**', async (r) => {
    const body = r.request().postData();
    bodies.push(body);
    if (body.includes('image_url'))
      return r.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: { message: 'model does not support image input' } }) });
    await new Promise((x) => setTimeout(x, 1500));
    const content = body.includes('quiz sorusu')
      ? 'SORU 1: \\(a+b\\) nedir?\nCEVAP: Toplam.'
      : 'ANA FİKİR: test \\(x^2\\)\nAKILDA TUT: ok';
    r.fulfill({ status: 200, contentType: 'text/event-stream',
      body: 'data: ' + JSON.stringify({ choices: [{ delta: { content } }] }) + '\n\ndata: [DONE]\n\n' });
  });

  await pg.goto('file://' + path.join(ROOT, 'index.html'));
  await pg.click('#gear'); // the settings panel starts closed
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
  // Image goes first (cache-friendly prefix) and is downscaled for the AI copy.
  const imgReq = JSON.parse(bodies.find((b) => b.includes('image_url')));
  assert.strictEqual(imgReq.messages[0].content[0].type, 'image_url', 'image before text');
  // Formulas render with KaTeX once the answer is complete.
  assert.ok(await pg.$('#out .katex'), 'formula rendered');
  assert.strictEqual(await pg.title(), 'Slaity');

  // Arrow keys: ignored inside a textarea, navigate otherwise.
  await pg.click('#moreBtn'); // the note opens from the "⋯" menu
  await pg.click('#noteT');
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

  // Quiz + Anki export
  await pg.click('#tQ');
  await pg.click('#again');
  await pg.waitForTimeout(2500);
  await pg.click('#tE');

  // Notes download includes the explanation.
  const [dl] = await Promise.all([pg.waitForEvent('download'), pg.click('#moreBtn').then(() => pg.click('#exp'))]);
  assert.match(require('fs').readFileSync(await dl.path(), 'utf8'), /AKILDA TUT: ok/, 'explanation in notes file');

  // Built-in cards: new card -> show answer -> "Tekrar" requeues it, "İyi" finishes it for a day.
  await pg.click('#cards');
  await pg.waitForTimeout(300);
  assert.match(await pg.textContent('#cdStat'), /Yeni 1/);
  await pg.keyboard.press(' ');
  assert.deepStrictEqual(await pg.$$eval('#cdGrades small', (e) => e.map((x) => x.textContent)), ['1 dk', '10 dk', '1 gün', '4 gün']);
  await pg.keyboard.press('1');
  assert.match(await pg.textContent('#cdFront'), /nedir/, 'again keeps the card in the session');
  await pg.keyboard.press(' ');
  await pg.keyboard.press('3');
  assert.match(await pg.textContent('#cdFront'), /Bugünlük bitti/);
  assert.strictEqual(await pg.$eval('#cdGo', (e) => e.hidden), true);
  await pg.keyboard.press('Escape');

  // Ratio buttons: two columns on desktop, one column on phones.
  // Layout: slide and panel side by side on desktop and on a phone held sideways; stacked on a phone held upright.
  const sideBySide = () => pg.evaluate(() => {
    const a = document.getElementById('slideCard').getBoundingClientRect(), b = document.getElementById('panel').getBoundingClientRect();
    return b.left >= a.right - 1 && Math.abs(a.top - b.top) < 2;
  });
  assert.ok(await sideBySide(), 'desktop: two columns');
  await pg.setViewportSize({ width: 844, height: 390 });
  assert.ok(await sideBySide(), 'phone landscape: two columns');
  assert.strictEqual(await pg.evaluate(() => document.documentElement.scrollWidth), 844, 'no sideways scroll');
  await pg.setViewportSize({ width: 768, height: 1024 });
  const stackedFit = await pg.evaluate(() => {
    const a = document.getElementById('slideCard').getBoundingClientRect(), b = document.getElementById('panel').getBoundingClientRect();
    return b.top >= a.bottom - 1 && document.getElementById('askRow').getBoundingClientRect().bottom <= innerHeight;
  });
  assert.ok(stackedFit, 'tablet portrait: slide above panel, question box on screen');
  await pg.setViewportSize({ width: 390, height: 800 });
  assert.ok(!(await sideBySide()), 'phone portrait: stacked');
  assert.ok(await pg.isVisible('#rotHint'), 'portrait shows the rotate hint');

  // Full storage shows a warning.
  await pg.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('full', 'QuotaExceededError'); }; });
  await pg.evaluate(() => { const nb = document.getElementById('noteBox'); nb.hidden = false; nb.open = true; });
  await pg.fill('#pnote', 'x');
  await pg.waitForTimeout(600);
  assert.strictEqual(await pg.$eval('#stWarn', (e) => e.hidden), false, 'storage warning shown');

  assert.deepStrictEqual(errors, [], 'no page errors');
  assert.deepStrictEqual(external, [], 'no third-party requests');
  await browser.close();
  console.log('smoke test passed');
})().catch((e) => { console.error(e); process.exit(1); });
