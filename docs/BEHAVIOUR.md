# Behaviour — transcriptor (the single-file app as it stands, 2026-09-30)

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

`stress.json` maps a full script line to how it should be spoken (in the
product this is the production's `sayas` table, same shape, set over
`PUT /productions/:id/sayas`):

```json
{ "NELSON: That's what I said.": "That's what \"I\" said." }
```

The key must match the line in `script.js` exactly, including the speaker. The
value replaces the spoken text only — the screen still shows the real line. Use
it for the contrast a line turns on: "eight **thousand**" against "eight
hundred", "**You** are" answering "Who is."

## The app

The show's own host (lpender.github.io, or `?show=1`) opens on the bundled
script with its cues, as the cast is used to. Anywhere else, a first visit
(no saved script, no account) gets the product page (`docs/design/first-run.md`):
the pitch, Try a sample scene (primary; a public-domain Wilde scene), Paste
your script, Sign in, a learn-mode preview built from the sample, three
tiles (actors, directors, stage managers), the price in words, then the
paste box under "Paste your script". `cues.js` is not applied there, a
production's own cues are.

State lives in `localStorage` (script, current line, key-word mode, role, best
run, per-sentence misses). The bundled script wins over a saved copy unless the
reader pasted their own.

- **Following.** Next and Back move a line at a time, the current line is
  centred, and the ends join up: past the last line is the first.
- **Reading aloud.** Plays each line's clip and advances. Two boxes set a loop:
  play N lines, drop back M, so it creeps forward while repeating. A line with
  no clip is read by the device's own voices (one per character, the
  same each time on that device; a silenced character is read at no
  volume), and skipped only where the browser has none. With learn mode on, the
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
  all the room tone play, kept across visits. Each file plays through a gain of its own
  (`window.GAINS` in `cues.js`, dB, 0 when absent) so a file can be levelled
  without re-encoding; `loudness(file)` measures a file in the browser on
  the same scale as ffmpeg's volumedetect, so the gain for an upload is
  target minus loudness; the upload also measures the file's length. The
  Sound files list reads "1:23 · levelled" (the dB in the title), and the
  scene editor's selects say "music: Name" / "room tone: Name". The beds are levelled to one
  loudness by `normalize.py` (a flat gain each, no compression) so one slider
  fits them all, and the music to another, 5 dB louder. Tapping a scene's name there goes to its
  first line and keeps the sheet open. The header names the scene sounding.
  Scenes take cues in order; a cue marked `hold` (before the show, the silent
  reception, the end) is a stop of its own in the script column, pressed
  through like a line but never voiced or learned. Changing scene cuts the
  old sound with a 0.1s fade; the same scene again is left alone. Reading
  aloud waits on a stop's music before moving on. Files live in `sound/` and
  are cached on first play.
- **The company's sound.** Signed in with a production, the Show section lets
  an owner, director or crew member add music and room tone (measured in the
  browser on upload and levelled by a gain, never re-encoded) and lay out the
  scenes: a name, its music, its room tone, and whether it is a hold. Saved
  cues replace `cues.js` on every member's device.
- **Learn mode.** Your lines are hidden as `▒▒▒▒▒` blocks — fixed width, so
  length gives nothing away — and lines ahead are invisible. Say the line, then
  press: Next onto your line reveals its first sentence, and each right answer
  clears the piece and reveals the next in the same press. A miss takes back
  the two before it, hidden again to say over. The score is how far you get; the best run
  is kept per role. Tapping back to an earlier line, or jumping to a scene,
  restarts from there: every line from it onward is hidden and owed again.
  F swaps the blocks for the first letter of each word ("H a y, m d E?"), the
  paper trick, for a line that is nearly there; the setting is kept per device.
- **Hearing you.** H turns on the microphone while learning (Chrome and
  Safari; the switch is hidden elsewhere). When the last two words of the
  sentence under test are heard, that counts as the press: reveal, or right
  and on to the next. Nothing is graded by ear; a miss is still yours to
  mark with N.
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
- **Together.** One device leads and others follow. Signed in with a
  production, the production is the room: pick Lead or Follow and the
  server orders every move, hands a late joiner the last one, and the
  header says who is here. Signed out, each device enters the same room
  word in the More sheet and picks Lead or Follow; every move the leader
  makes (a press, a tap, a scene jump) goes out over a public MQTT broker
  (WebSocket, no account; three brokers, tried in turn) and the followers go
  to the same line. A move carries the index, the line's text and a
  fingerprint of the script: the same script means the index is exact, a
  different cut means the nearest line with that text. Messages are signed
  with a key drawn from the room word and the topic is a hash of it, so
  nothing else on the broker can move a follower and the word never travels;
  they carry the leader's clock, so a late or repeated one is dropped. The
  leader repeats its place every 15 s and the broker retains the last move,
  so a follower joining late, or back from a dropped link, lands right; one
  that hears nothing for 45 s says so in the header, which also names the
  role. A dead socket is noticed by its missed ping and reconnected.
- **Notes.** A plus at the right of every line (shown on hover where there is
  a mouse) opens a box for a note on it; Enter or leaving the box keeps it,
  Escape drops the edit, and an emptied note is removed. A kept note shows
  in a column to the right of the line, or beneath it on a narrow screen,
  and tapping it edits. Notes are kept in this browser by
  the line's text, so they survive a re-split; signed in and in a
  production they are kept there too and follow you between devices. Signed in as an owner or
  director, the editor also takes "Say it as…": how the voice should say
  the line (kept by the production, shown as ♪ under the note). The edit box opens where the note
  sits.
- **Account.** The More sheet's Account section takes an email address and
  sends a sign-in link (the API at `localhost:8787` in dev, `api.tablework.com`
  live); opening the link on this device signs it in and returns to the app
  with the sheet open. Signed in, the sheet shows the address, a name field
  (how the company and a director's AI see you) and Sign out, and the welcome
  landing is gone. Signed out, or with no API reachable, nothing else about
  the app changes.
- **Company.** Signed in, the Company section comes first in the sheet. With
  no production yet it has one button: "Keep this script under your account"
  when the device has a script (the paste box goes up with the production),
  "Start a production" when it does not (the new production then says to
  paste a script or ask your AI). The word "production" appears only once
  there is more than one member. The roster is one sentence per member, in
  theatre words: "Bob plays Lane. 9 of 14 sentences clear, 1 weak (“I didn't think it polite to listen, sir.”)" (the weakest three quoted) / "Ann
  pays the bill." / "Cy runs the sound and the cues." / "… directs." / "…
  has no part yet."; standing ("Not started.", "Off book.", "Quiet N
  days.") is shown to an owner or director. Then the seat count and monthly
  price; for an owner or director each other member's row ends with
  "change" (unfolds owner / director / cast / crew chips; owner offered only
  to an owner; a move to crew drops their parts) and a × to remove them,
  and anyone but the only owner has "Leave this production" (an owner who has named a second owner may leave) (the server keeps the
  last owner either way). A script pulled from a production is marked as its
  own; when this device is no longer a member (left or removed) the copy is
  dropped on the next load and the paste box says so. It makes invite links
  per role (14 days, copied to the clipboard). Opening an invite link opens
  the sheet on the Company section alone, saying what it joins; signed in
  you join at once, signed out you give an address and the link that arrives
  both signs you in and joins.
- **Off book, said.** When every sentence of your parts is clear in one run,
  the HUD says "Off book — a clean run of the whole part" instead of "Keep
  going"; the same moment the production records as off book.
- **Progress up.** Signed in and in a production, a graded sentence sends the
  best run, the size of your parts and the sentences still owed up to the
  production a beat later, so a director can see who is off book. Signed out
  nothing is sent; the browser keeps its own copy either way.
- **One script for the company.** Signed in and in a production that has a
  script, that script is the one this device reads; the bundled one and a
  local paste are for the try-it path. An owner or director's paste box has
  "Save to the production", which validates and, on a bad line, names it;
  saved, the script is read at once and the voices are priced.
- **The sheet closes on a start.** A chip that starts something (learn, read
  aloud, drill, edit, top, listen, Lead, Follow) closes the More sheet so what
  it started is on screen; toggles (sound, key words, music, room) keep it
  open.
- **The script format.** One speech per line as `NAME: what they say`, a line
  of `***` between scenes, blank lines ignored, nothing else. `parseScript`
  in `sentences.js` reads it for the paste box and for the API alike and
  names every line that is not a speech, so a stage direction read as one is
  caught before it is saved.
- **Paying.** An owner sees how the production is paid for in words (a
  14-day trial, paid until a date, a failed card) and one button: Pay ($10 a
  seat a year, or $1 a month) which goes to Stripe, or Manage billing once
  subscribed. An unpaid production keeps reading, learning and following;
  saving, inviting and rendering say plainly that it is not paid for.
- **Company voices.** An owner or director picks a voice per character from
  the cast, sees what a render costs (only lines nobody has rendered in that
  voice count), and presses Render; the app fetches the clips a few at a
  time until done and plays them from then on. Signed in, the company's
  rendered voices replace the bundled clips.
- **Your AI.** Signed in, "Connect your AI" makes a personal token for
  Claude or any MCP client, shown once as a ready `claude mcp add` line
  (copied to the clipboard) with the MCP URL for a claude.ai connector.
  Tokens are listed by the name you gave them with their last use, and
  revoked with one press.
- **The More sheet.** Its sections fold; which are open is remembered on the
  device. Signed in, the Company section sits first.
- **Controls.** Every control is a button in the bar or the More sheet (Back, Play, Learn, Keys, Start from the top,
  Drill weak, Edit, Next) with its keyboard shortcut printed under it. Nothing
  is reachable by key alone.

Your productions (`docs/design/first-run.md`): signed in, Company opens on
one card per production you are in: the name, then "You play Lane · 4 in
the company" / "You direct · just you so far" / "You run the sound · …";
the open one is outlined, a tap opens another (the device's script follows; a production with no script shows an empty paste box, never the last production's lines),
and "Start a new production" asks a name and opens on the paste box without
carrying the current script across.

Start here (`docs/design/first-run.md`): the first thing in Company is the
role's first job in a sentence and one button that does it. Cast: "You're in
X. You play Lane, 14 lines." and "Learn Lane's lines" (sets the part, closes
the sheet, starts learn mode); with no part, "Which part do you play?" and
a button to the Parts section. Owner or director: "X: 3 in the company,
script loaded." and "Invite the cast" (makes the cast link and scrolls to
it); with no script, "X has no script yet …" and "Paste the script" (closes
the sheet, opens the paste box). Crew: "You're on crew for X. The sound and
the cues are under Show." and "Open Show". Parts flow both ways: a Mine chip sends the
device's parts to the production, and a device with none takes the parts a
director set.

A signed-in actor with a part and nothing running sees a one-line HUD nudge
("Lane: 2 of 7 clear · More, then Keep learning") so an idle reading
screen still points at the job.
