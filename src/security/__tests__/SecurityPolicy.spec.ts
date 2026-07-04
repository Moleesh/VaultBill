/** @format */

import { describe, expect, it } from 'vitest';

import {
    canPermanentlyDelete,
    getUnencryptedBackupWarning,
    isAndroidReleaseAllowed,
    shouldEncryptBackupByDefault,
} from '../SecurityPolicy';

describe('release security policy', () => {
    it('enables backup encryption when a backup password is available', () => {
        expect(shouldEncryptBackupByDefault('backup-secret')).toBe(true);
        expect(shouldEncryptBackupByDefault('  ')).toBe(false);
        expect(getUnencryptedBackupWarning(false)).toContain('stored secrets');
    });

    it('requires SysAdmin password and typed DELETE for permanent deletion', () => {
        const authorized = canPermanentlyDelete({
            role: 'SysAdmin',
            configuredPassword: 'correct',
            suppliedPassword: 'correct',
            confirmation: 'DELETE',
        });
        expect(authorized).toBe(true);
        expect(
            canPermanentlyDelete({
                role: 'Admin',
                configuredPassword: 'correct',
                suppliedPassword: 'correct',
                confirmation: 'DELETE',
            }),
        ).toBe(false);
    });

    it('allows Android releases after the dedicated build gate exists', () => {
        expect(isAndroidReleaseAllowed()).toBe(true);
    });
});
