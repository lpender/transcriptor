// The gate's one real-browser check: a script pasted, then the page RELOADED, is
// the path a syntax pass cannot see (a dead-zone const broke it on 2026-10-01).
// Fails loudly on any page error or an empty reader. From the repo root:
//   node api/scripts/smoke.mjs      (serves :8799 itself)
import { chromium } from 'playwright';
import { readdirSync } from 'node:fs'; import { homedir } from 'node:os'; import { join } from 'node:path';
import { spawn } from 'node:child_process';

const server = spawn('python3', ['tools/serve.py', '8799'], { stdio: 'ignore' });
const die = (msg) => { console.error('smoke:', msg); server.kill(); process.exit(1); };
await new Promise((r) => setTimeout(r, 1200));
const cache = join(homedir(), 'Library/Caches/ms-playwright');
const rev = readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort().pop();
const browser = await chromium.launch({ executablePath: join(cache, rev, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing') });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const errors = [];
const open = async () => {
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  // The API is not part of this check and is often not running: a failed fetch to
  // it is the environment, not the page. Script errors still fail.
  p.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && errors.push('console: ' + m.text()));
  await p.goto('http://localhost:8799/index.html');
  await p.waitForTimeout(1200);
  return p;
};
let page = await open();
await page.evaluate(() => { document.getElementById('src').value = 'ALGERNON: How are you?\nJACK: Oh, pleasure!'; document.getElementById('start').click(); });
await page.waitForTimeout(600);
if (await page.evaluate(() => document.querySelectorAll('#read p').length) !== 2) die('a pasted script did not render two lines');
await page.close();
page = await open();   // the reload: the saved script paints before the whole file has run
const lines = await page.evaluate(() => document.querySelectorAll('#read p').length);
await browser.close(); server.kill();
if (errors.length) die(`page errors on reload: ${errors.join(' | ')}`);
if (lines !== 2) die(`a saved script did not come back on reload (${lines} lines)`);
console.log('index.html first paint ok');
