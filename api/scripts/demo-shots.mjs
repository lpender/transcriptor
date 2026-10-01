// Demo screenshots for the /demo walkthrough (skill ~/.claude/skills/demo). Run from the repo root: `task demo:shots`.
// Seeds a synthetic production on the LOCAL dev API (fixture names, the
// public-domain sample script), drives the app at phone width, writes
// tmp/demo/*.png and tmp/demo/mcp.txt. Needs `task dev` (:8787) and
// `task serve` (:8799) running; `task demo:shots` starts and stops them.
// Never points at prod, never touches the show's script.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const API = 'http://localhost:8787', APP = 'http://localhost:8799', OUT = 'tmp/demo';
const stamp = Date.now().toString(36);   // fresh fixture accounts every run
const EMAIL = (who) => `${who}.${stamp}@example.com`;
mkdirSync(OUT, { recursive: true });

// The sample script shipped in index.html (Wilde, public domain).
const SAMPLE = readFileSync('index.html', 'utf8').match(/const SAMPLE = `([\s\S]*?)`;/)[1];

// --- synthetic record over HTTP -------------------------------------------
const signIn = async (email) => {
  const { link } = await (await fetch(`${API}/auth/link`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) })).json();
  const r = await fetch(link, { redirect: 'manual' });
  const cookie = r.headers.get('set-cookie').split(';')[0];
  const call = async (method, path, body) => {
    const res = await fetch(API + path, { method, headers: { cookie, 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    return res.status === 204 ? {} : res.json();
  };
  return { email, link, cookie, call };
};
// Magic links are one-time; the browser gets its own.
const freshLink = async (email) => (await (await fetch(`${API}/auth/link`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) })).json()).link;
const mcpFor = (token) => async (name, args) => {
  const r = await (await fetch(`${API}/mcp`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }) })).json();
  return r.result.content[0].text;
};

const ann = await signIn(EMAIL('ann'));   // director
await ann.call('PUT', '/me', { name: 'Ann Reyes' });
const { production } = await ann.call('POST', '/productions', { name: 'The Importance of Being Earnest' });
await ann.call('PUT', `/productions/${production.id}/script`, { title: 'The Importance of Being Earnest', text: SAMPLE });
const castInvite = await ann.call('POST', `/productions/${production.id}/invites`, { role: 'cast' });
const crewInvite = await ann.call('POST', `/productions/${production.id}/invites`, { role: 'crew' });
const castToken = new URL(castInvite.url).searchParams.get('invite');

const bob = await signIn(EMAIL('bob'));   // cast, part way through
await bob.call('PUT', '/me', { name: 'Bob Okafor' });
await bob.call('POST', `/invites/${castToken}/accept`, {});
const cy = await signIn(EMAIL('cy'));     // crew
await cy.call('PUT', '/me', { name: 'Cy Nakamura' });
await cy.call('POST', `/invites/${new URL(crewInvite.url).searchParams.get('invite')}/accept`, {});

const annMcp = mcpFor((await ann.call('POST', '/tokens', { label: 'director-ai' })).token);
const bobMcp = mcpFor((await bob.call('POST', '/tokens', { label: 'cast-ai' })).token);
await annMcp('set_parts', { production: production.id, email: bob.email, parts: ['Lane'] });
await bob.call('PUT', `/productions/${production.id}/me/progress`, { best: 9, total: 14, misses: { 'I didn\'t think it polite to listen, sir.': 2 } });

// --- MCP, as an AI reads it ------------------------------------------------
const mcp = [];
const ask = async (q, who, name, args) => mcp.push(`"${q}"\n${name} →\n${await who(name, args)}\n`);
await ask('Who am I connected as?', annMcp, 'whoami', {});
await ask('Who is in the company?', annMcp, 'list_members', { production: production.id });
await ask('Who is off book?', annMcp, 'who_is_off_book', { production: production.id });
await ask('How am I doing?', bobMcp, 'who_is_off_book', { production: production.id });
await ask('Set the cues (as cast).', bobMcp, 'set_cues', { production: production.id, cues: [] });
writeFileSync(join(OUT, 'mcp.txt'), mcp.join('\n'));

// --- the app at phone width --------------------------------------------------
const cache = join(homedir(), 'Library/Caches/ms-playwright');
const rev = existsSync(cache) ? readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort().pop() : null;
const executablePath = rev ? join(cache, rev, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing') : undefined;
const browser = await chromium.launch(executablePath && existsSync(executablePath) ? { executablePath } : {});
const fresh = async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'dark' });
  const page = await ctx.newPage();
  await page.goto(`${APP}/index.html`);
  await page.evaluate(async () => { for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister(); localStorage.clear(); });
  return { ctx, page };
};
const shot = (page, name, opts = {}) => page.screenshot({ path: join(OUT, `${name}.png`), ...opts });
const openSec = (page, sec) => page.evaluate((s) => { for (const d of document.querySelectorAll('details.sec')) d.open = d.dataset.sec === s; }, sec);
const settle = (page, ms = 600) => page.waitForTimeout(ms);

// Flow 1: a first-timer, signed out.
{
  const { ctx, page } = await fresh();
  await page.goto(`${APP}/index.html`); await settle(page);
  await shot(page, '01-landing');
  await page.click('#sampleBtn'); await settle(page);
  await shot(page, '02-sample-reading');
  await page.click('#menuBtn'); await openSec(page, 'parts'); await settle(page, 300);
  await page.click('#roles .row >> nth=1 >> .chip >> nth=0'); await settle(page, 300);   // LANE: Mine
  await shot(page, '03-pick-a-part');
  await openSec(page, 'practice'); await page.click('#learnChip'); await settle(page);
  await shot(page, '04-learn-hud');
  await ctx.close();
}
// Flow 2: the director signs in.
{
  const { ctx, page } = await fresh();
  await page.goto(await freshLink(ann.email)); await page.waitForURL(`${APP}/**`); await settle(page, 1200);
  await shot(page, '05-company');
  await page.evaluate(() => document.querySelector('#voices')?.scrollIntoView()); await settle(page, 300);
  await shot(page, '06-voices-quote');
  await page.evaluate(() => document.querySelector('#ai')?.scrollIntoView()); await settle(page, 300);
  await shot(page, '07-your-ai');
  await ctx.close();
}
// Flow 3: an invited actor lands on the link.
{
  const { ctx, page } = await fresh();
  await page.goto(`${APP}/index.html?invite=${castToken}`); await settle(page);
  await shot(page, '08-invite-landing');
  await page.goto(await freshLink(bob.email)); await page.waitForURL(`${APP}/**`); await settle(page, 1200);
  await shot(page, '09-cast-company');
  await ctx.close();
}
// Flow 4: crew in the Show section.
{
  const { ctx, page } = await fresh();
  await page.goto(await freshLink(cy.email)); await page.waitForURL(`${APP}/**`); await settle(page, 1200);
  await openSec(page, 'show'); await settle(page, 400);
  await shot(page, '10-crew-show');
  await ctx.close();
}
await browser.close();
console.log(`wrote ${readdirSync(OUT).length} files to ${OUT}/ (production ${production.id}, fixtures *.${stamp}@example.com)`);
