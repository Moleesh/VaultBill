/** @format */

import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';

import {
    ManifestSchema,
    buildChecksums,
    decryptDatabase,
    encryptDatabase,
    validateChecksums,
    validateDatabase,
} from '../BackupServiceSupport.js';

describe('backup service support', () => {
    const tempRoots: string[] = [];

    afterEach(() => {
        while (tempRoots.length > 0) {
            const tempRoot = tempRoots.pop();
            if (tempRoot) {
                rmSync(tempRoot, { recursive: true, force: true });
            }
        }
    });

    it('encrypts and decrypts backup payloads with the recovery key', () => {
        const payload = new TextEncoder().encode('vaultbill-backup');
        const encrypted = encryptDatabase(payload, 'backup-pass');

        expect(encrypted.recoveryKey).toBeTruthy();
        expect(
            Buffer.from(
                decryptDatabase(
                    encrypted.bytes,
                    encrypted.metadata,
                    undefined,
                    encrypted.recoveryKey,
                ),
            ),
        ).toEqual(Buffer.from(payload));
    });

    it('builds and validates backup checksums', () => {
        const files = {
            'database.sqlite': new TextEncoder().encode('db'),
            'manifest.json': new TextEncoder().encode('manifest'),
        };
        const checksums = buildChecksums(files);

        expect(() => {
            validateChecksums(files, checksums);
        }).not.toThrow();
        expect(() => {
            validateChecksums({ ...files, extra: new TextEncoder().encode('extra') }, checksums);
        }).toThrow('Backup checksum inventory does not match.');
    });

    it('validates the restored database shape', () => {
        const tempRoot = mkdtempSync(join(tmpdir(), 'vaultbill-backup-'));
        tempRoots.push(tempRoot);
        const databasePath = join(tempRoot, 'database.sqlite');
        const database = new DatabaseSync(databasePath);
        database.exec(`
            CREATE TABLE app_users (id INTEGER PRIMARY KEY);
            CREATE TABLE app_records (id INTEGER PRIMARY KEY);
        `);
        database.close();

        expect(() => {
            validateDatabase(databasePath);
        }).not.toThrow();
    });

    it('validates the manifest schema shape', () => {
        const manifest = ManifestSchema.parse({
            Product: 'VaultBill',
            CreatedAt: new Date().toISOString(),
            Encrypted: true,
            DatabaseFile: 'database.sqlite.enc',
            Encryption: {
                Algorithm: 'AES-GCM',
                PayloadIv: 'payload',
                RecoveryWrap: {
                    Salt: 'salt',
                    Iv: 'iv',
                    WrappedKey: 'wrapped',
                },
            },
        });

        expect(manifest.Product).toBe('VaultBill');
    });
});
