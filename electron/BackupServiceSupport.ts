/** @format */

import { createCipheriv, createDecipheriv, createHash, pbkdf2Sync, randomBytes } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';

/**
 * Describes the backup manifest that pairs VaultBill payloads with encryption
 * metadata and file identity.
 */
export const ManifestSchema = z.object({
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

/** Represents a wrapped data key serialized into the backup manifest. */
export type WrappedKey = {
    readonly Salt: string;
    readonly Iv: string;
    readonly WrappedKey: string;
};

/**
 * Encrypts the database payload and returns the bytes, the recovery key, and
 * the metadata required to unwrap the archive later.
 */
export const encryptDatabase = (databaseBytes: Uint8Array, password?: string) => {
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

/** Decrypts a backup payload with either the backup password or recovery key. */
export const decryptDatabase = (
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

/** Wraps the random data key with the secret that protects the archive. */
export const wrapKey = (dataKey: Buffer, secret: string): WrappedKey => {
    const salt = randomBytes(16);
    const iv = randomBytes(12);
    const wrappingKey = pbkdf2Sync(secret, salt, 120_000, 32, 'sha256');
    return {
        Salt: salt.toString('base64'),
        Iv: iv.toString('base64'),
        WrappedKey: Buffer.from(encryptBytes(dataKey, wrappingKey, iv)).toString('base64'),
    };
};

/** Unwraps the archive data key with the provided secret. */
export const unwrapKey = (wrapped: WrappedKey, secret: string): Buffer => {
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

/** Encrypts arbitrary bytes with AES-GCM. */
export const encryptBytes = (bytes: Uint8Array, key: Buffer, iv: Buffer): Uint8Array => {
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    return new Uint8Array(
        Buffer.concat([cipher.update(bytes), cipher.final(), cipher.getAuthTag()]),
    );
};

/** Decrypts AES-GCM bytes and removes the authentication tag. */
export const decryptBytes = (bytes: Uint8Array, key: Buffer, iv: Buffer): Uint8Array => {
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

/** Builds SHA-256 checksums for the supplied backup file set. */
export const buildChecksums = (
    files: Readonly<Record<string, Uint8Array>>,
): Record<string, string> =>
    Object.fromEntries(
        Object.entries(files).map(([name, bytes]) => [
            name,
            createHash('sha256').update(bytes).digest('hex'),
        ]),
    );

/** Verifies that backup files match the expected checksum manifest. */
export const validateChecksums = (
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

/** Opens a restored SQLite database and verifies its integrity and core tables. */
export const validateDatabase = (databasePath: string) => {
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
