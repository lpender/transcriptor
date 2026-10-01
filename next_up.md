# Next Up — transcriptor

## Now
<!-- autodev until 2026-10-01 20:11 -->

## Queue

## Gated
- [ ] show-script-in-public-repo — DECISION (yours, legal): the show's
  `script.js`, `cues.js` and `clips/` have been in this public repo and on
  GitHub Pages since September, which the hard rule "the show's script is
  never in git, never shared beyond its production" forbids. The loop will
  not rip them out mid-run (the cast rehearses from that page). Options:
  (a) move the show into a production under your account (the API path now
  exists: add_script, sound upload) and delete the files from git history
  once the run ends; (b) keep until closing night and do (a) then; (c) make
  the repo private now (Pages still serves). Say which; the loop builds it.
- [ ] hear-me-on-device — ACTION (on-device): open the live app on your
  iPhone (Safari) and an Android phone (Chrome), pick a part, press "Hear me
  say it", allow the microphone, say a line: the last words should count as
  the press. Headless browsers have no microphone, so the loop cannot check
  this. Lee, 2026-10-01: "does it work?" — unverified on phones.
- [ ] stripe-keys — ACTION: a Stripe account in test mode, two prices ($1/mo,
  $10/yr), then `cd api && npx wrangler secret put STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`, and the price ids in `wrangler.toml` vars. Nothing
  charges until live keys. UNTIL: cf-account.
- [ ] eleven-key-and-bucket — ACTION: `cd api && npx wrangler r2 bucket create
  tablework-clips`, `npx wrangler secret put ELEVEN_LABS_API_KEY` and
  `npx wrangler secret put SEALING_KEY` (any long random string), then say
  yes to one test render of the 3 unrendered lines (~700 characters, cents).
  Spends credits. UNTIL: cf-account.
- [ ] connect-claude-ai — ACTION: once the API has a public URL (cf-account),
  add a custom connector in claude.ai at `https://<api>/oauth/mcp`, walk the
  consent page, call whoami. The provider and consent page are built and
  tested locally. Also `wrangler kv namespace create OAUTH_KV` and paste the id.
- [ ] resend-account — ACTION: a Resend account (free tier) with the domain
  verified in DNS, then `cd api && npx wrangler secret put RESEND_API_KEY`
  and `MAIL_FROM`. Until then sign-in links are only logged. UNTIL: buy-domain.
- [ ] cf-account — ACTION: the go-live runbook, steps 1–5 in
  `docs/ARCHITECTURE.md` (login, create D1/KV/R2, paste ids, secrets,
  `task deploy`). Free tier; needs your browser. Until then everything runs
  locally only.
- [ ] buy-domain — ACTION: tablework.com is NOT free (registered 2004, GoDaddy, expires 2027-04-29; the 2026-09-30 note saying otherwise was wrong). Free on 2026-09-30: tablework.co (recommended), tablework.io, tablework.live, tablework.studio, tablework.dev, gettablework.com, tableworkapp.com. Buy one, then tell the loop: it swaps the domain strings in `api/wrangler.toml` `[env.production]`, `docs/ARCHITECTURE.md` and `how.html`, and runs `task deploy:check`.
- [ ] render-three-silent-lines — ACTION: Run `ELEVEN_LABS_API_KEY=... python3 tts.py` for the 3 lines the
  2026-09-19 "Mr." re-split left silent (the three unrendered entries in
  `clips.js`; `python3 tts.py` lists them),
  then delete the 3 orphaned clips. Spends ElevenLabs credits.

## Done
- 2026-10-01 sweep after round 24: the show's lines were quoted in
  next_up.md (reworded to point at clips.js) and how.html (fixed earlier);
  `tts.py` and BEHAVIOUR name a character only. The bigger finding went to
  Gated: the show's script.js, cues.js and clips/ are tracked in the public
  repo.
- Persona round 24 (2026-10-01) — how.html at 390: reads clean, no sideways
  scroll, but the script example quoted three lines of the show's own
  (copyrighted) script on a public page. Replaced with the public-domain
  Wilde sample. Hard rule: the show's script never leaves its production.
- Persona round 23 (2026-10-01) — a sign-in link used twice: "That link has
  expired. Ask for another." was right but the sheet opened on Parts with
  the message far down and no field focused. Fixed: the Account section
  opens alone with the email field focused, as an invite landing does.
- Persona round 22 (2026-10-01) — the director's AI asks who is off book:
  no one-line picture and a bare "Last worked 2026-09-10" for an actor
  three weeks quiet. Fixed: the summary opens "0 of 1 off book, 1 quiet
  for a week." and rows say "Quiet 21 days." past a week. Tested.
- [x] director-start-line-worries — 2026-10-01 (loop): the director's Start
  here line adds "N not started" and "N quiet for a week" beside off book,
  the two things a director asks first. Verified with peek.mjs as Ann
  before and after aging Bob's progress.
- Persona round 21 (2026-10-01) — cast and director on a production whose
  trial lapsed: cast saw nothing and would learn with progress silently
  not kept; the director's "Not paid" line sat far below. Fixed: the Start
  here block opens with the state in words for every role (billing is
  read-gated, so one fetch serves all). Verified as Bob and Ann with the
  trial moved into the past, then restored.
- Persona round 20 (2026-10-01) — the full demo recipe on the latest build
  read as a stranger: director, cast and crew screens all read as sentences
  with one job each; only stumble was the upload chips standing taller than
  the chips beside them (fixed: level). Shots in tmp/demo.
- Persona round 19 (2026-10-01) — an actor with two parts drills weak lines
  (`api/scripts/walk-drill.mjs`): clearing the one weak line read "Off book
  — a clean run of the whole part" (wrong, it was a drill) and the score
  mixed the whole-part best into the drill. Fixed: "drilling 1 weak line ·
  1 clear" and "Drilled once — again to clear them for good" / "Weak lines
  cleared — now a clean run of the whole part".
- [x] scenes-past-the-breaks — 2026-10-01 (loop, from round 18): scenes map
  onto the script's *** breaks in order and extra ones were dropped
  silently. Now the Scenes section says how many the script has and how
  many will not play, and set_cues answers with the same note. Tested.
- Persona round 18 (2026-10-01) — the stage manager's AI sets cues with
  holds and crew leads through them: both devices stop at "Before the
  show" and move together; the hold line wore a ♫ with no music attached
  (fixed: the note only when the scene has music or room tone).
- Persona round 17 (2026-10-01) — crew leads, cast follows: the follower
  moved with the leader, but the HUD ran the learn nudge into the room line
  (fixed: no nudge in the room) and a cast member could press Lead and get
  "Only the leader moves the room" (fixed: Lead hidden for cast; the note
  says "Press Follow and your script goes where the leader goes").
- [x] owner-handover-in-app — 2026-10-01 (loop): an owner can make another
  member owner from the role chips and then "Leave this production" appears
  for them too; a member with a part who also directs or owns reads "plays
  Lane and runs the production". Verified with peek.mjs as Ann.
- Persona round 16 (2026-10-01) — a director tries to remove or demote the
  only owner: both refused with "Name another owner first." (correct), but
  the controls were offered at all. Fixed: the only owner's row carries no
  change or × for anyone. Verified with peek.mjs as Bob (director).
- Persona round 15 (2026-10-01) — a member of two productions switching
  cards: the script followed into a production that has none (Earnest's
  10 lines stayed on screen under "Empty Stage"). Fixed: switching to a
  scriptless production clears the device's script and shows the paste box
  with that production's name. Verified with peek.mjs as Dan.
- [x] director-sees-uncast — 2026-10-01 (loop): the director's Start here
  line adds "1 cast without a part yet" so casting gaps are seen before
  anyone wonders why a line is not learned. Verified with peek.mjs.
- 2026-10-01 17:11 — gate timing checked: vitest 10 s, tsc 2.4 s; the
  hour-long gaps earlier were session latency, not the gate. Production
  deploy dry-run passes (domain strings still tablework.com until bought).
- Persona round 14 (2026-10-01) — a director whose first contact is their
  AI: whoami returned no productions and no tool could make one, so
  "load this PDF into Tablework" dead-ended (fixed: `create_production`
  tool; whoami says "No productions yet: create_production, then
  add_script"). Tested; docs updated.
- [x] whoami-next-step — 2026-10-01 (loop): whoami carries each production's
  next step in words ("No script yet: load it with add_script", "Learn LANE;
  who_is_off_book shows your standing", "Script loaded; invite the cast"),
  the same job the app's Start here block names. Tested.
- Persona round 13 (2026-10-01) — how.html read against the app: "Owner —
  pays" (fixed: runs the production and pays) and "under Account, press
  Connect your AI" (fixed: under Company when signed in). Rest matches.
- [x] idle-actor-nudge — 2026-10-01 (loop, north star): a signed-in actor
  with a part and nothing running sees "Lane and Merriman: 2 of 7 clear ·
  More, then Keep learning" in the HUD instead of a blank screen. Verified
  with walk-return.mjs (day-two cold open).
- Persona round 12 (2026-10-01) — the two emails a real actor reads first:
  "Your sign-in link / Open this link to sign in" said nothing about what
  Tablework is or what happens if ignored (fixed: "Sign in to Tablework",
  "Tap the link below … on this device … If you did not ask for this,
  ignore it; nothing happens"); the invite mail now says it also signs you
  in. Only logged until Resend is set up.
- Persona round 11 (2026-10-01) — a cast member's device after the director
  replaced the script over MCP: the new cut arrived (4 lines), the recast
  parts came down ("You play Lane and Merriman, 3 lines"), standing
  restarted ("Not started."), 0 console errors. No stumbles.
- Persona round 10 (2026-10-01) — a director's AI replaces the script over
  MCP: bad lines refused with the line quoted; the new cut saved with
  speakers and scenes; recasting worked; but who_is_off_book still said
  "1 of 5" against the old cut (fixed: a new cut restarts standings, keeps
  misses; LOG).
- Persona round 9 (2026-10-01) — an actor back the next day on the same
  phone (`api/scripts/walk-return.mjs`): signed in still, script and place
  kept, Company says "1 of 5 sentences clear, 1 weak (“…”)" and Practice
  offers "Drill 1 weak line"; the only stumble was the start button still
  saying "Learn" on day two (fixed: "Keep learning Lane's lines").
- [x] weak-sentences-in-roster — 2026-10-01 (loop): the director's roster
  quotes each member's weakest sentences, as who_is_off_book does ("1 weak
  (“I didn't think it polite to listen, sir.”)"); own standing too.
  Verified with peek.mjs as Ann; 61 tests green.
- Persona round 8 (2026-10-01) — first-time director at 1280
  (`WIDTH=1280 node api/scripts/walk-director.mjs`): every step answered;
  the name nudge rendered at headline size (fixed: a note).
- [x] weak-sentences-named — 2026-10-01 (loop, north star "where each actor
  is weak"): misses go up as the sentences themselves, and who_is_off_book
  quotes the weakest three: `1 weak ("I didn't think it polite to listen,
  sir.")`. Also caught: the morning's half-miss decay sent 0.5 counts the
  API refused (400), so no progress had synced since 11:30 — counts are
  whole again. Verified with walk-cast.mjs then MCP as Ann; 61 tests green.
- [x] role-chips-not-select — 2026-10-01: "change" unfolds role chips inline,
  one press sets the role and folds back; a move to crew drops the member's
  parts; standing hidden when there is no part. Verified with peek.mjs as
  Ann (crew and back), 61 tests green.
- Persona round 7 (2026-10-01) — two members in the production's room
  (`api/scripts/walk-room.mjs`): Lead/Follow worked, the follower moved
  with the leader; the Together section had no words (fixed: one sentence
  on what it does and "Here now: Bob Okafor, Ann Reyes (leading)").
- [x] share-invite-link — 2026-10-01 (loop): where the browser can share
  (phones), the invite link gets a "Share the link" button that opens the
  system share sheet with "Join X on Tablework as cast: <url>"; elsewhere
  the link is still copied. Verified the copy path with peek.mjs; the share
  button needs a phone (headless Chromium has no navigator.share).
- Persona round 6 (2026-10-01) — a director's AI over MCP: set_parts let a
  crew member hold a part (fixed: refused with the reason and set_role);
  add_script answered raw codes "invalid_title" / "empty_script" (fixed: in
  words); invite, get_script and who_is_off_book read fine.
- [x] own-standing-and-off-book-count — 2026-10-01 (loop, north star): cast
  see their own standing from the device ("You play Lane, 5 lines. 3 of 14
  sentences clear."), not a permanent "Not started"; a director's start line
  reads "3 in the company, 0 of 1 off book". Verified with peek.mjs as Bob
  and Ann.
- Persona round 5 (2026-10-01) — stage manager at 390
  (`api/scripts/walk-crew.mjs`, two generated WAVs): Open Show, two uploads
  levelled and timed, a scene with music and room tone saved and back
  after reload, 0 console errors. Only stumble: "Saved 1 scenes." (fixed).
- Persona round 4 (2026-10-01) — cast learning on a phone
  (`api/scripts/walk-cast.mjs`): the first-run hint promised "your line
  comes hidden" but the press reveals it (fixed: "Say your next line, then
  press Next"); hint "Right, or say you missed it" did not match the buttons
  Got it / Missed (fixed: "Got it, or missed?"); a missed line then one Got
  it left "No weak lines yet" though the comment promised two clean runs
  clear a miss (fixed: half a miss per clean run).
- Persona round 3 (2026-10-01) — first-time director from the landing
  (`api/scripts/walk-director.mjs`): the sign-in box had no sentence (fixed:
  why sign in, no password); signed in with no production, one bare button
  (fixed: a sentence first); after keeping, the roster showed the email
  because no name was given (fixed: start block asks for a name). Sign-in,
  keep, invite all answered; 0 console errors.
- Persona round 2 (2026-10-01) — cast pressing "Learn Lane's lines" landed on
  Algernon's cue with the hint "Keep going" (fixed: first run says
  "Algernon speaks. Press Next; your line comes hidden"); landing words and
  the director sheet at 1280 read clean; sections Company, Parts, Practice
  all open for cast is long but each is theirs. No new items.
- [x] voices-quote-in-words — 2026-10-01: "Nothing rendered yet. Rendering
  2 voices for this script: $1.00 to finish." (share-of-script words; exact
  counts in the title). Verified with peek.mjs as Ann.
- Persona round 1 (2026-10-01, this window) — as director, cast and crew at
  390 on the fresh demo seed: production name three times on one screen
  (fixed: roster heading is "The company"); owner read "pays the bill"
  about themselves (fixed: "runs the production"); red focus ring on every
  sheet open (fixed: the dialog takes focus); voices quote in "characters"
  (queued). MCP answers read fine.
- [x] crew-show-drawn-twice — 2026-10-01: two drawSoundPanel calls in flight
  (script arrival and the cue pull) both appended after their await; a
  generation counter drops the stale one, as drawCompany already does.
- [x] member-row-remove-wraps — 2026-10-01: gone with company-in-sentences;
  the controls follow the sentence and wrap under it as a group.
- [x] your-productions-home — 2026-10-01: Company opens on "Your
  productions" cards (name; "You play Lane · 4 in the company"; open one
  outlined; tap switches, script follows) plus "Start a new production"
  (never carries the script across). `GET /productions` now returns parts.
  Verified at 390 as Dan in two productions (tmp/productions-home-390.png,
  tmp/productions-home-switched-390.png); 61 tests green.
- [x] company-in-sentences — 2026-10-01: one sentence per member ("Bob
  plays Lane. 9 of 14 sentences clear, 1 weak."), serif, controls after;
  service worker off on localhost. Verified at 390 as Ann
  (tmp/company-sentences-390.png).
- [x] start-here-director-crew — 2026-10-01: director with script → "Invite
  the cast" (link made, scrolled to); without → "Paste the script" (sheet
  closes, box focused); crew → "Open Show" (section opens). Verified at 390
  as Ann, Dan (Empty Stage) and Cy; 0 console errors. Dev server now
  no-store (`tools/serve.py`, QUIRKS).
- [x] start-here-cast — 2026-10-01: "You're in Demo Earnest. You play Lane,
  5 lines." + "Learn Lane's lines" lands in learn mode in one press (sheet
  closed, 5 items); parts adopted from the production, Mine chips push them
  up. Verified at 390 as Bob (tmp/start-cast-390.png), 0 console errors.
- [x] landing-product-page — 2026-10-01: product page above the paste box
  (pitch, primary Try a sample scene, learn-mode preview, three tiles, price,
  "Paste your script"); paste hint got its own id (`#pasteHint`), the empty
  diagnostics box hides. Verified: tmp/landing-390.png, tmp/landing-1280.png,
  sample starts (10 lines), 0 console errors besides the API being down.
- [x] (EPIC) product-landing-and-first-run — 2026-10-01 design round done:
  `docs/design/first-run.md`; split into the four items above.
- [x] demo-fixture-names — 2026-10-01: demo seeds now Ann Reyes, Bob Okafor,
  Cy Nakamura (Lee: "What is a fixture?"). Verified: grep in demo-shots.mjs.
- [x] scenes-editor-labels (2026-09-30) — scene selects say "music: X" / "room tone: Y" so a filled row still names its kind. Verified: 390 shot tmp/scenes-labels-390.png.
- [x] sound-plain-words (2026-09-30) — sound rows read "1:23 · levelled" (dB in the title); long names shrink instead of pushing Delete off the row; wide chips are flex so key badges stay right when text wraps. Verified: 390 shot tmp/sound-plain-390.png.
- [x] loop-row-phone (2026-09-30) — loop row restacked ("loop [n] sentences, back [n]" + faded "0 = straight through"); wide chips no longer wrap. Verified: 390 shot tmp/loop-row-390.png.
- [x] user-name (2026-09-30) — `PUT /me {name}`, MCP `set_name`, name field in Account; names before emails in company rows and who_is_off_book. Verified: vitest (60), Chrome (name saved, survives reload, row reads "Lee P (you)").
- [x] mcp-progress — DONE 2026-09-30: `who_is_off_book` over MCP for owner/director, one line per member in words (not started / N of M clear, K weak / off book, last worked). 1 test.
- [x] mcp-parts-by-name — DONE 2026-09-30: `set_parts` matches speaker names against the current script (case-insensitive) and refuses unknown ones with the speaker list. Same test.
- [x] notes-sync — DONE 2026-09-30: migration 0012 (`notes.line`), `GET/PUT /productions/:id/me/notes` [learn]; every note edit goes up when signed in, and on load the production's copy overlays the device's. Also: `pullCues` rebuilds the script only when the cues changed. 1 test; driven in Chrome: note up, local copy dropped, back after a pull, cleared on the server by an empty note.
- [x] deploy-config — DONE 2026-09-30: `[env.production]` in `api/wrangler.toml` (live origins, custom domain, bindings), `task deploy` / `task deploy:check`, Pages `_headers`, and the go-live runbook in `docs/ARCHITECTURE.md`. `wrangler deploy --dry-run --env production` passes.
- [x] sheet-sections-fold — DONE 2026-09-30: every More section is a `<details>` with its open state remembered; Parts, Practice and Account open by default; signed in, Account becomes "Company" and moves to the top. At 390 the sheet went from 3,251 to 1,857 px with the company on the first screen (`tmp/qa/2026-09-30-sheet-folded-390.png`).
- [x] production-name — DONE 2026-09-30: creating asks for a name (guessed from a title line in the paste, else "My play"); `PUT /productions/:id {name}` for owner/director; tap the name in the company panel to rename, tab title follows. 1 test; driven in Chrome ("Script Follower" → "Waiting").
- [x] mcp-oauth — DONE 2026-09-30: `@cloudflare/workers-oauth-provider` 1.2.1 wraps the Worker (`api/src/oauth.ts`): discovery, dynamic registration, PKCE, tokens in OAUTH_KV; `/oauth/mcp` runs the same rpc for an OAuth user; the consent page (`routes/authorize.ts`) names the client, its host and your productions, with a sign-in form that returns to it. 1 end-to-end test: register → consent → allow → code → token → whoami. The claude.ai connection itself waits on a public URL (Gated).
- [x] how-it-works-page — DONE 2026-09-30: `how.html`, eleven sections in plain words (try it, the script shape, productions and parts, invites, learning, voices and cost, sound, Together, your AI with the `claude mcp add` line, paying, your data), linked from the welcome and the Account section, cached by the service worker. Rendered at 390 with no horizontal scroll (`tmp/qa/2026-09-30-how-390.png`).
- [x] web-relay — DONE 2026-09-30: signed in with a production, Lead/Follow use the production's Room over WebSocket (server-ordered moves, last move on join, presence in the header "Leading <name> · 2 here", auto-rejoin after a drop); the room word hides; signed out keeps MQTT. Driven in Chrome: leader's jumps arrive on a second socket as seq 7, 8; 101 passthrough bug in cors() found and fixed.
- [x] relay-do — DONE 2026-09-30: `api/src/room.ts` Room Durable Object (hibernation sockets, lead on/off gated by the role table, moves stamped with a sequence and kept as the last move, presence broadcasts, ping), `GET /productions/:id/room` upgrade route passing who and role, wrangler binding + SQLite migration. 2 tests with real WebSocket pairs.
- [x] web-billing — DONE 2026-09-30: the company panel shows how the production is paid for in words and one action: Pay $10 a seat a year (or $1 a month) for the owner, Manage billing once subscribed; `?billing=` landings say what happened; routes answer Stripe outages as a plain 502; any throwing route now answers JSON 500 with CORS. Driven in Chrome with a dummy key: trial line, Pay reaches Stripe (`tmp/qa/2026-09-30-billing.png`).
- [x] billing-gate — DONE 2026-09-30: `gate()` answers 402 with a plain message for write capabilities (script, cues, render, share) when the production may not save; invite accept and MCP writes refuse the same way; reading, learning, progress and Together untouched. 1 test.
- [x] billing-seats — DONE 2026-09-30: `api/src/seats.ts` sets the subscription quantity after a join or removal, best effort; 1 test.
- [x] billing-routes — DONE 2026-09-30: `GET /billing/plans` (from Stripe, cached), `GET /productions/:id/billing` (state in words, seats), checkout (quantity = members, remaining trial carried), portal, `POST /webhooks/stripe` (signature, checkout/subscription/invoice events → state). 2 tests with a stubbed Stripe walking trial → active → past_due → readonly.
- [x] billing-core — DONE 2026-09-30: migration 0011 (trial_ends_at, period_ends_at), `api/src/stripe.ts` (fetch + form bodies, `setStripe()` seam, webhook signature verify/sign with Web Crypto), `api/src/billing.ts` (`canWrite`, `effectiveState`, `describe` in words), productions start on a 14-day trial. 3 tests incl. a hand-signed payload.
- [x] welcome-landing — DONE 2026-09-30: on any host but the show's (or `?show=1`), a first visit shows "Tablework — Run lines with your company" with Paste a script / Sign in / Try a sample (a Wilde scene, public domain); the bundled script and cues.js stay for the show's host. Driven in Chrome at 390: welcome, sample loads 10 lines with no cues; `?show=1` still 285 lines and 11 cues (`tmp/qa/2026-09-30-welcome-390.png`).
- [x] app-title — DONE 2026-09-30: `<title>` is Tablework; signed in, "<production> · Tablework".
- [x] aloud-loop-words — DONE 2026-09-30: "read [N] sentences, then go back [M] (0: straight through)".
- [x] web-sound-panel — DONE 2026-09-30: Show section gains "Sound files" (Add music / Add room tone, levelled on upload by `loudness()` to −23/−28 dB, gain shown, Delete) and "Scenes" (name, music, room tone, hold, Save) for owner/director/crew; a production's cues replace cues.js and the engine plays its URLs through the per-file gain. Driven in Chrome: two uploads (+0.4, +0.5 dB), two scenes saved, both tracks playing from the API with the right gain, the hold stop in the script.
- [x] mcp-cues — DONE 2026-09-30: `list_sound` and `set_cues` over MCP (files by id or name, unique scene names, holds), sharing `setCues`/`getCues` with the HTTP routes. 1 test.
- [x] sound-api — DONE 2026-09-30: migration 0010 `sound` + `cues`; upload through the Worker (25 MB, audio types), list, delete refused while a cue uses it, `GET/PUT /productions/:id/cues` in cues.js's shape with `gains`, `GET /sound/:key` from R2. 1 test walking the lot.
- [x] web-say-as — DONE 2026-09-30: the note editor (owner/director, signed in) gains a "Say it as…" field; saved to `/sayas`, shown as ♪ under the note, the quote counts the line as unrendered. Driven in Chrome: 689 → 703 characters to render after a say-as (`tmp/qa` not needed).
- [x] web-voices-panel — DONE 2026-09-30: "Company voices" in the Account section (owner/director): a voice per speaker from our cast, the quote in plain words, "Render the voices for $X" that drives the batches to done; clips come from the API in clips.js's shape (spans now stored on the clip row, seed updated). Driven in Chrome against local D1: 6 speakers, $1.00 quote, render refused politely without a key (`tmp/qa/2026-09-30-voices.png`).
- [x] stress-per-line — DONE 2026-09-30: migration 0008 `sayas` (per production, keyed by full line), `plan()`/quote/render take it and hash on the spoken text, `GET/PUT /productions/:id/sayas` [script]. 2 tests. `stress.json` is that table's shape and can be PUT as-is; the notes-column editor comes with web-voices-panel.
- [x] voices-byo-key — DONE 2026-09-30: migration 0007, `api/src/seal.ts` (AES-GCM under `SEALING_KEY`), routes get/put/delete `/productions/:id/eleven-key` (owner only, last4 shown), `keyFor()` picks the production's key over ours, quote is $0 with an own key. 2 tests.
- [x] voices-render-job — DONE 2026-09-30: migration 0006 `renders`; `api/src/eleven.ts` (adapter, tts.py's spans), `render.ts` (client-driven batches of 4, idempotent by hash, failures recorded, retry), routes start/next/retry/progress, `GET /productions/:id/clips` (clips.js shape), `GET /clips/:hash`; R2 binding `CLIPS`. 3 tests with a stub engine. A real render needs the key and credits (Gated).
- [x] voices-quote — DONE 2026-09-30: migration 0005 `clips` + `voices`, `api/src/voices.ts` (cast, tts.py-compatible clip hash, $0.30/1k min $1, quote over uncached chars, dedup), routes `/voices`, `/productions/:id/voices`, `/render/quote`; `scripts/seed-clips.mjs` seeds the cache from clips.js. 4 tests; live: the real play quotes with its 3 unrendered lines only.
- [x] mcp-parts-invite — DONE 2026-09-30: `list_members`, `set_parts` (own, or anyone's with share), `invite` (director/cast/crew) in `api/src/routes/mcp-members.ts`; 1 test walking all three plus refusals.
- [x] web-script-from-production — DONE 2026-09-30: signed in, the production's script replaces the device's (place kept when identical); owner/director get "Save to the production" in the paste box with the validator's line numbers on refusal. Driven in Chrome: server line appears, paste-box line lands on the server, bad line refused.
- [x] mcp-add-script — DONE 2026-09-30: `parseScript`/`printScript` in `sentences.js` (shared), `api/src/scripts.ts`, `PUT/GET /productions/:id/script` and MCP `add_script`/`get_script` with the hard validator and speaker counts; 4 tests. Live over wrangler dev: the real Waiting script loads via MCP.
- [x] web-progress-view — DONE 2026-09-30: an owner or director sees each member's standing on their row ("12 of 40 clear, 3 weak", "off book", "not started"). Fixed a double draw of the panel when two sign-in paths raced. Driven in Chrome (`tmp/qa/2026-09-30-progress.png`).
- [x] web-tokens — DONE 2026-09-30: "Your AI" in the Account section: Connect your AI → labelled token shown once as a `claude mcp add` line (copied) plus the claude.ai connector note; tokens listed with last use and Revoke. Driven in Chrome: token lists MCP tools, revoked token gets 401 (`tmp/qa/2026-09-30-tokens.png`).
- [x] mcp-scaffold — DONE 2026-09-30: `api/src/mcp.ts` (stateless Streamable-HTTP JSON-RPC: initialize, tools/list, tools/call, ping), `routes/mcp.ts` (`POST /mcp` with a bearer, personal tokens as labelled 10-year sessions: mint once, list, revoke), tools `whoami` + `list_productions`. 2 tests; live curl: initialize → whoami returns the user and production.
- [x] sync-progress — DONE 2026-09-30: migration 0003 `progress`, `PUT /productions/:id/me/progress` [learn] and `GET …/progress` [progress]; the app posts 2 s after a graded sentence when signed in and in a production. 2 tests; driven in Chrome: one right answer → best 1 of 317 on the server.
- [x] web-production-panel — DONE 2026-09-30: signed in, the Account section shows the company: create ("Keep this script under your account"), members with roles and parts, seat count and price, Invite cast/crew/director links (copied), a picker when in several productions; `?invite=` landing peeks, joins signed in or by email link. Driven in Chrome against `task dev` with a second user via curl (`tmp/qa/2026-09-30-company.png`).
- [x] web-signin — DONE 2026-09-30: Account section in More (email → link; signed in shows the address and Sign out), `api()` helper with credentials, `/me` on load, `?signin=` and `?joined=` landings. Preflight CORS added to the Worker. Walked in Chrome against `task dev`: link → verify → signed in → sign out (`tmp/qa/2026-09-30-signin.png`).
- [x] api-invites — DONE 2026-09-30: `api/src/invites.ts` + `routes/invites.ts` (mint 14-day multi-use link, list, revoke, public peek, accept signed in or via an invite magic link that joins on verify); 3 tests on D1.
- [x] api-productions — DONE 2026-09-30: `api/src/productions.ts` + `routes/productions.ts` (create, list, get with members, set role, remove/leave, parts) behind `gate(cap)`; last-owner rule; 5 tests on D1.
- [x] auth-routes — DONE 2026-09-30: `/auth/link`, `/auth/verify`, `/me`, `/auth/logout` in `api/src/routes/auth.ts`, mail through `email.ts` (Resend when keyed, logged otherwise). 3 route tests on D1; walked live on `wrangler dev` with curl: 202 → 302 with cookie → /me 200.
- [x] auth-core — DONE 2026-09-30: migration 0002 (magic_link_tokens, sessions), `api/src/auth.ts` (issue/verify links, sessions, `currentUser` from cookie or bearer), `ids.ts`; 5 tests on a real D1 via `@cloudflare/vitest-pool-workers` 0.22 + vitest 4.
- [x] db-schema-0001 — DONE 2026-09-30: `api/migrations/0001_productions.sql` (users, productions, members, invites, scripts, notes), `api/src/access.ts` with the role × capability table and 4 tests; applied to local D1, CHECK on role verified.
- [x] cf-scaffold — DONE 2026-09-30: `api/` Worker (router.ts + index.ts entry), vitest + tsc, `Taskfile.yml` with serve/dev/test/deploy; `task test` green; `wrangler dev` answers `/health` with CORS for the app origin.
- [x] measure-loudness — DONE 2026-09-30: `loudness(blobOrUrl)` in index.html (Web Audio, mean-square dB). Playwright: OfficeFans −28.43 vs ffmpeg −28.4, SadDay −23.48 vs −23.5; a 0.1-amplitude tone −23.01 as expected.
- [x] engine-gain-node — DONE 2026-09-30: every track routes through a GainNode with `window.GAINS[file]` dB (0 when absent); slider and fades untouched. Verified in Playwright with real audio: +6 dB → 1.995, −3 dB → 0.708, both tracks playing, fade stops one and leaves the other.
- [x] browser-voices — DONE 2026-09-30: `speak()` via speechSynthesis when a line has no clip, voice per character by name hash, silenced at volume 0, header says whose voices. Verified in Playwright with a stubbed engine (advances line by line, cancel on stop). Safari and real voices: Lee's ear.
- [x] design-sound-upload — DONE 2026-09-30: `docs/design/sound-upload.md`; never re-encode, measure in the browser, GainNode at playback; split into engine-gain-node, measure-loudness, sound-api, web-sound-panel.
- [x] design-voices-render — DONE 2026-09-30: `docs/design/voices.md`; ElevenLabs cost checked ($0.18/1k, play $11–18), ADR 003 amended; split into browser-voices, stress-per-line, voices-quote, voices-render-job, voices-byo-key, web-voices-panel.
- [x] design-mcp-ingest — DONE 2026-09-30: `docs/design/mcp-ingest.md`, ADR 005 (text in the paste format, no files over MCP, OAuth + bearer); split into verify-cf-mcp-oauth, mcp-scaffold, mcp-add-script, mcp-cues-parts-invite, mcp-oauth.
- [x] design-sharing-model — DONE 2026-09-30: `docs/design/sharing.md` (diverge, skeptic, spec, role table), ADR 004; split into db-schema-0001, api-productions, api-invites, web-production-panel, web-progress-view.
- [x] spike-cue-listening — DONE 2026-09-30: H switch "Hear me say it" in More; last two words of the sentence under test count as the press. Verified in Playwright with a stubbed SpeechRecognition (wrong words ignored, reveal, then right + next). UNTIL Lee tries it with a real mic: one-word pieces ("No.") will fire on any "no".
- [x] productionize-billing-period — DECIDED 2026-09-30 (loop): monthly and yearly, yearly default (ADR 003 as written).
- [x] productionize-name — DECIDED 2026-09-30 (loop): Tablework. Runner-up Run-through. Off Book rejected.
- [x] platform-conventions — DONE 2026-09-30: `~/dev/godfiles/conventions/PLATFORM.md` v1, references given.care auth/access and bodylang Stripe; checklist for new apps.
- [x] recon-competitors — DONE 2026-09-30: `docs/recon/competitors.md`, five products, every claim linked. Finding: cue-listening via speech recognition is the one feature we lack; queued as a spike.
- [x] productionize-docs — DONE 2026-09-30: kind tool → app; VISION, ADR
  001 positioning, 002 stack, 003 pricing/voices, product LOG, ARCHITECTURE
  with target shape, QUIRKS; `specification.md` moved to `docs/BEHAVIOUR.md`.
- [x] productionize-show-sound — DECIDED 2026-09-30: sound design is a
  per-production upload feature; James's files stay private to this show.
- [x] note-box-three-lines (2026-09-26) — global `textarea { height: 58vh }`
  overrode `rows`; scoped to `#src`, box is `rows=3`. Verified in Playwright
  at 1400 and 390 wide.
