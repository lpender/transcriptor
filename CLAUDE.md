# transcriptor

A single-page app for learning lines: follow a script, hear it in a voice per
character, and test yourself on it sentence by sentence. Kind: **tool**.
Live at https://lpender.github.io/transcriptor/ (GitHub Pages, branch `main`).

No build, no dependencies. `index.html` is the whole app; `script.js`,
`clips.js` and `clips/` are generated and committed.

```bash
python3 -m http.server 8799            # serve; file:// breaks nothing but test served
python3 convert.py                     # PDF -> script.js
ELEVEN_LABS_API_KEY=... python3 tts.py # script.js -> clips/ + clips.js (spends credits)
```

## Hard rules

- `tts.py` spends Lee's ElevenLabs credits — say the scope and wait for a yes.
- After a render, delete clips no longer named in `clips.js`.
- Bump `CACHE` in `sw.js` on every deploy, or installed copies keep the old build.
- Push after every commit: Pages deploys straight from `main`, so a local-only
  commit is not shipped.
- The source PDF is copyrighted; it stays git-ignored.

## Read when

- Anything about the pipeline, the app's behaviour, or emphasis → `specification.md`
- Extracting a new script PDF, or a line read wrongly → skill `learn-lines`
- How Lee wants work done → `~/dev/godfiles/conventions/PRINCIPLES.md` (already loaded)

Docs convention: PROJECT_DOCS v1 (2026-09-09), trimmed to a tool's file set.
