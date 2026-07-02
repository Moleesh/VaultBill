/** @format */

// @vitest-environment node

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';

import { CredentialStore } from './CredentialStore.js';

let directory: string | undefined;
let store: CredentialStore | undefined;

const openStore = () => {
    directory = mkdtempSync(path.join(tmpdir(), 'vaultbill-credentials-'));
    const databasePath = path.join(directory, 'vaultbill.sqlite');
    store = new CredentialStore(databasePath, {
        encryptString: (value: string) => Buffer.from(`protected:${value}`, 'utf8'),
        decryptString: (value: Buffer) => value.toString('utf8').replace(/^protected:/u, ''),
    });
    return { databasePath, store };
};

afterEach(() => {
    store?.close();
    store = undefined;
    if (directory) rmSync(directory, { recursive: true, force: true });
    directory = undefined;
});

describe('CredentialStore', () => {
    it('bootstraps scrypt-protected SysAdmin and encrypted backup credentials', () => {
        const opened = openStore();

        expect(opened.store.authenticate('sysadmin_1', '147085aA')).toMatchObject({
            role: 'SysAdmin',
            usesDefaultPassword: true,
        });
        expect(() => opened.store.authenticate('sysadmin_1', 'wrong-password')).toThrow(
            'The password is incorrect.',
        );
        expect(opened.store.getBackupPassword()).toBe('147085aA');

        const database = new DatabaseSync(opened.databasePath);
        const user = database
            .prepare(
                "SELECT password_hash, password_salt FROM app_users WHERE user_id = 'sysadmin_1';",
            )
            .get();
        const backup = database
            .prepare(
                "SELECT encrypted_value FROM app_secure_settings WHERE setting_key = 'backup_password';",
            )
            .get();
        expect(Buffer.from(user?.password_hash as Uint8Array).toString('utf8')).not.toContain(
            '147085aA',
        );
        expect(Buffer.from(user?.password_salt as Uint8Array).length).toBeGreaterThan(0);
        expect(Buffer.from(backup?.encrypted_value as Uint8Array).toString('utf8')).toBe(
            'protected:147085aA',
        );
        database.close();
    });

    it('enforces account limits and supports password reset', () => {
        const opened = openStore();
        opened.store.saveAccount({
            userId: 'admin_1',
            username: 'admin',
            displayName: 'Operations Admin',
            role: 'Admin',
            isActive: true,
        });
        expect(() =>
            opened.store.saveAccount({
                userId: 'admin_2',
                username: 'admin-two',
                displayName: 'Another Admin',
                role: 'Admin',
                isActive: true,
            }),
        ).toThrow('VaultBill allows one active Admin.');

        opened.store.resetPassword('admin_1', 'changed-password');
        expect(opened.store.authenticate('admin_1', 'changed-password')).toMatchObject({
            passwordConfigured: true,
            usesDefaultPassword: false,
        });
    });

    it('can clear an existing account password', () => {
        const opened = openStore();
        opened.store.saveAccount({
            userId: 'admin_1',
            username: 'admin',
            displayName: 'Operations Admin',
            role: 'Admin',
            isActive: true,
        });
        opened.store.resetPassword('admin_1', 'changed-password');

        expect(opened.store.clearPassword('admin_1')).toMatchObject({
            passwordConfigured: false,
            usesDefaultPassword: false,
        });
        expect(opened.store.authenticate('admin_1', '', true)).toMatchObject({
            passwordConfigured: false,
        });
    });

    it('blocks passwordless accounts from remote hosted authentication', () => {
        const opened = openStore();
        opened.store.saveAccount({
            userId: 'user_1',
            username: 'operator',
            displayName: 'Operator',
            role: 'User',
            isActive: true,
        });

        expect(opened.store.authenticate('user_1', '', true)).toMatchObject({
            passwordConfigured: false,
        });
        expect(() => opened.store.authenticate('user_1', '', false)).toThrow(
            'Set a password on this account before using hosted web access.',
        );
    });
});
