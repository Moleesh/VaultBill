/** @format */

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

import {
    bootstrapCredentialStore,
    defaultCredential,
    DesktopOperatorAccountSchema,
    getBackupPassword,
    getCredentialStatus,
    loadCredentialAccount,
    parseCredentialAccount,
    scryptKeyLength,
    setBackupPassword,
    toBuffer,
    validateCredentialLimits,
    type AccountRow,
    type CredentialStatus,
    type DesktopOperatorAccount,
    type SecureStringProtector,
} from './CredentialStoreSupport.js';

export type { CredentialStatus, DesktopOperatorAccount } from './CredentialStoreSupport.js';

export class CredentialStore {
    readonly #database: DatabaseSync;
    readonly #protector: SecureStringProtector;

    public constructor(databasePath: string, protector: SecureStringProtector) {
        this.#database = new DatabaseSync(databasePath);
        this.#protector = protector;
        this.#database.exec(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS app_users (
        user_id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE COLLATE NOCASE,
        display_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('SysAdmin', 'Admin', 'User')),
        password_salt BLOB,
        password_hash BLOB,
        uses_default_password INTEGER NOT NULL DEFAULT 0 CHECK (uses_default_password IN (0, 1)),
        is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
        archived_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS app_secure_settings (
        setting_key TEXT PRIMARY KEY,
        encrypted_value BLOB NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
        bootstrapCredentialStore(this.#database, (password: string) => {
            setBackupPassword(this.#database, this.#protector, password);
        });
    }

    public listAccounts = (): readonly DesktopOperatorAccount[] =>
        this.#database
            .prepare(
                `SELECT user_id, username, display_name, role, is_active, password_hash,
          uses_default_password
        FROM app_users
        WHERE archived_at IS NULL
        ORDER BY CASE role WHEN 'SysAdmin' THEN 0 WHEN 'Admin' THEN 1 ELSE 2 END,
          display_name COLLATE NOCASE;`,
            )
            .all()
            .map((row) => parseCredentialAccount(row as AccountRow));

    public authenticate = (
        userId: string,
        password: string,
        allowPasswordless = true,
    ): DesktopOperatorAccount => {
        const row = this.#database
            .prepare(
                `SELECT user_id, username, display_name, role, is_active, password_salt,
          password_hash, uses_default_password
        FROM app_users
        WHERE user_id = ? AND archived_at IS NULL;`,
            )
            .get(userId) as (AccountRow & { password_salt?: unknown }) | undefined;
        if (!row || Number(row.is_active) !== 1) {
            throw new Error('The selected operator account is unavailable.');
        }
        if (row.password_hash !== null && row.password_hash !== undefined) {
            const salt = toBuffer(row.password_salt);
            const expected = toBuffer(row.password_hash);
            const supplied = scryptSync(password, salt, expected.length);
            if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
                throw new Error('The password is incorrect.');
            }
        } else if (!allowPasswordless) {
            throw new Error('Set a password on this account before using hosted web access.');
        }
        return parseCredentialAccount(row);
    };

    public configureSysAdmin = (displayName: string) => {
        this.#database
            .prepare(
                `UPDATE app_users
        SET display_name = ?, updated_at = ?
        WHERE user_id = 'sysadmin_1';`,
            )
            .run(displayName.trim() || 'System Administrator', new Date().toISOString());
    };

    public saveAccount = (rawAccount: unknown): DesktopOperatorAccount => {
        const account = DesktopOperatorAccountSchema.omit({
            passwordConfigured: true,
            usesDefaultPassword: true,
        }).parse(rawAccount);
        if (account.role === 'SysAdmin' && account.userId !== 'sysadmin_1') {
            throw new Error('VaultBill allows one protected System Administrator.');
        }
        const now = new Date().toISOString();
        this.#database.exec('BEGIN IMMEDIATE;');
        try {
            this.#database
                .prepare(
                    `INSERT INTO app_users
            (user_id, username, display_name, role, is_active, uses_default_password,
              created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 0, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET
            username = excluded.username,
            display_name = excluded.display_name,
            role = excluded.role,
            is_active = excluded.is_active,
            archived_at = NULL,
            updated_at = excluded.updated_at;`,
                )
                .run(
                    account.userId,
                    account.username,
                    account.displayName,
                    account.role,
                    account.isActive ? 1 : 0,
                    now,
                    now,
                );
            validateCredentialLimits(this.#database);
            this.#database.exec('COMMIT;');
            return loadCredentialAccount(this.#database, account.userId);
        } catch (error) {
            this.#database.exec('ROLLBACK;');
            throw error;
        }
    };

    public archiveAccount = (userId: string) => {
        if (userId === 'sysadmin_1') throw new Error('The System Administrator cannot be removed.');
        this.#database
            .prepare(
                'UPDATE app_users SET is_active = 0, archived_at = ?, updated_at = ? WHERE user_id = ?;',
            )
            .run(new Date().toISOString(), new Date().toISOString(), userId);
    };

    public resetPassword = (userId: string, password: string): DesktopOperatorAccount => {
        const salt = randomBytes(16);
        const hash = scryptSync(password, salt, scryptKeyLength);
        const result = this.#database
            .prepare(
                `UPDATE app_users
        SET password_salt = ?, password_hash = ?, uses_default_password = ?,
          updated_at = ?
        WHERE user_id = ? AND archived_at IS NULL;`,
            )
            .run(
                salt,
                hash,
                password === defaultCredential ? 1 : 0,
                new Date().toISOString(),
                userId,
            );
        if (result.changes !== 1) throw new Error('The operator account was not found.');
        return loadCredentialAccount(this.#database, userId);
    };

    public clearPassword = (userId: string): DesktopOperatorAccount => {
        const result = this.#database
            .prepare(
                `UPDATE app_users
        SET password_salt = NULL, password_hash = NULL, uses_default_password = 0,
          updated_at = ?
        WHERE user_id = ? AND archived_at IS NULL;`,
            )
            .run(new Date().toISOString(), userId);
        if (result.changes !== 1) throw new Error('The operator account was not found.');
        return loadCredentialAccount(this.#database, userId);
    };

    public getBackupPassword = (): string => getBackupPassword(this.#database, this.#protector);

    public setBackupPassword = (password: string) => {
        setBackupPassword(this.#database, this.#protector, password);
    };

    public getCredentialStatus = (): CredentialStatus => {
        return getCredentialStatus(this.#database, this.#protector);
    };

    public close = () => {
        this.#database.close();
    };
}
