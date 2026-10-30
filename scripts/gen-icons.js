// Renders scripts/icon.svg into the web (PWA) and Android launcher icons.
// Run: node scripts/gen-icons.js   (needs Playwright's Chromium)
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const BG = '#2f6fed';
const mark = fs.readFileSync(path.join(__dirname, 'icon.svg'), 'utf8');

// shape: 'square' (rounded), 'round', 'full' (edge to edge, for maskable/adaptive), 'fg' (transparent, symbol only)
function html(size, shape, scale) {
  const radius = shape === 'round' ? '50%' : shape === 'square' ? '22%' : '0';
  const bg = shape === 'fg' ? 'transparent' : BG;
  const inner = Math.round(size * scale);
  return `<html><body style="margin:0;background:transparent">
    <div style="width:${size}px;height:${size}px;border-radius:${radius};background:${bg};display:flex;align-items:center;justify-content:center;overflow:hidden">
      <div style="width:${inner}px;height:${inner}px">${mark.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div>
    </div></body></html>`;
}

const out = [
  ['icons/icon-192.png', 192, 'full', 1],
  ['icons/icon-512.png', 512, 'full', 1],
  ['icons/icon-maskable-512.png', 512, 'full', 0.8],
  ['icons/apple-touch-icon.png', 180, 'full', 1],
];
const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [d, k] of Object.entries(dens)) {
  out.push([`android-res/mipmap-${d}/ic_launcher.png`, 48 * k, 'square', 1]);
  out.push([`android-res/mipmap-${d}/ic_launcher_round.png`, 48 * k, 'round', 1]);
  // Adaptive icon foreground: 108dp canvas; the mark's own padding keeps it inside the 66dp safe zone.
  out.push([`android-res/mipmap-${d}/ic_launcher_foreground.png`, 108 * k, 'fg', 0.85]);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [file, size, shape, scale] of out) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(html(size, shape, scale));
    fs.mkdirSync(path.dirname(path.join(ROOT, file)), { recursive: true });
    await page.screenshot({ path: path.join(ROOT, file), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  }
  fs.mkdirSync(path.join(ROOT, 'android-res/values'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'android-res/values/ic_launcher_background.xml'),
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${BG.toUpperCase()}</color>\n</resources>\n`);
  await browser.close();
  console.log(out.length + ' icons written');
})();
