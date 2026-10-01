// Persona walk: a cast member at 390 learning lines — Learn Lane's lines, step
// through a cue, reveal, miss, drill. Prints the HUD and bar at each step; shots
// in tmp/persona4-*.png. From the repo root: node api/scripts/walk-cast.mjs <email>
import { chromium } from 'playwright';
import { readdirSync } from 'node:fs'; import { homedir } from 'node:os'; import { join } from 'node:path';
const cache = join(homedir(), 'Library/Caches/ms-playwright'); const rev = readdirSync(cache).filter(d => /^chromium-\d+$/.test(d)).sort().pop();
const browser = await chromium.launch({ executablePath: join(cache, rev, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing') });
const page = await (await browser.newContext({ viewport: { width: +(process.env.WIDTH || 390), height: +(process.env.HEIGHT || 844) }, deviceScaleFactor: 2, colorScheme: 'dark' })).newPage();
const errors = []; page.on('console', m => m.type() === 'error' && errors.push(m.text()));
const email = process.argv[2];
const { link } = await (await fetch('http://localhost:8787/auth/link', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) })).json();
await page.goto(link); await page.waitForURL('http://localhost:8799/**'); await page.waitForTimeout(1800);
const state = () => page.evaluate(() => ({ hud: document.getElementById('hud').innerText.replace(/\n/g, ' | '), line: document.querySelector('#read p.cur')?.innerText.replace(/\n/g, ' ').slice(0, 90), bar: [...document.querySelectorAll('#bar button')].filter(b => !b.hidden).map(b => b.textContent).join(' | ') }));
let n = 0; const step = async (label, act) => { if (act) await act(); await page.waitForTimeout(400); console.log(`--- ${label}:`, await state()); await page.screenshot({ path: `tmp/persona4-${++n}.png` }); };
await step('start learning', () => page.click('#company .start button'));
await step('Next on the cue (my line shows)', () => page.click('#mainBtn'));
await step('say I missed it', () => page.click('#missBtn'));
await step('Next', () => page.click('#mainBtn'));
await step('Next', () => page.click('#mainBtn'));
await step('open More', () => page.click('#menuBtn'));
console.log('--- stats:', await page.evaluate(() => ({ stats: JSON.parse(localStorage.getItem('stats') || '{}'), drill: document.getElementById('drillBtn').textContent, weak: lines.filter(p => mine(p) && weakLine(p)).length })));
console.log('--- practice section:', await page.evaluate(() => document.querySelector('details[data-sec="practice"]').innerText.replace(/\n/g, ' | ')));
console.log('errors:', errors);
await browser.close();
