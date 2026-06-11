/** @format */

import type { Role } from '../types/AppTypes';

export const shouldEncryptBackupByDefault = (backupPassword: string | undefined): boolean =>
    Boolean(backupPassword?.trim());

export const getUnencryptedBackupWarning = (encryptionEnabled: boolean): string =>
    encryptionEnabled
        ? ''
        : 'This backup may contain business data and stored secrets. Encrypt it before sharing.';

export const canPermanentlyDelete = (input: {
    readonly role: Role;
    readonly configuredPassword: string;
    readonly suppliedPassword: string;
    readonly confirmation: string;
}): boolean =>
    input.role === 'SysAdmin' &&
    Boolean(input.configuredPassword) &&
    input.suppliedPassword === input.configuredPassword &&
    input.confirmation === 'DELETE';

export const isAndroidReleaseAllowed = (): boolean => false;
