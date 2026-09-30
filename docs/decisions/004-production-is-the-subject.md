# 004 — The production is the shared subject; four roles; multi-use invites

- Date: 2026-09-30
- Status: Accepted (decided by the loop; Lee may overrule)

## Context

Sharing needs one subject to hang scripts, cues, voices, members and
billing on (PLATFORM §3). See `docs/design/sharing.md` for the round.

## Decision

`productions` is the subject. `members(user_id, production_id, role, parts)`
with role ∈ owner, director, cast, crew and one role × capability table.
Invite links are magic links with purpose `invite`, multi-use for 14 days,
role baked in, revocable. Notes are private unless flagged `shared`. A solo
user gets a silent production of one.

## Alternatives rejected

- Per-user scripts with share links — no home for cues, voices or billing.
- Company above production — a second noun nobody needs yet; can be added
  as a parent later without changing this.
- Capability checkboxes per member — flexible, unexplainable.
- Single-use invites — a cast invite is pasted into a group chat.

## Consequences

- Seat billing counts members; the owner sees the price before inviting.
- Every production route checks membership; removal is a row delete.
- "Production" jargon hidden until a second member exists.
