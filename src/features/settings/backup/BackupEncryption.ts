/** @format */

import { asBufferSource, decodeBase64, encodeBase64, toBytes } from './BackupEncoding';
import type { BackupEncryptionMetadata, WrappedBackupKey } from './BackupTypes';

export type EncryptedDatabase = {
    readonly encryptedBytes: Uint8Array;
    readonly metadata: BackupEncryptionMetadata;
    readonly recoveryKey: string;
};

export const encryptDatabaseBytes = async (
    databaseBytes: Uint8Array,
    password: string | undefined,
): Promise<EncryptedDatabase> => {
    const dataKeyBytes = crypto.getRandomValues(new Uint8Array(32));
    const dataKey = await importAesKey(dataKeyBytes);
    const payloadIv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedBytes = new Uint8Array(
        await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: asBufferSource(payloadIv) },
            dataKey,
            asBufferSource(databaseBytes),
        ),
    );
    const recoveryKey = encodeBase64(crypto.getRandomValues(new Uint8Array(32)));

    return {
        encryptedBytes,
        recoveryKey,
        metadata: {
            Algorithm: 'AES-GCM',
            PayloadIv: encodeBase64(payloadIv),
            ...(password ? { PasswordWrap: await wrapDataKey(dataKeyBytes, password) } : {}),
            RecoveryWrap: await wrapDataKey(dataKeyBytes, recoveryKey),
        },
    };
};

export const decryptDatabaseBytes = async (
    encryptedBytes: Uint8Array,
    metadata: BackupEncryptionMetadata,
    password: string | undefined,
    recoveryKey: string | undefined,
): Promise<Uint8Array> => {
    const wrappedKey = password ? metadata.PasswordWrap : metadata.RecoveryWrap;
    const secret = password ?? recoveryKey;

    if (!wrappedKey || !secret) {
        throw new Error('Backup password or recovery key is required.');
    }

    const dataKeyBytes = await unwrapDataKey(wrappedKey, secret);
    const dataKey = await importAesKey(dataKeyBytes);

    return new Uint8Array(
        await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: asBufferSource(decodeBase64(metadata.PayloadIv)),
            },
            dataKey,
            asBufferSource(encryptedBytes),
        ),
    );
};

const wrapDataKey = async (dataKeyBytes: Uint8Array, secret: string): Promise<WrappedBackupKey> => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const wrappingKey = await deriveWrappingKey(secret, salt);
    const wrappedKey = new Uint8Array(
        await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: asBufferSource(iv) },
            wrappingKey,
            asBufferSource(dataKeyBytes),
        ),
    );

    return {
        Salt: encodeBase64(salt),
        Iv: encodeBase64(iv),
        WrappedKey: encodeBase64(wrappedKey),
    };
};

const unwrapDataKey = async (wrappedKey: WrappedBackupKey, secret: string): Promise<Uint8Array> => {
    const wrappingKey = await deriveWrappingKey(secret, decodeBase64(wrappedKey.Salt));

    return new Uint8Array(
        await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: asBufferSource(decodeBase64(wrappedKey.Iv)) },
            wrappingKey,
            asBufferSource(decodeBase64(wrappedKey.WrappedKey)),
        ),
    );
};

const deriveWrappingKey = async (secret: string, salt: Uint8Array): Promise<CryptoKey> => {
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        asBufferSource(toBytes(secret)),
        'PBKDF2',
        false,
        ['deriveKey'],
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: asBufferSource(salt),
            iterations: 120_000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt'],
    );
};

const importAesKey = (keyBytes: Uint8Array): Promise<CryptoKey> =>
    crypto.subtle.importKey('raw', asBufferSource(keyBytes), 'AES-GCM', false, [
        'encrypt',
        'decrypt',
    ]);
