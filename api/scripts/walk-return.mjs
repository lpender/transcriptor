// Persona walk: an actor comes back the next day on the same phone. Day one:
// sign in, learn, miss one, get two. Day two: open the app cold (cookies and
// localStorage kept) and read what it says. From the repo root:
//   node api/scripts/walk-return.mjs <email>
import { chromium } from 'playwright';
import { readdirSync } from 'node:fs'; import { homedir } from 'node:os'; import { join } from 'node:path';
const cache = join(homedir(), 'Library/Caches/ms-playwright'); const rev = readdirSync(cache).filter(d => /^chromium-\d+$/.test(d)).sort().pop();
const browser = await chromium.launch({ executablePath: join(cache, rev, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing') });
const errors = [];
const ctx1 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'dark' });
const p1 = await ctx1.newPage(); p1.on('pageerror', e => errors.push(e.message));
const { link } = await (await fetch('http://localhost:8787/auth/link', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: process.argv[2] }) })).json();
await p1.goto(link); await p1.waitForURL('http://localhost:8799/**'); await p1.waitForTimeout(1800);
await p1.click('#company .start button'); await p1.waitForTimeout(500);
await p1.click('#mainBtn'); await p1.waitForTimeout(300); await p1.click('#missBtn'); await p1.waitForTimeout(300);
await p1.click('#mainBtn'); await p1.waitForTimeout(300); await p1.click('#mainBtn'); await p1.waitForTimeout(300); await p1.click('#mainBtn'); await p1.waitForTimeout(2600);
console.log('--- day one, leaving at:', await p1.evaluate(() => ({ hud: document.getElementById('hud').innerText.replace(/\n/g, ' | '), at: i })));
const state = await ctx1.storageState(); await ctx1.close();
const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'dark', storageState: state });
const p2 = await ctx2.newPage(); p2.on('pageerror', e => errors.push(e.message));
await p2.goto('http://localhost:8799/index.html'); await p2.waitForTimeout(2000);
console.log('--- day two, cold open:', await p2.evaluate(() => ({ title: document.title, welcome: !document.getElementById('welcome').hidden, reading: !document.getElementById('read').hidden, learn: document.body.classList.contains('learn'), hud: document.getElementById('hud').hidden ? '(hidden)' : document.getElementById('hud').innerText.replace(/\n/g, ' | '), at: i, cur: document.querySelector('#read p.cur')?.innerText.slice(0, 60), sheet: document.getElementById('sheet').open })));
await p2.screenshot({ path: 'tmp/persona9-1-cold.png' });
await p2.click('#menuBtn'); await p2.waitForTimeout(500);
console.log('--- day two, More:', await p2.evaluate(() => document.querySelector('#company .start').innerText.replace(/\n/g, ' | ') + ' || ' + document.querySelector('details[data-sec="practice"]').innerText.replace(/\n/g, ' | ')));
await p2.screenshot({ path: 'tmp/persona9-2-more.png' });
console.log('errors:', errors);
await browser.close();
