// Persona walk: two members in the room at 390 — the director leads, an actor
// follows; the leader steps and the follower's place moves. Prints both HUDs;
// shots in tmp/persona7-*.png. From the repo root:
//   node api/scripts/walk-room.mjs <leader email> <follower email>
import { chromium } from 'playwright';
import { readdirSync } from 'node:fs'; import { homedir } from 'node:os'; import { join } from 'node:path';
const cache = join(homedir(), 'Library/Caches/ms-playwright'); const rev = readdirSync(cache).filter(d => /^chromium-\d+$/.test(d)).sort().pop();
const browser = await chromium.launch({ executablePath: join(cache, rev, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing') });
const errors = [];
const open = async (email) => {
  const page = await (await browser.newContext({ viewport: { width: +(process.env.WIDTH || 390), height: +(process.env.HEIGHT || 844) }, deviceScaleFactor: 2, colorScheme: 'dark' })).newPage();
  page.on('console', m => m.type() === 'error' && errors.push(`${email}: ${m.text()}`));
  const { link } = await (await fetch('http://localhost:8787/auth/link', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) })).json();
  await page.goto(link); await page.waitForURL('http://localhost:8799/**'); await page.waitForTimeout(1800);
  return page;
};
const state = (p) => p.evaluate(() => ({ hud: document.getElementById('hud').innerText.replace(/\n/g, ' | '), at: i, together: document.querySelector('details[data-sec="together"]').innerText.replace(/\n/g, ' | ') }));
const [lead, follow] = await Promise.all([open(process.argv[2]), open(process.argv[3])]);
for (const p of [lead, follow]) await p.evaluate(() => { for (const d of document.querySelectorAll('details.sec')) d.open = d.dataset.sec === 'together'; });
console.log('--- together section, before:', (await state(lead)).together);
await lead.screenshot({ path: 'tmp/persona7-1-together.png' });
await lead.click('#leadChip'); await follow.click('#followChip'); await new Promise(r => setTimeout(r, 1500));
console.log('--- leader:', await state(lead)); console.log('--- follower:', await state(follow));
await lead.click('#mainBtn'); await lead.click('#mainBtn'); await new Promise(r => setTimeout(r, 1200));
console.log('--- after two steps, leader:', await state(lead)); console.log('--- follower:', await state(follow));
await follow.screenshot({ path: 'tmp/persona7-2-following.png' }); await lead.screenshot({ path: 'tmp/persona7-3-leading.png' });
console.log('errors:', errors);
await browser.close();
