# transcriptor — specification

A single-page web app for learning lines. It shows a script, steps through it,
reads it aloud in a different voice per character, and tests you on it sentence
by sentence. Live at https://lpender.github.io/transcriptor/.

Kind: **tool** (see `~/dev/godfiles/conventions/KINDS.md`). No build step, no
dependencies, no server: `index.html` plus generated data files.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole app: markup, styles and script in one file |
| `convert.py` | `Waiting Coen.pdf` → `script.js` (`window.SCRIPT`, one line per step) |
| `tts.py` | `script.js` → `clips/*.mp3` + `clips.js` (`window.CLIPS`, line → clip) |
| `stress.json` | Per-line respellings for the voice only; never shown on screen |
| `script.js`, `clips.js`, `clips/` | Generated, committed, served by GitHub Pages |

Rebuild: `python3 convert.py`, then `ELEVEN_LABS_API_KEY=… python3 tts.py`,
then prune clips no longer named in `clips.js`, then commit.

## Extracting the script

The source PDF is a scan-quality export with traits that silently corrupt a
naive extraction. Each is handled in `convert.py`:

- **Two book pages per landscape sheet.** Each page is 792×612pt holding two
  396pt-wide pages. Extracting a whole sheet interleaves the columns, so each
  half is extracted separately (`pdftotext -layout -x 0|396 -W 396`) and read
  in order.
- **Dropped ligatures.** The embedded font has no `fi`/`fl`/`ffi` glyphs, so
  "first" extracts as "rst" and "office" as "o ce". A table repairs the six
  words this affects; `f` also arrives as a form feed and is mapped back.
- **Indentation carries meaning.** A speech starts at column 0 as `NAME: text`;
  its wrapped lines are indented a little, stage directions a lot. Only
  speeches and their continuations are kept — the app is for saying lines.
- **Scene breaks.** `***` is kept as its own entry and drawn as a divider the
  reader passes over rather than a step. A break printed on both halves of a
  sheet is de-duplicated, and nothing is appended to a break as if it were
  dialogue.
- **Padded spacing.** The PDF sets some lines with wide gaps
  (`I'm     sorry.   I   just   realized`). Runs of spaces are squeezed to one
  before anything is written to `script.js`: they read badly on screen and the
  voice mispronounces around them ("before" became "below").

Everything written to `script.js` is therefore already trimmed, repaired and in
reading order. The app does no cleaning of its own.

## Voicing

One ElevenLabs voice per character (`VOICES` in `tts.py`); `MAN` is
Sebatacheck before he gives his name, so they share a voice. Model is
`eleven_v3`, which follows written emphasis where the older models do not.

A clip's filename is `sha1(model + voice + spoken text)`, so changing the
model, recasting a part or restressing a line renders a fresh clip and leaves
every other clip alone. Clips whose names no longer appear in `clips.js` are
deleted by hand after a run.

Lines that break off mid-sentence end in a dash, which the voice reads as a
pause and then a strange noise; the trailing dash is stripped before speaking.

### Emphasis

Three levers, and only three — `eleven_v3` supports no italics, no SSML and no
phoneme emphasis tags:

1. **Capitals.** The play writes its own ("You said it TWICE", "A position of
   TRUST") and they are left as they are.
2. **Quotation marks.** `That's what "I" said.` This is the one that works on a
   word capitals cannot reach: `I`, or a word already set in capitals.
3. **Punctuation.** Ellipses add weight and a pause.

`stress.json` maps a full script line to how it should be spoken:

```json
{ "NELSON: That's what I said.": "That's what \"I\" said." }
```

The key must match the line in `script.js` exactly, including the speaker. The
value replaces the spoken text only — the screen still shows the real line. Use
it for the contrast a line turns on: "eight **thousand**" against "eight
hundred", "**You** are" answering "Who is."

## The app

State lives in `localStorage` (script, current line, key-word mode, role, best
run, per-sentence misses). The bundled script wins over a saved copy unless the
reader pasted their own.

- **Following.** Next and Back move a line at a time, the current line is
  centred, and the ends join up: past the last line is the first.
- **Reading aloud.** Plays each line's clip and advances. Two boxes set a loop:
  play N lines, drop back M, so it creeps forward while repeating. A line with
  no clip is skipped rather than stopping playback. With learn mode on, the
  voice reads everyone else and stops at each of your lines until you have
  said and graded it; stopping learn mode mid-wait lets the voice read on.
- **The show's sound.** `cues.js` lists James's sound design scene by scene:
  a bed of room tone that loops under the dialogue and, for most scenes, a
  piece of music that plays once over it. Every track has a switch for its
  scene in the More sheet, and a loop switch beside it (room tone loops
  unless told not to, music plays once unless told to loop; a loop's join is
  a five-second crossfade, not a cut), and S silences
  the lot. All of it is kept across visits; a page that opens with sound on
  waits for the first touch, which the browser requires, then starts it. M
  and R start or stop the current scene's music or room tone in the moment
  without touching those switches, so the next scene sounds as set. Two sliders set how loud all the music and
  all the room tone play, kept across visits. The beds are levelled to one
  loudness by `normalize.py` (a flat gain each, no compression) so one slider
  fits them all, and the music to another, 5 dB louder. Tapping a scene's name there goes to its
  first line and keeps the sheet open. The header names the scene sounding.
  Scenes take cues in order; a cue marked `hold` (before the show, the silent
  reception, the end) is a stop of its own in the script column, pressed
  through like a line but never voiced or learned. Changing scene cuts the
  old sound with a 0.1s fade; the same scene again is left alone. Reading
  aloud waits on a stop's music before moving on. Files live in `sound/` and
  are cached on first play.
- **Learn mode.** Your lines are hidden as `▒▒▒▒▒` blocks — fixed width, so
  length gives nothing away — and lines ahead are invisible. Say the line, then
  press: Next onto your line reveals its first sentence, and each right answer
  clears the piece and reveals the next in the same press. A miss takes back
  the two before it, hidden again to say over. The score is how far you get; the best run
  is kept per role. Tapping back to an earlier line, or jumping to a scene,
  restarts from there: every line from it onward is hidden and owed again.
- **Pieces.** A line is tested in pieces split at full stops, commas,
  semicolons, colons and dashes, never at apostrophes, quotes or hyphens inside
  words. A piece under three words joins the one before it, and abbreviations
  ("Mr.", "U.S.") stay attached.
- **Weak sentences.** Misses are counted per sentence across visits; a sentence
  still owed is marked, and Drill weak visits only those. Two clean runs clear
  one miss.
- **Key words.** Bolds the words a line hangs on — skip the filler, then prefer
  long and rare in this script over short and common, about half the remaining
  words, at most four.
- **Controls.** Every control is a button in the bar or the More sheet (Back, Play, Learn, Keys, Start from the top,
  Drill weak, Edit, Next) with its keyboard shortcut printed under it. Nothing
  is reachable by key alone.
