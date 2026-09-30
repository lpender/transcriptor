# Quirks — transcriptor

## Build / tooling

- The Workers runtime refuses a non-handler export from the entry module
  (`Incorrect type for map entry 'VERSION'`): `api/src/index.ts` exports only
  the default handler; everything testable lives in `router.ts`.
- `wrangler dev` dies with `ERR_IPC_CHANNEL_CLOSED` when its stdin closes
  (a backgrounded tool call); start it with `</dev/null` via nohup, or `task dev`.
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
