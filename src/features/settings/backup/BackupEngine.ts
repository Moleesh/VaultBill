/** @format */

import { z } from 'zod';

import { buildBackupChecksums } from './BackupChecksums';
import { fromBytes, toBytes } from './BackupEncoding';
import { decryptDatabaseBytes, encryptDatabaseBytes } from './BackupEncryption';
import type {
    BackupCreateInput,
    BackupManifest,
    BackupPackage,
    RestoreBackupInput,
} from './BackupTypes';

const BackupManifestSchema = z.object({
    Product: z.literal('VaultBill'),
    CreatedAt: z.string().datetime(),
    Encrypted: z.boolean(),
    DatabaseFile: z.enum(['database.sqlite', 'database.sqlite.enc']),
    Encryption: z
        .object({
            Algorithm: z.literal('AES-GCM'),
            PayloadIv: z.string(),
            PasswordWrap: z
                .object({ Salt: z.string(), Iv: z.string(), WrappedKey: z.string() })
                .optional(),
            RecoveryWrap: z.object({
                Salt: z.string(),
                Iv: z.string(),
                WrappedKey: z.string(),
            }),
        })
        .optional(),
});

export const createBackupPackage = async (input: BackupCreateInput): Promise<BackupPackage> => {
    const encrypted = input.encryptionEnabled
        ? await encryptDatabaseBytes(input.databaseBytes, input.password)
        : undefined;
    const manifest: BackupManifest = {
        Product: 'VaultBill',
        CreatedAt: input.now.toISOString(),
        Encrypted: Boolean(encrypted),
        DatabaseFile: encrypted ? 'database.sqlite.enc' : 'database.sqlite',
        ...(encrypted ? { Encryption: encrypted.metadata } : {}),
    };
    const files = {
        'manifest.json': toBytes(JSON.stringify(manifest)),
        'database.sqlite': encrypted ? undefined : input.databaseBytes,
        'database.sqlite.enc': encrypted?.encryptedBytes,
        'checksums.json': undefined,
    };
    const checksums = await buildBackupChecksums(files);

    return {
        fileName: `vaultbill-backup-${formatBackupTimestamp(input.now)}.zip`,
        files: { ...files, 'checksums.json': toBytes(JSON.stringify(checksums)) },
        ...(encrypted ? { recoveryKey: encrypted.recoveryKey } : {}),
    };
};

export const restoreBackupPackage = async (input: RestoreBackupInput): Promise<Uint8Array> => {
    const manifest = parseManifest(input.backupPackage);
    await validateChecksums(input.backupPackage);

    if (!manifest.Encrypted) {
        const database = input.backupPackage.files['database.sqlite'];

        if (!database) {
            throw new Error('Backup database.sqlite is missing.');
        }

        return database;
    }

    const encryptedDatabase = input.backupPackage.files['database.sqlite.enc'];

    if (!encryptedDatabase || !manifest.Encryption) {
        throw new Error('Encrypted backup payload is missing.');
    }

    return decryptDatabaseBytes(
        encryptedDatabase,
        manifest.Encryption,
        input.password,
        input.recoveryKey,
    );
};

const parseManifest = (backupPackage: BackupPackage): BackupManifest => {
    const manifestBytes = backupPackage.files['manifest.json'];

    if (!manifestBytes) {
        throw new Error('Backup manifest.json is missing.');
    }

    const parsed = BackupManifestSchema.parse(JSON.parse(fromBytes(manifestBytes)));
    const baseManifest: BackupManifest = {
        Product: parsed.Product,
        CreatedAt: parsed.CreatedAt,
        Encrypted: parsed.Encrypted,
        DatabaseFile: parsed.DatabaseFile,
    };

    if (!parsed.Encryption) {
        return baseManifest;
    }

    const { Algorithm, PasswordWrap, PayloadIv, RecoveryWrap } = parsed.Encryption;
    return {
        ...baseManifest,
        Encryption: {
            Algorithm,
            PayloadIv,
            RecoveryWrap,
            ...(PasswordWrap ? { PasswordWrap } : {}),
        },
    };
};

const validateChecksums = async (backupPackage: BackupPackage) => {
    const checksumBytes = backupPackage.files['checksums.json'];

    if (!checksumBytes) {
        throw new Error('Backup checksums.json is missing.');
    }

    const expected = JSON.parse(fromBytes(checksumBytes)) as Record<string, string>;
    const actual = await buildBackupChecksums(backupPackage.files);

    if (JSON.stringify(expected) !== JSON.stringify(actual)) {
        throw new Error('Backup checksums do not match.');
    }
};

const formatBackupTimestamp = (date: Date): string =>
    date.toISOString().slice(0, 16).replace('T', '-').replaceAll(':', '-');
