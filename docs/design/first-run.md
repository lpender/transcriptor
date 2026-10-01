# First run — the landing and the first screen per role (design round, 2026-10-01)

Round: understand → diverge → skeptic → spec. Decided by the loop under the
"only money or human decisions are gated" rule, from Lee's read of the
2026-09-30 demo: "I have no clue what this is supposed to be. Is this
supposed to be clear to an actor / director?" and "The landing page is
really weird. This should look like a ProductHunt app."

## Understand

Three people arrive three ways and none of them know what Tablework is:

- **A stranger** finds the URL. Sees a paste box and three buttons. No idea
  what it does, who it is for, or what it costs.
- **An actor** taps an invite link from the group chat. Joins, then sees a
  roster with "cast · LANE · not started" and a button to leave. Their job
  (learn Lane) is three taps away behind Close → More → Practice.
- **A director** signs in after keeping a script. Sees the same roster, with
  selects and × buttons. Their jobs (invite the cast, hear who is off book)
  are there but unlabelled as jobs.

Root cause: the Company panel was built director-first, then shown to
everyone with controls removed. Rows are database records, not sentences.
"owner", "standing", "not started" are internal words.

## Diverge

Landing:
1. **Leave it.** A paste box is honest; how.html explains. Rejected: a
   stranger never reaches how.html.
2. **Separate marketing page** (`landing.html`) linking to the app. Clean
   separation; but two pages to keep in step, and the app's own URL still
   opens on a paste box.
3. **Product page inside index.html, above the paste box**, shown only
   signed out on a non-show host. Headline, one-line pitch, a live preview
   of learn mode built from the sample scene (real DOM, no screenshot to
   go stale), three tiles (actor / director / stage manager), price, one
   primary call to action. The paste box stays below as "Paste your
   script". One file, one source of truth.

First screen per role:
4. **Keep the roster, reword it.** Cheapest; still no next step.
5. **A "Start here" block at the top of Company**, written for the role:
   cast: "You're in The Importance of Being Earnest. You play Lane, 14 lines." + *Learn
   Lane's lines*; cast without a part: "Which part do you play?" + the part
   chips; director: "3 in the company. Script loaded." + *Invite the cast*;
   crew: "You're on crew. Sound and cues are under Show." + *Open Show*.
   Opens on first visit after joining; stays as the section's header.
6. **A separate onboarding screen** before the app. Heavier; a second mode
   to maintain; hides the app behind a wizard.

Roster wording:
7. Sentences per member: "Bob Okafor plays Lane. 9 of 14 lines clear, 1
   weak." Roles in theatre words: owner → "pays the bill", director,
   crew → "stage manager". One typeface for the list (serif), monospace
   only on controls.

## Skeptic

- Option 3 makes index.html longer. It is already 1,900 lines; the landing
  is ~60 lines of HTML and CSS, no script. Acceptable; a build step is not.
- A CSS-built "phone" preview risks looking fake. Mitigation: it is the real
  learn-mode markup (a cue line, a blocked line with one revealed sentence,
  the HUD) styled at small size, not a drawing of one.
- "ProductHunt" means a hero, a pitch, social proof. No users yet, so no
  proof: no fake quotes, no logos. The price in plain words is the
  trust line.
- Option 5: does a block at the top of a sheet count as a "first screen"?
  The sheet is already what opens after sign-in and join; the block makes
  its first line the answer. A full-page screen (6) would hide the script.
- The cast button "Learn Lane's lines" must set the part (`myRoles`), close
  the sheet and start learn mode in one press; otherwise it is a label.
- Director with no script: the start block says "Paste your script under
  Script, or ask your AI to load it" and the primary button opens Script.
- Wording "pays the bill" for owner: a director who also owns reads "pays
  the bill" about themselves. Acceptable and true; the alternative
  "producer" is a job they may not hold.
- `drawCompany` is already long. The start block is its own function
  `drawStart(role, members, script)`, called first.

## Spec

**Landing** (signed out, `!SHOW_HOST`, no saved script). In `#edit` above
the paste box, `#welcome` becomes:

1. `h1` Tablework. Pitch: "Learn your lines with your whole cast." Sub:
   "One script, one set of voices, the stage manager's cues, and the
   director sees who is off book."
2. Buttons: **Try a sample scene** (primary, filled), Paste your script,
   Sign in. A "How it works" link.
3. Preview: a framed block with the HUD line "3 of 14 clear · best 3" and
   two lines from the sample: ALGERNON's cue, then LANE's line with the
   first sentence shown and the rest as blocks. Caption: "Your lines hide.
   Say them, press, they appear. A miss takes you back two."
4. Three tiles: **Actors** — learn against the company's voices, misses
   drilled, works alone for free. **Directors** — invite by one link, see
   who is off book and where they are weak. **Stage managers** — sound and
   cues in the room, everyone follows the leader's place.
5. Price: "Free to try, no account. A production is $1 a seat a month or
   $10 a year, 14 days free. Rendered voices are priced before you pay."
6. The paste box below is titled "Paste your script" and keeps its hint.

Phone first: one column at 390, tiles stack; at 1280 tiles in a row,
preview beside the pitch.

**Start here** (`drawStart`), the first child of `#company`, per role:

| role | text | button |
|---|---|---|
| cast, has parts | You're in {name}. You play {Parts}, {n} lines. {standing in words} | Learn {Part}'s lines → sets myRoles, closes sheet, startLearn() |
| cast, no parts | You're in {name}. Which part do you play? | the part chips (same as Parts section) |
| owner/director, script | {name}: {k} in the company, script loaded. | Invite the cast → invite('cast') |
| owner/director, no script | {name} has no script yet. | Paste your script → opens Script section, focuses the box |
| crew | You're on crew for {name}. Sound and cues are under Show. | Open Show → opens the Show section |

Shown on every visit (it is the section's header). After an invite is
accepted or a production created, the sheet opens on it.

**Roster**: one `<p>` per member, serif. "{Name} plays {Parts}. {standing}."
for cast and for directors with parts; "{Name} directs." / "{Name} pays the
bill." / "{Name} runs sound and cues." otherwise. Standing words: "Not
started.", "{b} of {t} lines clear, {w} weak.", "Off book.", "Quiet {d}
days." Controls (role select, remove) stay on the row for owner/director,
after the sentence, and wrap under it at 390.

**Your productions** (Lee, 2026-10-01: "it should obviously have a thing
with like 'my scripts'"). Signed in, above the Start here block, Company
lists every production you are in, one card each: the name, then what you
do there and who is with you in one line ("You play Lane · 3 in the
company", "You direct · just you so far", "You run the sound · 8 in the
company"); the open one is marked and the others open on a tap (the
device's script follows). Below the list: **Start a new production**,
which asks for a name and opens on the paste box; it never carries the
current production's script across. With a single production the list is
one card, still with the button, so the way to a second production is
always on screen. The hidden `<select>` goes.

Items, one fire each: `landing-product-page`, `start-here-cast`,
`start-here-director-crew`, `company-in-sentences`, `your-productions-home`.
