# Product log — transcriptor / Tablework

Dated fast calls. Bigger ones get an ADR.

- 2026-09-30 — Production is the unit of ownership, sharing and billing (ADR 001, 003).
- 2026-09-30 — Sound design becomes a per-production upload (music + room tone per scene); James's files stay private to this show.
- 2026-09-30 — Scripts arrive by paste or by MCP (Claude converts the PDF on the user's side); no server-side PDF parsing.
- 2026-09-30 — Working name Tablework (tablework.com free 2026-09-30); Off Book rejected, four products use it.
- 2026-09-30 — Name: Tablework. Decided by the loop under the "only money or human decisions are gated" rule; buying tablework.com stays an ACTION.
- 2026-09-30 — Business model: subscription, $1 per seat per month or $10 per year, billed to the production; voices per script on top (ADR 003). Not one-time purchase (no recurring revenue, no reason to keep the server on); not free-with-ads (a rehearsal room with ads is not a tool people trust).
- 2026-09-30 — Billing periods: monthly and yearly both, yearly default.
- 2026-09-30 — Sound files are never re-encoded: loudness measured in the browser (Web Audio RMS), a gain per file applied at playback through a GainNode. `docs/design/sound-upload.md`.
- 2026-09-30 — Browser `speechSynthesis` is the free voice tier and ships in the static app now; one rendered engine (ElevenLabs) to start, a cheap middle tier (OpenAI tts) noted for later. `docs/design/voices.md`.
