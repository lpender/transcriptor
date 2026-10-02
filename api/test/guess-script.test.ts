import { describe, expect, it } from 'vitest';
import { guessScript, parseScript } from '../src/shared';

// What a PDF's text layer looks like once pdf.js has pulled it out: the name
// inline with the speech on one page, the name alone above it on the next,
// page numbers, a stage direction, a wrapped speech and act headings.
const FROM_PDF = `
ACT ONE

Algernon.  Did you hear what I was playing, Lane?

[LANE crosses to the table.]

Lane.  I didn't think it polite to listen, sir.

4

ALGERNON
I'm sorry for that, for your sake. I don't play
accurately — anyone can play accurately — but I
play with wonderful expression.

SCENE II

LANE (CONT'D)
Yes, sir; eight bottles and a pint.
`;

describe('guessScript', () => {
  it('turns a PDF\'s lines into the paste format', () => {
    const out = guessScript(FROM_PDF);
    const parsed = parseScript(out);
    expect(parsed.errors).toEqual([]);
    expect(Object.keys(parsed.speakers).sort()).toEqual(['ALGERNON', 'LANE']);
    expect(parsed.scenes.length).toBe(2);              // the SCENE heading is a break
    expect(parsed.scenes[0][0]).toEqual({ speaker: 'ALGERNON', text: 'Did you hear what I was playing, Lane?' });
    // a speech wrapped over three lines of the PDF comes back as one line
    expect(parsed.scenes[0][2].text).toContain('play with wonderful expression.');
    // page numbers and a bracketed direction are gone; (CONT'D) is not a name
    expect(out).not.toMatch(/crosses to the table|CONT/);
  });

  it('leaves text that is already the format alone', () => {
    const already = 'ALGERNON: Did you hear what I was playing, Lane?\n***\nLANE: Yes, sir.';
    expect(guessScript(already)).toBe(already);
  });
});
