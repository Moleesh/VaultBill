/** @format */

import { describe, expect, it } from 'vitest';

import { toBytes } from '../BackupEncoding';
import { createBackupPackage, restoreBackupPackage } from '../BackupEngine';

const fixedNow = new Date('2026-06-04T10:00:00.000Z');
const databaseBytes = toBytes('sqlite database bytes');

describe('BackupEngine', () => {
    it('creates and restores an unencrypted DB-only backup package', async () => {
        const backupPackage = await createBackupPackage({
            databaseBytes,
            now: fixedNow,
            encryptionEnabled: false,
        });

        expect(backupPackage.fileName).toBe('vaultbill-backup-2026-06-04-10-00.zip');
        expect(backupPackage.files['manifest.json']).toBeDefined();
        expect(backupPackage.files['checksums.json']).toBeDefined();
        expect(Array.from(await restoreBackupPackage({ backupPackage }))).toEqual(
            Array.from(databaseBytes),
        );
    });

    it('restores encrypted backups with password or recovery key', async () => {
        const backupPackage = await createBackupPackage({
            databaseBytes,
            now: fixedNow,
            password: 'backup-password',
            encryptionEnabled: true,
        });

        expect(backupPackage.files['database.sqlite']).toBeUndefined();
        expect(backupPackage.files['database.sqlite.enc']).toBeDefined();
        expect(
            Array.from(await restoreBackupPackage({ backupPackage, password: 'backup-password' })),
        ).toEqual(Array.from(databaseBytes));
        const { recoveryKey } = backupPackage;

        if (!recoveryKey) {
            throw new Error('Expected encrypted backup recovery key.');
        }

        expect(Array.from(await restoreBackupPackage({ backupPackage, recoveryKey }))).toEqual(
            Array.from(databaseBytes),
        );
    });

    it('rejects restore packages with missing or changed checksums', async () => {
        const backupPackage = await createBackupPackage({
            databaseBytes,
            now: fixedNow,
            encryptionEnabled: false,
        });
        const tamperedPackage = {
            ...backupPackage,
            files: {
                ...backupPackage.files,
                'database.sqlite': toBytes('changed'),
            },
        };

        await expect(restoreBackupPackage({ backupPackage: tamperedPackage })).rejects.toThrow(
            'Backup checksums do not match.',
        );
    });
});
