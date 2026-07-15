/** @format */

import { describe, expect, it } from 'vitest';

import { canUseLocalApiAction } from '../LocalApiSecurity.js';

describe('LocalApiSecurity', () => {
    it('allows SysAdmin to use records and reports data operations', () => {
        expect(canUseLocalApiAction('SysAdmin', 'list')).toBe(true);
        expect(canUseLocalApiAction('SysAdmin', 'saveDraft')).toBe(true);
        expect(canUseLocalApiAction('SysAdmin', 'finalize')).toBe(true);
        expect(canUseLocalApiAction('SysAdmin', 'cancel')).toBe(true);
    });

    it('keeps user-only restrictions for administrative operations', () => {
        expect(canUseLocalApiAction('User', 'configureLan')).toBe(false);
        expect(canUseLocalApiAction('User', 'cancel')).toBe(false);
        expect(canUseLocalApiAction('Admin', 'configureLan')).toBe(true);
        expect(canUseLocalApiAction('SysAdmin', 'configureLan')).toBe(true);
    });
});
