// The one definition of a testable piece of a line, shared by the app and by
// tts.py (which runs it through node when timing a clip's sentences).
const norm = t => t.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

// Split a speech at the punctuation that breaks up speech — full stops, commas,
// semicolons, colons and dashes — but never at apostrophes or quotes. Abbreviations
// like "Mr." and stray scraps stay attached to the piece before them.
function sentences(text) {
  const out = [];
  for (const s of text.match(/[^.!?…,;:—–]+[.!?…,;:—–]*[\s]*/g) || [text]) {
    const last = out[out.length - 1];
    // A scrap of one or two words is not worth testing, so it joins the piece before it.
    const scrap = t => (t.match(/[\p{L}\p{N}'’-]+/gu) || []).length < 3;  // "I'm" is one word
    if (last && (/\b(Mr|Mrs|Ms|Dr|St|U\.S)\.\s*$/.test(last) || scrap(last) || scrap(s))) out[out.length - 1] += s;
    else out.push(s);
  }
  return out.map(s => s.trim()).filter(Boolean);
}

if (typeof module !== 'undefined') module.exports = { sentences, norm };
if (typeof window !== 'undefined') Object.assign(window, { sentences, norm });
