// Gemini requests: a model saved by an older version that is no longer offered falls back to the default,
// Gemini 4 gets thinkingLevel "medium", and no request sends the deprecated temperature. The API is mocked.
// Run: npm test
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const PDF = require('fs').readFileSync(path.join(__dirname, 'smoke.test.js'), 'utf8').match(/const PDF = `([\s\S]*?)`;/)[1];

(async () => {
  const browser = await chromium.launch();
  const pg = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const errors = [], calls = [];
  pg.on('pageerror', (e) => errors.push(e.message));
  await pg.route(/^https?:\/\/(?!generativelanguage)/, (r) => r.abort());
  await pg.route('https://generativelanguage.googleapis.com/**', (r) => {
    calls.push({ url: r.request().url(), body: JSON.parse(r.request().postData()) });
    r.fulfill({ status: 200, contentType: 'text/event-stream',
      body: 'data: ' + JSON.stringify({ candidates: [{ content: { parts: [{ text: 'ANA FİKİR: test' }] } }] }) + '\n\n' });
  });

  // An older version saved gemini-flash-latest (its default) and its list had gemini-3-flash, which does not exist.
  for (const old of ['gemini-flash-latest', 'gemini-3-flash', 'gemini-3.5-flash']) {
    await pg.goto('file://' + path.join(ROOT, 'index.html'));
    await pg.evaluate((m) => { localStorage.setItem('gk', 'test-key'); localStorage.setItem('gm', m); }, old);
    await pg.reload();
    assert.strictEqual(await pg.inputValue('#model'), 'gemini-4-hydrogen', old + ' falls back to the default');
    assert.strictEqual(await pg.evaluate(() => localStorage.getItem('gm')), 'gemini-4-hydrogen');
  }

  // A model that is still offered is kept.
  await pg.evaluate(() => localStorage.setItem('gm', 'gemini-3.5-flash-lite'));
  await pg.reload();
  assert.strictEqual(await pg.inputValue('#model'), 'gemini-3.5-flash-lite');

  await pg.setInputFiles('#file', { name: 'a.pdf', mimeType: 'application/pdf', buffer: Buffer.from(PDF) });
  await pg.waitForFunction(() => /ANA FİKİR/.test(document.getElementById('out').textContent));
  let c = calls[calls.length - 1];
  assert.match(c.url, /models\/gemini-3\.5-flash-lite:streamGenerateContent/);
  assert.deepStrictEqual(c.body.generationConfig, {}, 'Gemini 3: no temperature, no thinking level');

  // Gemini 4: thinking level medium, still no temperature.
  await pg.click('#gear');
  await pg.selectOption('#model', 'gemini-4-hydrogen');
  await pg.click('#again');
  await pg.waitForTimeout(800);
  c = calls[calls.length - 1];
  assert.match(c.url, /models\/gemini-4-hydrogen:streamGenerateContent/);
  assert.deepStrictEqual(c.body.generationConfig, { thinkingConfig: { thinkingLevel: 'medium' } });
  assert.ok(calls.every((x) => !JSON.stringify(x.body).includes('temperature')), 'temperature never sent');
  assert.strictEqual(await pg.evaluate(() => localStorage.getItem('gm')), 'gemini-4-hydrogen', 'choice saved');

  assert.deepStrictEqual(errors, [], 'no page errors');
  await browser.close();
  console.log('gemini test passed');
})().catch((e) => { console.error(e); process.exit(1); });
