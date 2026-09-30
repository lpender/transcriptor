// The pool's `env` is typed as Cloudflare.Env, which is empty here; this is
// the one place the cast lives.
import type { D1Migration } from '@cloudflare/vitest-pool-workers';
import { env as raw } from 'cloudflare:test';
import type { Env } from '../src/router';

export const env = raw as unknown as Env & { TEST_MIGRATIONS: D1Migration[] };
