// Persona walk: an actor with two parts misses a line of each, then drills the
// weak ones. Prints HUD, bar and drill button at each step; shots in
// tmp/persona19-*.png. From the repo root: node api/scripts/walk-drill.mjs <email>
import { chromium } from 'playwright';
import { readdirSync } from 'node:fs'; import { homedir } from 'node:os'; import { join } from 'node:path';
const cache = join(homedir(), 'Library/Caches/ms-playwright'); const rev = readdirSync(cache).filter(d => /^chromium-\d+$/.test(d)).sort().pop();
const browser = await chromium.launch({ executablePath: join(cache, rev, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing') });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'dark' })).newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message));
const { link } = await (await fetch('http://localhost:8787/auth/link', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: process.argv[2] }) })).json();
await page.goto(link); await page.waitForURL('http://localhost:8799/**'); await page.waitForTimeout(1800);
const state = () => page.evaluate(() => ({ hud: document.getElementById('hud').innerText.replace(/\n/g, ' | '), line: document.querySelector('#read p.cur')?.innerText.replace(/\n/g, ' ').slice(0, 60), bar: [...document.querySelectorAll('#bar button')].filter(b => !b.hidden).map(b => b.textContent).join(' | '), drill: document.getElementById('drillBtn').textContent }));
let n = 0; const step = async (label, act) => { if (act) await act(); await page.waitForTimeout(400); console.log(`--- ${label}:`, await state()); await page.screenshot({ path: `tmp/persona19-${++n}.png` }); };
await step('start learning', () => page.click('#company .start button'));
// Walk the whole part: miss every own line once, then get it.
for (let k = 0; k < 8; k++) {
  const own = await page.evaluate(() => !!document.querySelector('#read p.cur.mine'));
  if (own) { const shown = await page.evaluate(() => shown); if (shown) { await page.click('#missBtn'); await page.waitForTimeout(200); await page.click('#mainBtn'); await page.waitForTimeout(200); await page.click('#mainBtn'); } else { await page.click('#mainBtn'); } }
  else await page.click('#mainBtn');
  await page.waitForTimeout(250);
  if (await page.evaluate(() => i >= lines.length - 1)) break;
}
await step('end of the part');
await page.click('#menuBtn'); await page.waitForTimeout(300);
await step('More: practice', () => page.evaluate(() => { document.querySelector('details[data-sec="practice"]').open = true; }));
await step('drill weak lines', () => page.click('#drillBtn'));
await step('got it', () => page.click('#mainBtn'));
await step('got it again', () => page.click('#mainBtn'));
console.log('errors:', errors);
await browser.close();
