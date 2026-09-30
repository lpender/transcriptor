# Quirks — transcriptor

## Build / tooling

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

- SpeechRecognition exists only in Chrome and Safari, needs mic permission and a secure origin (localhost counts). Test it with a stub class; Playwright has no mic.

- ElevenLabs `eleven_v3` reads a trailing dash as a pause plus a noise; strip
  it before speaking. No SSML, no italics; emphasis by caps, quotes, ellipses.
- The show's PDF font has no fi/fl ligatures; `convert.py` repairs six words.
