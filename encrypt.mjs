// Encrypt script.js into script.enc.js so the public site never holds plain text.
// Usage: PASSWORD=... node encrypt.mjs
// index.html asks for the password and decrypts in the browser (PBKDF2 + AES-GCM).
import { readFileSync, writeFileSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';

const password = process.env.PASSWORD;
if (!password) throw new Error('Set PASSWORD');

globalThis.window = {};
await import('./script.js');
const plain = new TextEncoder().encode(window.SCRIPT);

const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
  base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));

const b64 = a => Buffer.from(a).toString('base64');
writeFileSync('script.enc.js', `window.SCRIPT_ENC = ${JSON.stringify({ salt: b64(salt), iv: b64(iv), data: b64(data) })};\n`);
console.log('wrote script.enc.js');
