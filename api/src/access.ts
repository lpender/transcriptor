// THE ONE ROLE × CAPABILITY TABLE (docs/design/sharing.md). Every production
// route names the capability it needs and asks `can`; nothing tests a role
// name anywhere else. The web keeps a pinned copy.

export const ROLES = ['owner', 'director', 'cast', 'crew'] as const;
export type Role = (typeof ROLES)[number];

export type Capability =
  | 'read'      // the script, cues, sound
  | 'learn'     // learn lines, own notes, own stats
  | 'script'    // edit the script
  | 'cues'      // edit cues and sound
  | 'lead'      // lead in Together
  | 'render'    // render voices (spends money)
  | 'share'     // invite, change roles, remove members
  | 'billing'   // pay, delete the production
  | 'progress'; // see everyone's progress

const ALL: Capability[] = ['read', 'learn', 'script', 'cues', 'lead', 'render', 'share', 'billing', 'progress'];

export const CAPABILITIES: Readonly<Record<Role, ReadonlySet<Capability>>> = {
  owner: new Set(ALL),
  director: new Set(ALL.filter((c) => c !== 'billing')),
  cast: new Set(['read', 'learn']),
  crew: new Set(['read', 'cues', 'lead']),
};

export const can = (role: Role, capability: Capability): boolean => CAPABILITIES[role].has(capability);

export const isRole = (x: unknown): x is Role => typeof x === 'string' && (ROLES as readonly string[]).includes(x);

// Roles an invite may carry: never owner (ownership is transferred, not invited into).
export const INVITABLE: readonly Role[] = ['director', 'cast', 'crew'];
