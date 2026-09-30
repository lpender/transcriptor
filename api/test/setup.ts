import { applyD1Migrations } from 'cloudflare:test';
import { env } from './env';

await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
