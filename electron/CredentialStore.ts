/**
 * eslint-disable max-lines
 *
 * @format
 */

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';

const defaultCredential = '147085aA';
const scryptKeyLength = 64;

const DesktopOperatorAccountSchema = z.object({
    userId: z.string().min(1),
    username: z.string().trim().min(1),
    displayName: z.string().trim().min(1),
    role: z.enum(['SysAdmin', 'Admin', 'User']),
    isActive: z.boolean(),
    passwordConfigured: z.boolean(),
    usesDefaultPassword: z.boolean(),
});

export type DesktopOperatorAccount = z.infer<typeof DesktopOperatorAccountSchema>;

export type SecureStringProtector = {
    readonly encryptString: (value: string) => Buffer;
    readonly decryptString: (value: Buffer) => string;
};

export type CredentialStatus = {
    readonly sysAdminUsesDefaultPassword: boolean;
    readonly backupUsesDefaultPassword: boolean;
};

type AccountRow = {
    readonly user_id: unknown;
    readonly username: unknown;
    readonly display_name: unknown;
    readonly role: unknown;
    readonly is_active: unknown;
    readonly password_hash: unknown;
    readonly uses_default_password: unknown;
};

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
        this.#bootstrap();
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
            .map((row) => this.#parseAccount(row as AccountRow));

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
        return this.#parseAccount(row);
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
            this.#validateLimits();
            this.#database.exec('COMMIT;');
            return this.#account(account.userId);
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
        if (password.length < 8) throw new Error('Passwords must contain at least 8 characters.');
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
        return this.#account(userId);
    };

    public getBackupPassword = (): string => {
        const row = this.#database
            .prepare(
                "SELECT encrypted_value FROM app_secure_settings WHERE setting_key = 'backup_password';",
            )
            .get();
        if (!row) throw new Error('The backup password is not configured.');
        return this.#protector.decryptString(toBuffer(row.encrypted_value));
    };

    public setBackupPassword = (password: string) => {
        if (password.length < 8)
            throw new Error('Backup passwords must contain at least 8 characters.');
        const encrypted = this.#protector.encryptString(password);
        this.#database
            .prepare(
                `INSERT INTO app_secure_settings (setting_key, encrypted_value, updated_at)
        VALUES ('backup_password', ?, ?)
        ON CONFLICT(setting_key) DO UPDATE SET
          encrypted_value = excluded.encrypted_value,
          updated_at = excluded.updated_at;`,
            )
            .run(encrypted, new Date().toISOString());
    };

    public getCredentialStatus = (): CredentialStatus => ({
        sysAdminUsesDefaultPassword:
            this.listAccounts().find((account) => account.userId === 'sysadmin_1')
                ?.usesDefaultPassword ?? true,
        backupUsesDefaultPassword: this.getBackupPassword() === defaultCredential,
    });

    public close = () => {
        this.#database.close();
    };

    #bootstrap = () => {
        const count = Number(
            this.#database.prepare('SELECT COUNT(*) AS count FROM app_users;').get()?.count ?? 0,
        );
        if (count === 0) {
            const now = new Date().toISOString();
            const salt = randomBytes(16);
            const hash = scryptSync(defaultCredential, salt, scryptKeyLength);
            this.#database
                .prepare(
                    `INSERT INTO app_users
            (user_id, username, display_name, role, password_salt, password_hash,
              uses_default_password, is_active, created_at, updated_at)
          VALUES ('sysadmin_1', 'sysadmin', 'System Administrator', 'SysAdmin',
            ?, ?, 1, 1, ?, ?);`,
                )
                .run(salt, hash, now, now);
        }
        const backup = this.#database
            .prepare(
                "SELECT setting_key FROM app_secure_settings WHERE setting_key = 'backup_password';",
            )
            .get();
        if (!backup) this.setBackupPassword(defaultCredential);
    };

    #account = (userId: string): DesktopOperatorAccount => {
        const row = this.#database
            .prepare(
                `SELECT user_id, username, display_name, role, is_active, password_hash,
          uses_default_password
        FROM app_users
        WHERE user_id = ? AND archived_at IS NULL;`,
            )
            .get(userId) as AccountRow | undefined;
        if (!row) throw new Error('The operator account was not found.');
        return this.#parseAccount(row);
    };

    #parseAccount = (row: AccountRow): DesktopOperatorAccount =>
        DesktopOperatorAccountSchema.parse({
            userId: String(row.user_id),
            username: String(row.username),
            displayName: String(row.display_name),
            role: row.role,
            isActive: Number(row.is_active) === 1,
            passwordConfigured: row.password_hash !== null && row.password_hash !== undefined,
            usesDefaultPassword: Number(row.uses_default_password) === 1,
        });

    #validateLimits = () => {
        const rows = this.#database
            .prepare(
                `SELECT role, COUNT(*) AS count
        FROM app_users
        WHERE is_active = 1 AND archived_at IS NULL
        GROUP BY role;`,
            )
            .all();
        const count = (role: string) =>
            Number(rows.find((row) => String(row.role) === role)?.count ?? 0);
        if (count('SysAdmin') !== 1) throw new Error('VaultBill requires one active SysAdmin.');
        if (count('Admin') > 1) throw new Error('VaultBill allows one active Admin.');
        if (count('User') > 5) throw new Error('VaultBill allows up to five active Users.');
    };
}

const toBuffer = (value: unknown): Buffer => {
    if (Buffer.isBuffer(value)) return value;
    if (value instanceof Uint8Array) return Buffer.from(value);
    throw new Error('Encrypted credential data is invalid.');
};
