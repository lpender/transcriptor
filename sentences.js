// How a script is cut up, shared by the app, convert.py and tts.py so the piece
// you read, the piece you are tested on and the piece you hear are the same.
//
//   blocks()    — one sentence: what a line on screen is
//   sentences() — finer, down to commas and dashes: what learn mode tests
const norm = t => t.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

// A scrap of one or two words is not worth its own piece, so it joins the one
// before it. "I'm" counts as one word, and "Mr." never ends a piece.
const scrap = t => (t.match(/[\p{L}\p{N}'’-]+/gu) || []).length < 3;
const trails = t => /\b(Mr|Mrs|Ms|Dr|St|U\.S)\.\s*$/.test(t);

function cut(text, at) {
  const out = [];
  for (const s of text.match(at) || [text]) {
    const last = out[out.length - 1];
    if (last && (trails(last) || scrap(last) || scrap(s))) out[out.length - 1] += s;
    else out.push(s);
  }
  return out.map(s => s.trim()).filter(Boolean);
}

// Sentence ends only: full stops, question and exclamation marks, ellipses.
const blocks = text => cut(text, /[^.!?…]+[.!?…]*[\s]*/g);

// Every break in the speech — the above plus commas, semicolons, colons and
// dashes — but never an apostrophe, a quote or a hyphen inside a word.
const sentences = text => cut(text, /[^.!?…,;:—–]+[.!?…,;:—–]*[\s]*/g);

if (typeof module !== 'undefined') module.exports = { blocks, sentences, norm };
if (typeof window !== 'undefined') Object.assign(window, { blocks, sentences, norm });
