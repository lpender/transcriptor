# Sound upload — music and room tone per scene, per production (design round, 2026-09-30)

Replaces `cues.js` + `sound/` + `normalize.py` for the product. Decided
by the loop.

## Understand

James delivered 20 mp3s; `normalize.py` measured each with ffmpeg and
re-encoded with a flat gain so beds sit at −28 dB and music at −23 dB,
and one slider fits all. `cues.js` maps scenes to files with `hold`
stops. A stage manager (crew) will want the same: drop files, assign
to scenes, hear them level.

## Diverge

1. **Server-side ffmpeg.** Workers cannot run ffmpeg; would need a
   container or a third service. Rejected.
2. **Client-side re-encode** (ffmpeg.wasm, 30 MB download). Heavy.
3. **Measure in the browser, never re-encode.** Web Audio
   `decodeAudioData` → RMS in dB → store `gain` per file → apply at
   playback with a `GainNode` (or `audio.volume` when gain ≤ 0 dB). The
   file stays as uploaded. Chosen.
4. **Third-party audio API** (a loudness service). A vendor for a
   one-liner. Rejected.

## Skeptic

- RMS vs LUFS: `normalize.py` uses ffmpeg's mean_volume (RMS). Same
  measure in the browser gives the same numbers; LUFS is not needed for
  levelling beds.
- Gain above 0 dB: `audio.volume` caps at 1. Play through an
  `AudioContext` with a `GainNode`; the engine already fades, so a
  GainNode is a small change. CORS: R2 must send `Access-Control-Allow-
  Origin` for `decodeAudioData` and `createMediaElementSource`; set on
  the bucket.
- File size: a 5-minute mp3 at 160k is 6 MB; cap 25 MB, mp3/m4a/wav/ogg.
- Decode of a 25 MB wav on a phone: seconds and memory; measure on
  upload from a laptop is the normal case; the phone plays, does not
  measure. If a file has no gain yet, play at 0 dB and measure lazily.
- Upload path: browser → presigned R2 PUT (the Worker signs), then
  `POST /sound` with {name, kind, seconds, gain}. No file through the
  Worker.
- Who: owner/director/crew (`can(role,'cues')`). Cast sees the cue list
  read-only.
- The 5-second loop crossfade, hold stops, per-scene switches, M/R keys:
  unchanged; they read from the production's cue table instead of
  `cues.js`.

## Spec

- D1 `sound(id, production_id, name, kind music|bed, r2_key, seconds,
  gain_db, created_by)`; `cues(production_id, position, name, music_id?,
  bed_id?, hold)`.
- API: `POST /productions/:id/sound/upload-url` → {url, key};
  `POST …/sound` → row; `DELETE …/sound/:id` (refused if a cue uses
  it); `PUT …/cues` (whole ordered list, names unique).
- Web: the More sheet's Show section gains "Add music" / "Add room
  tone" buttons (file picker), per-scene dropdowns to assign, and a
  gain readout; measure on upload with Web Audio; playback via
  GainNode.
- Frontend now, before the backend: refactor the engine to take cues +
  gain from one `show` object so `cues.js` is one source of it and the
  API later is another.

## Split into Queue items

- `engine-gain-node` — play music and beds through an AudioContext
  GainNode with a per-file `gain` (0 for today's normalized files).
  Verify: sound still plays, fades, crossfades. Now.
- `measure-loudness` — `loudness(file) → dB` in the browser with Web
  Audio; a test on a generated tone; compare with `normalize.py` on one
  file. Now.
- `sound-api` — D1 tables, upload URL, rows, cues PUT. UNTIL: db-schema-0001.
- `web-sound-panel` — pickers, assignment, gain readout. UNTIL: sound-api.
