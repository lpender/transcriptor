import { describe, expect, it } from 'vitest';
import { CAPABILITIES, INVITABLE, ROLES, can, isRole } from '../src/access';

describe('can', () => {
  it('matches the table in docs/design/sharing.md', () => {
    expect(can('owner', 'billing')).toBe(true);
    expect(can('director', 'billing')).toBe(false);
    expect(can('director', 'share')).toBe(true);
    expect(can('cast', 'learn')).toBe(true);
    expect(can('cast', 'cues')).toBe(false);
    expect(can('cast', 'share')).toBe(false);
    expect(can('crew', 'cues')).toBe(true);
    expect(can('crew', 'lead')).toBe(true);
    expect(can('crew', 'learn')).toBe(false);
    expect(can('crew', 'render')).toBe(false);
  });
  it('lets everyone read', () => {
    for (const r of ROLES) expect(can(r, 'read')).toBe(true);
  });
  it('gives the owner everything a director has', () => {
    for (const c of CAPABILITIES.director) expect(can('owner', c)).toBe(true);
  });
  it('never invites an owner', () => {
    expect(INVITABLE).not.toContain('owner');
    expect(isRole('owner')).toBe(true);
    expect(isRole('god')).toBe(false);
  });
});
