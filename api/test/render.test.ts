import { describe, expect, it } from 'vitest';
import { setEngine, spans } from '../src/eleven';
import { handle } from '../src/router';
import '../src/routes/auth';
import '../src/routes/productions';
import '../src/routes/render';
import '../src/routes/scripts';
import '../src/routes/voices';
import { env } from './env';
import { signIn } from './helpers';

describe('spans', () => {
  it('times each sentence of a line like tts.py', () => {
    const text = 'I am here. You are there.';   // two pieces of three words; "No. Yes." would join into one
    const a = { characters: [...text], character_start_times_seconds: [...text].map((_, i) => i / 10), character_end_times_seconds: [...text].map((_, i) => (i + 1) / 10) };
    const out = spans(text, a);
    expect(out).toHaveLength(2);
    expect(out[0][0]).toBe(0);
    expect(out[1][0]).toBeCloseTo(1.1);   // "You" starts at character 11
    expect(out[1][1]).toBeCloseTo(2.5);
  });
});

describe('rendering', () => {
  it('renders in batches, caches by hash, survives a failure, serves the clip', async () => {
    const calls: string[] = [];
    setEngine(async (_voice, say) => {
      calls.push(say);
      if (say === 'Boom.') throw new Error('engine says no');
      return { audio: new TextEncoder().encode(`mp3:${say}`).buffer as ArrayBuffer, spans: [[0, 1]] };
    });
    (env as { ELEVEN_LABS_API_KEY?: string }).ELEVEN_LABS_API_KEY = 'test-key';
    const ann = await signIn('ann15@example.com');
    const { production } = await (await ann.call('POST', '/productions', { name: 'Ghosts' })).json() as { production: { id: string } };
    expect((await ann.call('POST', `/productions/${production.id}/render`)).status).toBe(404);   // no script
    const text = ['A: One.', 'B: Two.', 'A: Three.', 'B: Four.', 'A: Five.', 'C: Boom.', 'A: One.'].join('\n');   // 6 distinct clips, one repeated
    await ann.call('PUT', `/productions/${production.id}/script`, { title: 'Ghosts', text });
    const started = await ann.call('POST', `/productions/${production.id}/render`);
    expect(started.status).toBe(201);
    const { render: r0 } = await started.json() as { render: { id: string; total: number; done: number; state: string } };
    expect(r0).toMatchObject({ total: 6, done: 0, state: 'running' });
    expect((await (await ann.call('POST', `/productions/${production.id}/render`)).json() as { render: { id: string } }).render.id).toBe(r0.id);   // one at a time
    const r1 = (await (await ann.call('POST', `/productions/${production.id}/render/${r0.id}/next`)).json() as { render: { done: number; state: string } }).render;
    expect(r1).toMatchObject({ done: 4, state: 'running' });
    const r2 = (await (await ann.call('POST', `/productions/${production.id}/render/${r0.id}/next`)).json() as { render: { done: number; state: string; failed: { speaker: string }[] } }).render;
    expect(r2).toMatchObject({ done: 5, state: 'done' });
    expect(r2.failed).toEqual([expect.objectContaining({ speaker: 'C', error: 'engine says no' })]);
    expect(calls).toHaveLength(6);   // "One." rendered once
    // the clip is served and listed
    const { clips } = await (await ann.call('GET', `/productions/${production.id}/clips`)).json() as { clips: Record<string, { f: string; s: number[][] }> };
    expect(clips['A: One.'].s).toEqual([[0, 1]]);
    expect(Object.keys(clips).sort()).toEqual(['A: Five.', 'A: One.', 'A: Three.', 'B: Four.', 'B: Two.']);
    const name = clips['A: One.'].f.split('/').pop()!;
    const served = await handle(new Request(`http://x/clips/${name}`), env);
    expect(served.status).toBe(200);
    expect(await served.text()).toBe('mp3:One.');
    expect((await handle(new Request('http://x/clips/../etc'), env)).status).toBe(404);
    // retry renders only the failed one
    setEngine(async (_v, say) => ({ audio: new TextEncoder().encode(say).buffer as ArrayBuffer, spans: [] }));
    await ann.call('POST', `/productions/${production.id}/render/${r0.id}/retry`);
    const r3 = (await (await ann.call('POST', `/productions/${production.id}/render/${r0.id}/next`)).json() as { render: { done: number; state: string } }).render;
    expect(r3).toMatchObject({ done: 6, state: 'done' });
    // a second render of the same script is done at once
    expect((await (await ann.call('POST', `/productions/${production.id}/render`)).json() as { render: { state: string } }).render.state).toBe('done');
  });
  it('is off without a key', async () => {
    (env as { ELEVEN_LABS_API_KEY?: string }).ELEVEN_LABS_API_KEY = undefined;
    const ann = await signIn('ann16@example.com');
    const { production } = await (await ann.call('POST', '/productions', { name: 'x' })).json() as { production: { id: string } };
    await ann.call('PUT', `/productions/${production.id}/script`, { title: 'x', text: 'A: Hi.' });
    expect((await ann.call('POST', `/productions/${production.id}/render`)).status).toBe(503);
  });
});
