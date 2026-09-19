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

if (typeof module !== 'undefined') module.exports = { blocks, sentences, norm };
if (typeof window !== 'undefined') Object.assign(window, { blocks, sentences, norm });
