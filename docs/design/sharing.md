# Sharing model — production, members, invites (design round, 2026-09-30)

Follows PLATFORM.md §3. Round: diverge → skeptic → spec. Decided by the loop
under the "only money or human decisions are gated" rule; ADR 004 records
the schema.

## Understand

Who shares what, today, in a rehearsal room:

- The director has the script and wants everyone on the same cut.
- The stage manager owns cues and sound; actors must not change them.
- Each actor owns their progress, their notes, which parts are theirs.
- The company (or one producer) pays.
- People join late, leave, and understudy two parts.
- A solo actor is all of these at once and wants none of the ceremony.

## Diverge

1. **Per-user, share by link.** Every user owns scripts; a script has a
   share link. Simplest; but cues, voices and billing have no home, and a
   cast of eight has eight copies.
2. **Production as the subject** (PLATFORM §3). One production owns
   scripts, cues, sound, voices, members, billing. Users join by invite.
   Solo = production of one, created silently on first save.
3. **Company above production.** Company owns productions, billing at the
   company. True to the world, but a second noun before anyone has one
   production; can be added later as a parent of productions.
4. **Roles as a capability list per member** (checkboxes) rather than named
   roles. Flexible, unexplainable.

## Skeptic

- Option 2's risk: the solo actor hits "production" jargon. Mitigation: the
  word never appears until a second member exists; the UI says "your
  script" until you invite someone, then "the production".
- Roles: four named roles (owner, director, cast, crew) map to what people
  call themselves. Skeptic: does "director" differ from "owner" in any
  capability? Owner pays and can delete; director does everything else.
  Keep both: the producer paying is often not the director.
- Crew (stage manager) edits cues and sound but does not learn lines. Cast
  learns lines and cannot touch cues. Skeptic: an actor who also SMs? A
  member holds ONE role; give them director. Fine.
- Notes: private by default. Skeptic: the director wants to leave a note
  on an actor's line. That is a shared note, an explicit act ("share with
  the production"), shown with the author's name. Two kinds, one table,
  `shared` flag.
- Understudies: parts are per member, a set, already so (`myRoles`).
- Removal: membership row deleted; sessions remain; every production route
  checks membership; client drops cached script on next 403.
- Late join by invite link: the link is a magic link with purpose
  `invite`; single use? A cast invite is pasted into a group chat and used
  by twelve people. So invite links are multi-use with an expiry (14 days)
  and a role baked in, revocable by the owner. Login links stay single use.
- Script rights: private to the production; nothing public; no discovery.
  Copyright takedown is a policy line in TOS, not code.
- Billing per seat: seat count = members. An expired link does not count.
  Owner sees "8 members · $8/month" before inviting a ninth.

## Spec

Nouns: `users`, `productions`, `members(user_id, production_id, role,
parts)`, `invites(production_id, role, token_hash, expires_at,
revoked_at)`, `scripts(production_id, …)`, `notes(user_id, script_id,
line_hash, text, shared)`.

Roles → capabilities (one table, `can(role, cap)`, pinned copy in the web):

| capability | owner | director | cast | crew |
|---|---|---|---|---|
| read script | ✓ | ✓ | ✓ | ✓ |
| learn lines, own notes, own stats | ✓ | ✓ | ✓ | – |
| edit script | ✓ | ✓ | – | – |
| edit cues and sound | ✓ | ✓ | – | ✓ |
| lead (Together) | ✓ | ✓ | – | ✓ |
| render voices (spends money) | ✓ | ✓ | – | – |
| invite, change roles, remove | ✓ | ✓ | – | – |
| billing, delete production | ✓ | – | – | – |
| see everyone's progress | ✓ | ✓ | – | – |

Flows:

- First save with no account: magic-link signup; a production named after
  the script is created with the user as owner. The word "production" is
  not shown until a second member exists.
- Invite: owner/director picks a role, gets a link (14 days, multi-use,
  revocable). Opening it signed out: enter email, magic link, land in the
  production. Signed in: join at once. Already a member: no-op, land.
- Progress view for owner/director: per member, cleared/total and weak
  lines; never their notes.
- Leaving: any member may leave; the last owner cannot leave without
  naming another.

Out of scope now: company above production; per-scene scoping; public
scripts.

## Split into Queue items

- `db-schema-0001` — D1 migration for the nouns above + `can` table in
  code, unit-tested.
- `api-productions` — create, list, get, members, roles, remove, leave.
- `api-invites` — mint, revoke, accept (signed in and signed out).
- `web-production-panel` — More sheet: members, roles, invite link, seat
  count and price.
- `web-progress-view` — owner/director progress table.
