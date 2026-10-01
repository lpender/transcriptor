// Quick check of the app in a FRESH browser context (no service worker, no HTTP
// cache from earlier loads). From the repo root:
//   node api/scripts/peek.mjs <email|-> <out.png> [js]
// Signs in as <email> on the local API (or stays signed out with "-"), opens the
// sheet, screenshots at 390×844, and prints the result of the optional [js]
// expression evaluated in the page (default: the Company section's text).
import { chromium } from 'playwright';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const [email, out = 'tmp/peek.png', js = "document.getElementById('company').innerText"] = process.argv.slice(2);
const API = 'http://localhost:8787', APP = 'http://localhost:8799';
const cache = join(homedir(), 'Library/Caches/ms-playwright');
const rev = existsSync(cache) ? readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort().pop() : null;
const executablePath = rev ? join(cache, rev, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing') : undefined;
const browser = await chromium.launch(executablePath && existsSync(executablePath) ? { executablePath } : {});
const page = await (await browser.newContext({ viewport: { width: +(process.env.WIDTH || 390), height: +(process.env.HEIGHT || 844) }, deviceScaleFactor: 2, colorScheme: 'dark' })).newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text())); page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
if (email && email !== '-') {
  const { link } = await (await fetch(`${API}/auth/link`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) })).json();
  await page.goto(link); await page.waitForURL(`${APP}/**`);
} else await page.goto(`${APP}/index.html`);
await page.waitForTimeout(1800);
if (!(await page.evaluate(() => document.getElementById('sheet').open))) await page.evaluate(() => document.getElementById('menuBtn').click());
await page.waitForTimeout(400);
console.log(await page.evaluate(js));
await page.screenshot({ path: out });
console.log(`\n${out}; console errors: ${errors.length ? errors.join(' | ') : 'none'}`);
await browser.close();
