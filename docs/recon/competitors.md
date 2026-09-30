# Competitor recon — line-learning apps (2026-09-30)

Read from public pages only, no accounts made. Prices as shown that day.

| Product | Import | Voices | Hides / grades your lines | Multi-user | Cues / sound | Platform | Price |
|---|---|---|---|---|---|---|---|
| [Offbook](https://www.offbook.co/) | PDF, image | AI scene partner, cue timing synced to delivery | not stated | none, solo + self-tape | none | web app | pricing page loads client-side, not readable ([/pricing](https://www.offbook.co/pricing)) |
| [Go Offbook](https://www.gooffbook.com/) | PDF, paste; parses characters, cues, directions | distinct voice per character, record your timing once | hides ("cards off") | none, scenes private | none | browser | $14/month, $5/month for Web For Actors members; try without account, saving needs paid |
| [ActOnCue](https://actoncue.com/) | paste, type, transcribe audio, image | voice library by gender/age/accent, or from your recordings | hides, listens for your cue, voice-tracked scroll | not stated | none | web + iOS, Android coming | free to run lines; voices by subscription or one-time top-up, amounts not shown |
| [Cold Read](https://apps.apple.com/us/app/-/id6759092894) | record your own script | your recordings; on-device transcription, listens for last word | cue recognition | none | none | iPhone, iPad, M-series Mac, Vision Pro | free; $9.99/month, $79.99/year |
| transcriptor today | paste (PDF via `convert.py`) | ElevenLabs per character, emphasis via `stress.json` | hides in fixed blocks, grades per sentence piece, weak-sentence drill, best run per role | leader/follower over MQTT, per-role stats | scene music + room tone, held stops, loops, per-scene switches | web, PWA | free |

## What this says

- Import is solved by everyone (PDF, image, paste). Table stakes. MCP ingest is the only novel path.
- AI voices are table stakes. ActOnCue's "top-up" and Go Offbook's tiering show nobody has cracked voice cost either.
- Cue-listening (ActOnCue, Cold Read) is a feature we lack: speech recognition to advance on your last word. Worth a spike; the Web Speech API is free.
- Nobody has multi-user, cues, or sound. ADR 001 holds.
- Price band: $10 to $14 per month solo. $1 per seat is an order of magnitude under; a production of eight is $8 per month, still under one solo seat elsewhere.
