// The one door to ../../sentences.js, the plain JS shared with the app and the
// pipeline, with the types TypeScript cannot read off it.
import * as js from '../../sentences.js';

export interface Speech { speaker: string; text: string }
export interface Parsed { scenes: Speech[][]; speakers: Record<string, number>; errors: { line: number; text: string }[]; lines: number }

export const parseScript = js.parseScript as unknown as (text: unknown) => Parsed;
export const printScript = js.printScript as (scenes: Speech[][]) => string;
export const sentences = js.sentences as (text: string) => string[];
export const guessScript = js.guessScript as (text: string) => string;
