// How a script is cut up, shared by the app, convert.py and tts.py so the piece
// you read, the piece you are tested on and the piece you hear are the same.
//
//   blocks()    — one sentence: what a line on screen is
//   sentences() — finer, down to commas and dashes: what learn mode tests
const norm = t => t.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

// A scrap too short to stand alone joins the piece before it. "I'm" counts as one
// word. "Mr." never ends a piece: it starts the next one, so "Mr. Sebatacheck!"
// stands on its own instead of hanging off the sentence before. A line on screen
// can be as short as two words ("Miss busy-screwing-up-somebody-else's-inforMAtion.");
// a piece to be tested on needs three, or you are quizzed on "No sir."
const wordCount = t => (t.match(/[\p{L}\p{N}'’-]+/gu) || []).length;
const trails = t => /\b(Mr|Mrs|Ms|Dr|St|U\.S)\.\s*$/.test(t);

function cut(text, at, least) {
  const out = [];
  for (const s of text.match(at) || [text]) {
    const last = out[out.length - 1];
    if (last && (trails(last) || !trails(s) && (wordCount(last) < least || wordCount(s) < least))) out[out.length - 1] += s;
    else out.push(s);
  }
  return out.map(s => s.trim()).filter(Boolean);
}

// Sentence ends only: full stops, question and exclamation marks, ellipses.
const blocks = text => cut(text, /[^.!?…]+[.!?…]*[\s]*/g, 2);

// Every break in the speech — the above plus commas, semicolons, colons and
// dashes — but never an apostrophe, a quote or a hyphen inside a word.
const sentences = text => cut(text, /[^.!?…,;:—–]+[.!?…,;:—–]*[\s]*/g, 3);

// The one script format, for the paste box and for an AI over MCP alike:
//   NAME: what they say, on one line
//   ***                 a scene break
// Blank lines are ignored. Anything else is an error with its line number, so
// a stage direction read as a speech is caught before it is saved. Speakers
// are counted so "STAGE DIRECTION: 41 lines" is visible at a glance.
const SPEECH = /^([A-Z][A-Z0-9 .'&-]{0,40}?):\s+(.+)$/;
function parseScript(text) {
  const scenes = [[]], speakers = {}, errors = [];
  String(text).split(/\r?\n/).forEach((raw, k) => {
    const line = raw.trim();
    if (!line) return;
    if (line === '***') { if (scenes[scenes.length - 1].length) scenes.push([]); return; }
    const m = line.match(SPEECH);
    if (!m) { errors.push({ line: k + 1, text: line.slice(0, 80) }); return; }
    const speaker = m[1].replace(/\s+/g, ' ');
    scenes[scenes.length - 1].push({ speaker, text: m[2].replace(/\s+/g, ' ').trim() });
    speakers[speaker] = (speakers[speaker] || 0) + 1;
  });
  if (!scenes[scenes.length - 1].length) scenes.pop();
  return { scenes, speakers, errors, lines: Object.values(speakers).reduce((a, b) => a + b, 0) };
}
// The format back again, exactly as the app pastes it.
const printScript = scenes => scenes.map(sc => sc.map(l => `${l.speaker}: ${l.text}`).join('\n')).join('\n***\n');

if (typeof module !== 'undefined') module.exports = { blocks, sentences, norm, parseScript, printScript };
if (typeof window !== 'undefined') Object.assign(window, { blocks, sentences, norm, parseScript, printScript });
