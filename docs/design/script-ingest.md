# A way in for scripts that are not already text (design round, 2026-10-02)

From Lee, 2026-10-02: "a lot of people can't simply paste their script — they
will have it in PDF or even on paper. We need a path for these people. The
path I used was AI. Could an MCP server solve this? We need to make the value
prop clear about this though."

Persona: the director of a small company, first contact with Tablework,
holding a PDF of the play (or a photocopied paper script in a folder).

## Understand

The paste box takes exactly one shape — `NAME: speech` per line, `***` for a
scene break — and ADR 005 decided, for good reasons, that no file ever crosses
into the server: every script's PDF is differently broken, and `convert.py` is
one show's fixes, not a parser.

The reasoning holds. The product's problem is not the decision, it is that the
decision was never said out loud to the person it affects. Today a director
with a PDF sees a box asking for a format they do not have, and nothing on the
page tells them a path exists. Competitor recon makes it sharper: Offbook, Go
Offbook and ActOnCue all advertise PDF or image import on their landing pages
(`docs/recon/competitors.md`). Against them we look like the one product that
cannot read a script — while actually having the most capable path of the five,
because the user's AI reads anything, including a photograph of paper.

So this is mostly a WORDS problem with one real build behind it.

## Diverge

1. **Say the path, in the app.** A block at the paste box: "My script is a PDF,
   a Word file, or paper" opening three paths — a connected AI loads it for
   you; any AI (free web chat) converts it if you paste this prompt; paper is
   photographed first. The prompt is copyable, so the director's work is
   paste-paste, not writing instructions for a model.
2. **Drop a PDF on the app, extract in the browser.** pdf.js from a CDN pulls
   the text layer out client-side, a heuristic guesses `NAME: speech`, and the
   result lands IN THE PASTE BOX for the director to correct — the box already
   names every line that does not fit. No server, no new secret, nothing
   uploaded. Honest framing: a head start you check, not an importer.
3. **Server-side parsing / OCR.** Rejected again (ADR 005). Scanned paper also
   needs real OCR, which is a paid API or a 10 MB wasm download that reads
   theatre typography badly.
4. **An AI on our side converting for the user.** Costs money per script and
   makes us the one paying for every trial. Rejected for now; if it is ever
   built it is a paid feature, and that is a Lee decision.
5. **Nothing: tell people in support.** Rejected — the landing is where the
   director decides whether this product is for them.

1 and 2 are complementary: 1 serves the director who has an AI (most of them,
and the best result, because an AI fixes ligatures and two-column pages that no
heuristic will), 2 serves the one who does not and does not want one.

## Skeptic

- **Does "use an AI" read as a cop-out?** It would if it were buried in help
  text as an apology. Said as a feature with the prompt ready to copy, it reads
  as the shortest path — and it IS: the AI that reads your PDF also strips the
  stage directions, which no import button does. The words must carry that,
  never "we cannot read PDFs".
- **The prompt must actually produce the format.** It names the shape, forbids
  stage directions, headings and page numbers, forbids changing a word of the
  dialogue, and asks for `***` at scene ends. The paste box's validator is the
  backstop: it already quotes every line that does not fit (round 47).
- **Does pdf.js belong in a no-dependency single file?** It is one `<script>`
  from a CDN, loaded only when a PDF is dropped — not on first paint, not in
  the service worker's core list. The app still works with it blocked. That is
  the condition for building item 2; if it cannot be lazy, it is not built.
- **What about copyright?** The script never leaves the device in path 2, and
  in path 1 it goes to the director's own AI, which they chose. Unchanged by
  this work, but how.html should say it.
- **Why not make this the MCP's job entirely?** Because a director with a PDF
  and no AI connection has no MCP. MCP is the best path, not the only one.

## Three questions

- *Is this clear?* The three paths are, in one sentence each. The weak point is
  the word "AI": a director may read it as "I need to buy something". The copy
  names free web chat explicitly and says no account with us is needed.
- *What is the most confusing thing about it?* That the AI gives back TEXT the
  director then pastes here — two steps, and the second is easy to miss. The
  prompt block ends by saying what to do with the answer: "paste what it gives
  you into the box below".
- *What would the director find confusing?* The format itself. "NAME: speech"
  is obvious to us and not to them, which is why the director never types it:
  they copy a prompt, or they fix the lines the box quotes back.

## Spec (the split)

- **script-in-any-form-words** — the block at the paste box with the three
  paths and the copyable prompt, one clause in the Directors tile, and a
  how.html section. Copy and one small DOM block; no new dependency.
- **pdf-drop-to-paste-box** — drop (or choose) a PDF, pdf.js lazily from the
  CDN, text out, heuristic to `NAME: speech`, result in the paste box with a
  line saying it is a guess to check. Falls back to the words above when the
  CDN is blocked or the PDF has no text layer (a scan).

Both are reversible. Neither spends money.
