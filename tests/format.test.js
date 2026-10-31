// Answers that ignore the requested labels must still render: lower-case or English headings,
// Markdown, numbered quizzes, "Terim:" in lower case, and answers with no structure at all.
// Run: npm test
const path = require('path');
const fs = require('fs');
const assert = require('assert');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const PDF = fs.readFileSync(path.join(__dirname, 'smoke.test.js'), 'utf8').match(/const PDF = `([\s\S]*?)`;/)[1]
  .replace('(Net bugunku deger)', '(Net bugunku deger ve faiz orani hesabi)').replace('/Length 52', '/Length 74');

// What the mocked model answers, per request type; tests swap these between steps.
const answers = {
  explain: '## Ana Fikir\nParanın zaman değeri.\n**Açıklama:** Bugünkü para yarınkinden değerlidir.\n- birinci madde\nExample: 100 TL\nAkılda tut: Erken para iyidir.',
  quiz: '1. **Soru:** NPV nedir?\nCevap: Net bugünkü değer.\n2. Faiz nedir? Cevap: Paranın kirası.',
  terms: '- **Terim:** NPV | Net bugünkü değer | Gelecek nakitlerin bugünkü değeri.\nterim: Faiz - Paranın kirası - Borcun bedeli.',
  priority: '**Öncelik:** yüksek\nNeden: Sık soruluyor.',
};

(async () => {
  const browser = await chromium.launch();
  const pg = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  const errors = [];
  pg.on('pageerror', (e) => errors.push(e.message));
  await pg.route('https://api.test/**', (r) => {
    const b = r.request().postData();
    const kind = b.includes('quiz sorusu') ? 'quiz' : b.includes('TERİM:') ? 'terms' : b.includes('ÖNCELİK') ? 'priority' : 'explain';
    r.fulfill({ status: 200, contentType: 'text/event-stream',
      body: 'data: ' + JSON.stringify({ choices: [{ delta: { content: answers[kind] } }] }) + '\n\ndata: [DONE]\n\n' });
  });
  await pg.goto('file://' + path.join(ROOT, 'index.html'));
  await pg.selectOption('#prov', 'custom');
  await pg.fill('#curl', 'https://api.test/v1');
  await pg.fill('#cmodel', 'm');
  await pg.evaluate(() => ['curl', 'cmodel'].forEach((i) => document.getElementById(i).dispatchEvent(new Event('change'))));
  await pg.setInputFiles('#file', { name: 'a.pdf', mimeType: 'application/pdf', buffer: Buffer.from(PDF) });
  await pg.waitForTimeout(1500);
  const heads = () => pg.$$eval('#out .h', (e) => e.map((x) => x.textContent));

  // Explanation: Markdown heading, bold label, English label and lower case all map to the four sections.
  assert.deepStrictEqual(await heads(), ['ANA FİKİR', 'AÇIKLAMA', 'ÖRNEK', 'AKILDA TUT']);
  const outText = await pg.textContent('#out');
  assert.ok(!/\*\*|##/.test(outText), 'Markdown markers removed');
  assert.match(outText, /• birinci madde/, 'bullet kept as a bullet');

  // An answer with no headings at all is shown as text, not lost.
  answers.explain = 'Bu sayfa paranın zaman değerini anlatıyor.\nKısaca: bugün > yarın.';
  await pg.click('#again');
  await pg.waitForTimeout(500);
  assert.match(await pg.textContent('#out'), /paranın zaman değerini/);

  // Quiz: numbered questions with "Cevap" on the next line or inline.
  await pg.click('#tQ');
  await pg.click('#again');
  await pg.waitForTimeout(500);
  assert.deepStrictEqual(await pg.$$eval('#out summary', (e) => e.map((x) => x.textContent)), ['NPV nedir?', 'Faiz nedir?']);
  assert.deepStrictEqual(await pg.$$eval('#out details > p', (e) => e.map((x) => x.textContent)), ['Net bugünkü değer.', 'Paranın kirası.']);

  // Quiz with no recognizable structure: raw text plus a note, never an empty panel.
  answers.quiz = 'Bu sayfadan soru çıkarılamadı çünkü sadece bir başlık var.';
  await pg.click('#again');
  await pg.waitForTimeout(500);
  assert.match(await pg.textContent('#out'), /Soru biçimi tanınmadı[\s\S]*sadece bir başlık var/);

  // Terms: "Terim:" in lower case, Markdown, and " - " instead of "|".
  await pg.click('#tT');
  await pg.click('#again');
  await pg.waitForTimeout(500);
  assert.deepStrictEqual(await pg.$$eval('#out .term b', (e) => e.map((x) => x.textContent)), ['NPV', 'Faiz']);
  assert.match(await pg.textContent('#out'), /Faiz — Paranın kirası · Borcun bedeli\./);

  // Exam priority: "Öncelik:" in lower case with Markdown.
  await pg.click('#tE');
  await pg.click('#exm summary');
  await pg.click('#pRun');
  await pg.waitForTimeout(3500);
  assert.match(await pg.textContent('#pstat'), /Yüksek 2/);

  assert.deepStrictEqual(errors, [], 'no page errors');
  await browser.close();
  console.log('format test passed');
})().catch((e) => { console.error(e); process.exit(1); });
