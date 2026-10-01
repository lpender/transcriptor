// Persona walk: the stage manager at 390 — open Show, add music and room tone
// (tmp/overture.wav, tmp/rain.wav), add a scene, save the cues. Prints the words at
// each step; shots in tmp/persona5-*.png. From the repo root: node api/scripts/walk-crew.mjs <email>
import { chromium } from 'playwright';
import { readdirSync } from 'node:fs'; import { homedir } from 'node:os'; import { join } from 'node:path';
const cache = join(homedir(), 'Library/Caches/ms-playwright'); const rev = readdirSync(cache).filter(d => /^chromium-\d+$/.test(d)).sort().pop();
const browser = await chromium.launch({ executablePath: join(cache, rev, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing') });
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'dark' })).newPage();
const errors = []; page.on('console', m => m.type() === 'error' && errors.push(m.text()));
const { link } = await (await fetch('http://localhost:8787/auth/link', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: process.argv[2] }) })).json();
await page.goto(link); await page.waitForURL('http://localhost:8799/**'); await page.waitForTimeout(1800);
let n = 0; const show = async (label) => { await page.waitForTimeout(500); console.log(`--- ${label}:\n` + await page.evaluate(() => document.querySelector('details[data-sec="show"]').innerText)); await page.screenshot({ path: `tmp/persona5-${++n}.png` }); };
await page.click('#company .start button'); await show('Open Show');
await page.locator('#soundPanel input[type=file]').nth(0).setInputFiles('tmp/overture.wav'); await page.waitForTimeout(2500);
await page.locator('#soundPanel input[type=file]').nth(1).setInputFiles('tmp/rain.wav'); await page.waitForTimeout(2500); await show('after two uploads');
await page.click('text=Add a scene'); await page.waitForTimeout(300);
await page.fill('#soundPanel input.scene', 'Act One');
await page.locator('#soundPanel .cue-edit select').nth(0).selectOption({ index: 1 });
await page.locator('#soundPanel .cue-edit select').nth(1).selectOption({ index: 1 });
await page.click('text=Save the cues'); await show('after save');
await page.reload(); await page.waitForTimeout(1800); await page.click('#menuBtn'); await page.evaluate(() => { document.querySelector('details[data-sec="show"]').open = true; }); await show('after reload');
console.log('errors:', errors);
await browser.close();
