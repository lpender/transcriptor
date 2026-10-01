# Quirks — transcriptor

## Build / tooling

- Never chain `task test | grep … && git commit`: grep exits 0 on a line
  that says "failed" too, and a red main was pushed that way on
  2026-10-01 (a duplicate `const` in a test). Gate first, read the result,
  then commit.
- A browser heuristically caches `index.html` from `python3 -m http.server`
  (Last-Modified, no Cache-Control), so after an edit a redirect back from
  the API (sign-in, billing) lands on a stale copy and new functions are
  "not defined". `task serve` runs `tools/serve.py`, which adds
  `Cache-Control: no-store`; a browser that already holds a cached copy
  needs one reload first. The service worker did the same one load behind
  (it serves its cache, then installs the new build), so index.html does
  not register it on localhost, and removes one it finds. The Playwright
  MCP browser keeps a profile across sessions and still came back
  controlled by an old worker; verify UI with a fresh context instead:
  `node api/scripts/peek.mjs <email|-> tmp/x.png [js]` (signs in on the
  local API, opens the sheet, screenshots at 390, prints the expression).
- The Workers runtime refuses a non-handler export from the entry module
  (`Incorrect type for map entry 'VERSION'`): `api/src/index.ts` exports only
  the default handler; everything testable lives in `router.ts`.
- `wrangler dev` dies with `ERR_IPC_CHANNEL_CLOSED` when its stdin closes
  (a backgrounded tool call); start it with `</dev/null` via nohup, or `task dev`.
- `npm install` in `api/` needs `--legacy-peer-deps` (npm 11.5 dies with
  `Cannot read properties of null (reading 'edgesOut')` resolving the vitest
  pool's peers). `vitest-pool-workers` 0.22 wants vitest 4 and is a Vite
  plugin (`cloudflareTest()`), not `defineWorkersConfig`; `cloudflare:test`'s
  `env` is typed empty, so tests import `env` from `test/env.ts`.
- `compatibility_date` must not be newer than the bundled workerd (2026-08-22
  with wrangler 4.145); a newer date fails every test with ERR_RUNTIME_FAILURE.
- `@cloudflare/workers-types` must match wrangler's peer (v5 line with wrangler 4.145).

- `sw.js` `CACHE` must be bumped on every deploy or installed copies keep the
  old build. 169eb0a shipped without a bump and nobody saw it until 2026-09-26.
- Chrome-extension test tabs are hidden: no media loads, timers throttle.
  Test the sound engine with a stubbed `Audio` class, or use Playwright.
- `file://` breaks the manifest (CORS) and the service worker; always test
  served (`python3 -m http.server 8799`).
- A global `textarea { height: 58vh }` once styled every textarea; keep
  paste-box styles on `#src` only.

## Runtime

- `PUT /productions/:id/me/progress` takes whole numbers only
  (`isCount`): the device's miss decay is in halves, so `queueProgress`
  sends `Math.ceil`. Sending the raw half got a silent 400 and no progress
  synced (2026-10-01).

- A 101 WebSocket response must be returned as-is: `new Response(res.body, …)`
  drops the `webSocket` and wrangler answers 500 "did not return status 101".
  `cors()` passes 101s through untouched.

- The service worker serves the cached `index.html` even to a `?v=` URL, so a
  Playwright drive after an edit must unregister it (`getRegistrations` →
  `unregister`) and reload, or it tests the previous build. A bumped `CACHE`
  alone only takes effect on the reload after next.
- When inserting code "after `joinRoom();`", the first match in the file is the
  reconnect call inside `joinRoom` itself; the top-level call is the one at
  column 0. A block inserted in the wrong place runs only on a socket drop.

- Autoplay: the first `play()` before a touch throws `NotAllowedError`. That
  is not "sound off"; keep the preference and retry on first touch.
- Per-scene sound prefs are keyed by scene name, so cue names must be unique.
- Public MQTT brokers rate-limit and drop retained messages; the
  hand-rolled client has failover and pings, but this is not production.

## Third-party

- `window.speechSynthesis` is a non-writable getter: stub it in tests with `Object.defineProperty(window, 'speechSynthesis', { value, configurable: true })`, not assignment. `getVoices()` can be empty until `voiceschanged`; a null voice means the default.

- SpeechRecognition exists only in Chrome and Safari, needs mic permission and a secure origin (localhost counts). Test it with a stub class; Playwright has no mic.

- ElevenLabs `eleven_v3` reads a trailing dash as a pause plus a noise; strip
  it before speaking. No SSML, no italics; emphasis by caps, quotes, ellipses.
- The show's PDF font has no fi/fl ligatures; `convert.py` repairs six words.
- **`pullCues` re-clicks Start reading.** Anything the Start handler resets (the `fromProduction` marker, for one) is reset again a beat after `pullScript` set it, because `pullCues` clicks Start when the cues differ. The Start handler therefore only clears device-ownership state when the text actually changed (`sameScript`). Found 2026-09-30 when a freshly set marker kept vanishing.
