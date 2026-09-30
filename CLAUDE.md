# transcriptor (product working name: Tablework)

A rehearsal-room app for a theatre company: one script, one set of voices
per character, the show's sound cues, and every actor learning their lines
against it, alone or together in the room. Kind: **app** (was a tool until
2026-09-30; the single-file app is the frontend of the product).
Live today at https://lpender.github.io/transcriptor/ (GitHub Pages, `main`).

## Stack

Frontend: `index.html`, no build, no dependencies. Backend (target, ADR 002):
Cloudflare Workers + D1 + R2 + Durable Objects, Stripe, Resend.
Gates today: serve with `python3 -m http.server 8799` and verify in a browser.

```bash
python3 convert.py                     # this show's PDF -> script.js
ELEVEN_LABS_API_KEY=... python3 tts.py # script.js -> clips/ + clips.js (spends credits)
```

## Hard rules

- `tts.py` spends Lee's ElevenLabs credits — say the scope and wait for a yes.
- After a render, delete clips no longer named in `clips.js`.
- Bump `CACHE` in `sw.js` on every deploy, or installed copies keep the old build.
- Push after every commit: Pages deploys straight from `main`.
- The show's PDF, and any user's script, is copyrighted: never in git, never
  shared beyond its production.
- No Apple in-app purchase: signup and billing are on the web.

## Read when

- Scoping or questioning a feature → `docs/VISION.md`
- Structural change, new module, deploy → `docs/ARCHITECTURE.md`
- How the app behaves today, the pipeline, emphasis → `docs/BEHAVIOUR.md`
- Before touching anything, and after any surprise → `docs/QUIRKS.md`
- "Why is it this way?" → `docs/decisions/` (ADRs + `LOG.md`)
- Cross-app auth/billing/sharing/MCP shape → `~/dev/godfiles/conventions/PLATFORM.md`
- Extracting a new script PDF, or a line read wrongly → skill `learn-lines`

After a task: append any gotcha to `docs/QUIRKS.md`; record any contestable
choice in `docs/decisions/`.

## Dev harness

- Backlog: `next_up.md` (convention `~/dev/godfiles/conventions/NEXT_UP.md`).
  /q captures → /d decides → /g builds → /h drains ACTION items.
- Commits on `main`, pushed (Pages). Loops never run `tts.py` or touch billing.

<!-- docs convention v1 · kind: app (godfiles/conventions/PROJECT_DOCS.md) -->
