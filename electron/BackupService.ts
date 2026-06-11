/**
 * eslint-disable max-lines
 *
 * @format
 */

/** Backup service that packages, encrypts, validates, and restores application state. */

import { createCipheriv, createDecipheriv, createHash, pbkdf2Sync, randomBytes } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import {
    copyFileSync,
    existsSync,
    mkdirSync,
    readFileSync,
    renameSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { z } from 'zod';

const ManifestSchema = z.object({
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

type WrappedKey = {
    readonly Salt: string;
    readonly Iv: string;
    readonly WrappedKey: string;
};

export type BackupCreationResult = {
    readonly cancelled: boolean;
    readonly filePath?: string;
    readonly recoveryKey?: string;
};

export type PreparedRestore = {
    readonly cancelled: boolean;
    readonly databasePath?: string;
};

export type BackupDialogAdapter = {
    readonly chooseBackupDestination: (defaultFileName: string) => Promise<string | undefined>;
    readonly chooseRestoreSource: () => Promise<string | undefined>;
};

export type BackupArchive = {
    readonly bytes: Uint8Array;
    readonly recoveryKey?: string;
};

export class BackupService {
    public constructor(
        private readonly databasePath: string,
        private readonly dialogs: BackupDialogAdapter,
    ) {}

    public create = async (
        encryptionEnabled: boolean,
        password?: string,
    ): Promise<BackupCreationResult> => {
        const timestamp = new Date()
            .toISOString()
            .slice(0, 16)
            .replace('T', '-')
            .replaceAll(':', '-');
        const filePath = await this.dialogs.chooseBackupDestination(
            `vaultbill-backup-${timestamp}.zip`,
        );
        if (!filePath) return { cancelled: true };
        const archive = this.createArchive(encryptionEnabled, password);
        writeFileSync(filePath, archive.bytes);
        return {
            cancelled: false,
            filePath,
            ...(archive.recoveryKey ? { recoveryKey: archive.recoveryKey } : {}),
        };
    };

    public createArchive = (encryptionEnabled: boolean, password?: string): BackupArchive => {
        const snapshotPath = this.#snapshotPath('create');
        this.#createSnapshot(snapshotPath);
        try {
            const databaseBytes = new Uint8Array(readFileSync(snapshotPath));
            const encrypted = encryptionEnabled
                ? encryptDatabase(databaseBytes, password)
                : undefined;
            const manifest = {
                Product: 'VaultBill',
                CreatedAt: new Date().toISOString(),
                Encrypted: Boolean(encrypted),
                DatabaseFile: encrypted ? 'database.sqlite.enc' : 'database.sqlite',
                ...(encrypted ? { Encryption: encrypted.metadata } : {}),
            };
            const databaseFile = manifest.DatabaseFile;
            const files: Record<string, Uint8Array> = {
                'manifest.json': strToU8(JSON.stringify(manifest)),
                [databaseFile]: encrypted?.bytes ?? databaseBytes,
            };
            files['checksums.json'] = strToU8(JSON.stringify(buildChecksums(files)));
            return {
                bytes: zipSync(files, { level: 6 }),
                ...(encrypted ? { recoveryKey: encrypted.recoveryKey } : {}),
            };
        } finally {
            rmSync(snapshotPath, { force: true });
        }
    };

    public prepareRestore = async (
        password?: string,
        recoveryKey?: string,
    ): Promise<PreparedRestore> => {
        const selectedPath = await this.dialogs.chooseRestoreSource();
        if (!selectedPath) return { cancelled: true };
        return {
            cancelled: false,
            databasePath: this.prepareRestoreArchive(
                new Uint8Array(readFileSync(selectedPath)),
                password,
                recoveryKey,
            ),
        };
    };

    public prepareRestoreArchive = (
        archiveBytes: Uint8Array,
        password?: string,
        recoveryKey?: string,
    ): string => {
        const files = unzipSync(archiveBytes);
        const manifestBytes = files['manifest.json'];
        const checksumBytes = files['checksums.json'];
        if (!manifestBytes || !checksumBytes) throw new Error('Backup metadata is incomplete.');
        const manifest = ManifestSchema.parse(JSON.parse(strFromU8(manifestBytes)));
        validateChecksums(files, JSON.parse(strFromU8(checksumBytes)) as Record<string, string>);
        const payload = files[manifest.DatabaseFile];
        if (!payload) throw new Error(`Backup ${manifest.DatabaseFile} is missing.`);
        if (manifest.Encrypted && !manifest.Encryption) {
            throw new Error('Encrypted backup metadata is missing.');
        }
        const databaseBytes =
            manifest.Encrypted && manifest.Encryption
                ? decryptDatabase(payload, manifest.Encryption, password, recoveryKey)
                : payload;
        const restorePath = this.#snapshotPath('restore');
        writeFileSync(restorePath, databaseBytes);
        try {
            validateDatabase(restorePath);
            return restorePath;
        } catch (error) {
            rmSync(restorePath, { force: true });
            throw error;
        }
    };

    public replaceDatabase = (preparedDatabasePath: string) => {
        const previousPath = `${this.databasePath}.before-restore`;
        const replacementPath = `${this.databasePath}.restore-${randomBytes(8).toString('hex')}`;
        rmSync(previousPath, { force: true });
        copyFileSync(preparedDatabasePath, replacementPath);
        try {
            if (existsSync(this.databasePath)) copyFileSync(this.databasePath, previousPath);
            this.#removeDatabaseFiles();
            renameSync(replacementPath, this.databasePath);
            rmSync(preparedDatabasePath, { force: true });
        } catch (error) {
            rmSync(replacementPath, { force: true });
            if (!existsSync(this.databasePath) && existsSync(previousPath)) {
                copyFileSync(previousPath, this.databasePath);
            }
            throw error;
        }
    };

    public resetDatabase = () => {
        this.#removeDatabaseFiles();
        rmSync(`${this.databasePath}.before-restore`, { force: true });
    };

    #createSnapshot = (snapshotPath: string) => {
        rmSync(snapshotPath, { force: true });
        const database = new DatabaseSync(this.databasePath);
        try {
            database.exec(`VACUUM INTO '${snapshotPath.replaceAll("'", "''")}';`);
        } finally {
            database.close();
        }
    };

    #snapshotPath = (purpose: string): string => {
        const directory = path.join(tmpdir(), 'vaultbill-backups');
        mkdirSync(directory, { recursive: true });
        return path.join(directory, `${purpose}-${randomBytes(12).toString('hex')}.sqlite`);
    };

    #removeDatabaseFiles = () => {
        rmSync(this.databasePath, { force: true });
        rmSync(`${this.databasePath}-wal`, { force: true });
        rmSync(`${this.databasePath}-shm`, { force: true });
    };
}

const encryptDatabase = (databaseBytes: Uint8Array, password?: string) => {
    const dataKey = randomBytes(32);
    const payloadIv = randomBytes(12);
    const recoveryKey = randomBytes(32).toString('base64');
    return {
        bytes: encryptBytes(databaseBytes, dataKey, payloadIv),
        recoveryKey,
        metadata: {
            Algorithm: 'AES-GCM' as const,
            PayloadIv: payloadIv.toString('base64'),
            ...(password ? { PasswordWrap: wrapKey(dataKey, password) } : {}),
            RecoveryWrap: wrapKey(dataKey, recoveryKey),
        },
    };
};

const decryptDatabase = (
    encryptedBytes: Uint8Array,
    metadata: z.infer<typeof ManifestSchema>['Encryption'] & {},
    password?: string,
    recoveryKey?: string,
): Uint8Array => {
    const wrapped = password ? metadata.PasswordWrap : metadata.RecoveryWrap;
    const secret = password ?? recoveryKey;
    if (!wrapped || !secret) throw new Error('Backup password or recovery key is required.');
    const dataKey = unwrapKey(wrapped, secret);
    return decryptBytes(encryptedBytes, dataKey, Buffer.from(metadata.PayloadIv, 'base64'));
};

const wrapKey = (dataKey: Buffer, secret: string): WrappedKey => {
    const salt = randomBytes(16);
    const iv = randomBytes(12);
    const wrappingKey = pbkdf2Sync(secret, salt, 120_000, 32, 'sha256');
    return {
        Salt: salt.toString('base64'),
        Iv: iv.toString('base64'),
        WrappedKey: Buffer.from(encryptBytes(dataKey, wrappingKey, iv)).toString('base64'),
    };
};

const unwrapKey = (wrapped: WrappedKey, secret: string): Buffer => {
    const salt = Buffer.from(wrapped.Salt, 'base64');
    const wrappingKey = pbkdf2Sync(secret, salt, 120_000, 32, 'sha256');
    return Buffer.from(
        decryptBytes(
            Buffer.from(wrapped.WrappedKey, 'base64'),
            wrappingKey,
            Buffer.from(wrapped.Iv, 'base64'),
        ),
    );
};

const encryptBytes = (bytes: Uint8Array, key: Buffer, iv: Buffer): Uint8Array => {
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    return new Uint8Array(
        Buffer.concat([cipher.update(bytes), cipher.final(), cipher.getAuthTag()]),
    );
};

const decryptBytes = (bytes: Uint8Array, key: Buffer, iv: Buffer): Uint8Array => {
    const payload = Buffer.from(bytes);
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(payload.subarray(payload.length - 16));
    return new Uint8Array(
        Buffer.concat([
            decipher.update(payload.subarray(0, payload.length - 16)),
            decipher.final(),
        ]),
    );
};

const buildChecksums = (files: Readonly<Record<string, Uint8Array>>): Record<string, string> =>
    Object.fromEntries(
        Object.entries(files).map(([name, bytes]) => [
            name,
            createHash('sha256').update(bytes).digest('hex'),
        ]),
    );

const validateChecksums = (
    files: Readonly<Record<string, Uint8Array>>,
    expected: Readonly<Record<string, string>>,
) => {
    const actual = buildChecksums(
        Object.fromEntries(Object.entries(files).filter(([name]) => name !== 'checksums.json')),
    );
    const expectedNames = Object.keys(expected).sort();
    const actualNames = Object.keys(actual).sort();
    if (JSON.stringify(expectedNames) !== JSON.stringify(actualNames)) {
        throw new Error('Backup checksum inventory does not match.');
    }
    for (const [name, checksum] of Object.entries(expected)) {
        if (actual[name] !== checksum) {
            throw new Error(`Backup checksum failed for ${name}.`);
        }
    }
};

const validateDatabase = (databasePath: string) => {
    const database = new DatabaseSync(databasePath, { readOnly: true });
    try {
        const integrity = database.prepare('PRAGMA integrity_check;').get();
        if (String(integrity?.integrity_check) !== 'ok') {
            throw new Error('The restored SQLite database failed its integrity check.');
        }
        const tables = database
            .prepare(
                "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('app_users', 'app_records');",
            )
            .all();
        if (tables.length < 2) throw new Error('The backup is not a complete VaultBill database.');
    } finally {
        database.close();
    }
};
