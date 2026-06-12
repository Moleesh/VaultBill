/** @format */

import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';

import {
    DesktopOperatorAccountSchema,
    bootstrapCredentialStore,
    defaultCredential,
    getBackupPassword,
    getCredentialStatus,
    loadCredentialAccount,
    parseCredentialAccount,
    setBackupPassword,
    validateCredentialLimits,
} from './CredentialStoreSupport.js';

const createDatabase = () => {
    const database = new DatabaseSync(':memory:');
    database.exec(`
        CREATE TABLE app_users (
            user_id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            display_name TEXT NOT NULL,
            role TEXT NOT NULL,
            password_salt BLOB,
            password_hash BLOB,
            uses_default_password INTEGER NOT NULL DEFAULT 1,
            is_active INTEGER NOT NULL DEFAULT 1,
            archived_at TEXT,
            created_at TEXT,
            updated_at TEXT
        );
        CREATE TABLE app_secure_settings (
            setting_key TEXT PRIMARY KEY,
            encrypted_value BLOB,
            updated_at TEXT
        );
    `);
    return database;
};

const protector = {
    encryptString: (value: string) => Buffer.from(value, 'utf8'),
    decryptString: (value: Buffer) => value.toString('utf8'),
};

describe('credential store support', () => {
    it('bootstraps the default SysAdmin and backup password', () => {
        const database = createDatabase();

        bootstrapCredentialStore(database, (password) => {
            setBackupPassword(database, protector, password);
        });

        const sysAdmin = database
            .prepare(
                'SELECT user_id, username, display_name, role, is_active, password_hash, uses_default_password FROM app_users;',
            )
            .get() as Parameters<typeof parseCredentialAccount>[0];
        const parsed = DesktopOperatorAccountSchema.parse(parseCredentialAccount(sysAdmin));

        expect(parsed.userId).toBe('sysadmin_1');
        expect(getBackupPassword(database, protector)).toBe(defaultCredential);
    });

    it('loads validated accounts and enforces account limits', () => {
        const database = createDatabase();
        database
            .prepare(
                `INSERT INTO app_users
                 (user_id, username, display_name, role, password_hash, uses_default_password, is_active, archived_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            )
            .run(
                'sysadmin_1',
                'sysadmin',
                'System Administrator',
                'SysAdmin',
                Buffer.from('hash'),
                0,
                1,
                null,
            );
        database
            .prepare(
                `INSERT INTO app_users
                 (user_id, username, display_name, role, password_hash, uses_default_password, is_active, archived_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            )
            .run('admin_1', 'admin', 'Operations Admin', 'Admin', Buffer.from('hash'), 0, 1, null);
        setBackupPassword(database, protector, defaultCredential);

        expect(loadCredentialAccount(database, 'admin_1').displayName).toBe('Operations Admin');
        expect(() => validateCredentialLimits(database)).not.toThrow();
        expect(getCredentialStatus(database, protector).sysAdminUsesDefaultPassword).toBe(false);
    });

    it('accepts only the supported account schema shape', () => {
        expect(
            DesktopOperatorAccountSchema.parse({
                userId: 'sysadmin_1',
                username: 'sysadmin',
                displayName: 'System Administrator',
                role: 'SysAdmin',
                isActive: true,
                passwordConfigured: false,
                usesDefaultPassword: true,
            }).role,
        ).toBe('SysAdmin');
    });
});
