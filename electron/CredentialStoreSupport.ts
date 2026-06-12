/** @format */

import { randomBytes, scryptSync } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';

/** Default credential used until the SysAdmin or backup password is changed. */
export const defaultCredential = '147085aA';
/** Length used when deriving login hashes through scrypt. */
export const scryptKeyLength = 64;

/** Describes the operator account data exposed by the credential store. */
export const DesktopOperatorAccountSchema = z.object({
    userId: z.string().min(1),
    username: z.string().trim().min(1),
    displayName: z.string().trim().min(1),
    role: z.enum(['SysAdmin', 'Admin', 'User']),
    isActive: z.boolean(),
    passwordConfigured: z.boolean(),
    usesDefaultPassword: z.boolean(),
});

/** Public account record returned by the credential store. */
export type DesktopOperatorAccount = z.infer<typeof DesktopOperatorAccountSchema>;

/** Encrypts and decrypts secrets with the local secure-storage wrapper. */
export type SecureStringProtector = {
    readonly encryptString: (value: string) => Buffer;
    readonly decryptString: (value: Buffer) => string;
};

/** Summarizes which built-in credentials are still using their default value. */
export type CredentialStatus = {
    readonly sysAdminUsesDefaultPassword: boolean;
    readonly backupUsesDefaultPassword: boolean;
};

/** Raw account row fetched from SQLite. */
export type AccountRow = {
    readonly user_id: unknown;
    readonly username: unknown;
    readonly display_name: unknown;
    readonly role: unknown;
    readonly is_active: unknown;
    readonly password_hash: unknown;
    readonly uses_default_password: unknown;
};

/** Normalizes SQLite blob data into a Buffer. */
export const toBuffer = (value: unknown): Buffer => {
    if (Buffer.isBuffer(value)) return value;
    if (ArrayBuffer.isView(value))
        return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
    if (value instanceof Uint8Array) return Buffer.from(value);
    if (value instanceof ArrayBuffer) return Buffer.from(value);
    if (typeof value === 'string') return Buffer.from(value);
    throw new Error('Encrypted credential data is invalid.');
};

/** Seeds the credential tables when a fresh desktop database starts up. */
export const bootstrapCredentialStore = (
    database: DatabaseSync,
    setBackupPassword: (password: string) => void,
) => {
    const count = Number(
        database.prepare('SELECT COUNT(*) AS count FROM app_users;').get()?.count ?? 0,
    );
    if (count === 0) {
        const now = new Date().toISOString();
        const salt = randomBytes(16);
        const hash = scryptSync(defaultCredential, salt, scryptKeyLength);
        database
            .prepare(
                `INSERT INTO app_users
            (user_id, username, display_name, role, password_salt, password_hash,
              uses_default_password, is_active, created_at, updated_at)
          VALUES ('sysadmin_1', 'sysadmin', 'System Administrator', 'SysAdmin',
            ?, ?, 1, 1, ?, ?);`,
            )
            .run(salt, hash, now, now);
    }
    const backup = database
        .prepare(
            "SELECT setting_key FROM app_secure_settings WHERE setting_key = 'backup_password';",
        )
        .get();
    if (!backup) setBackupPassword(defaultCredential);
};

/** Converts a raw database row into the validated account shape. */
export const parseCredentialAccount = (row: AccountRow): DesktopOperatorAccount =>
    DesktopOperatorAccountSchema.parse({
        userId: String(row.user_id),
        username: String(row.username),
        displayName: String(row.display_name),
        role: row.role,
        isActive: Number(row.is_active) === 1,
        passwordConfigured: row.password_hash !== null && row.password_hash !== undefined,
        usesDefaultPassword: Number(row.uses_default_password) === 1,
    });

/** Enforces the SysAdmin/Admin/User account limits for active records. */
export const validateCredentialLimits = (database: DatabaseSync) => {
    const rows = database
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

/** Loads one active operator account by id. */
export const loadCredentialAccount = (
    database: DatabaseSync,
    userId: string,
): DesktopOperatorAccount => {
    const row = database
        .prepare(
            `SELECT user_id, username, display_name, role, is_active, password_hash,
          uses_default_password
        FROM app_users
        WHERE user_id = ? AND archived_at IS NULL;`,
        )
        .get(userId) as AccountRow | undefined;
    if (!row) throw new Error('The operator account was not found.');
    return parseCredentialAccount(row);
};

/** Reads and decrypts the stored backup password from SQLite. */
export const getBackupPassword = (
    database: DatabaseSync,
    protector: SecureStringProtector,
): string => {
    const row = database
        .prepare(
            "SELECT encrypted_value FROM app_secure_settings WHERE setting_key = 'backup_password';",
        )
        .get();
    if (!row) throw new Error('The backup password is not configured.');
    return protector.decryptString(toBuffer(row.encrypted_value));
};

/** Encrypts and persists the backup password in SQLite. */
export const setBackupPassword = (
    database: DatabaseSync,
    protector: SecureStringProtector,
    password: string,
) => {
    if (password.length < 8)
        throw new Error('Backup passwords must contain at least 8 characters.');
    const encrypted = protector.encryptString(password);
    database
        .prepare(
            `INSERT INTO app_secure_settings (setting_key, encrypted_value, updated_at)
        VALUES ('backup_password', ?, ?)
        ON CONFLICT(setting_key) DO UPDATE SET
          encrypted_value = excluded.encrypted_value,
          updated_at = excluded.updated_at;`,
        )
        .run(encrypted, new Date().toISOString());
};

/** Reports whether the protected credentials are still on their defaults. */
export const getCredentialStatus = (
    database: DatabaseSync,
    protector: SecureStringProtector,
): CredentialStatus => {
    const sysAdmin = database
        .prepare(
            `SELECT password_hash, uses_default_password
        FROM app_users
        WHERE user_id = 'sysadmin_1' AND archived_at IS NULL;`,
        )
        .get() as
        | { readonly password_hash?: unknown; readonly uses_default_password?: unknown }
        | undefined;
    return {
        sysAdminUsesDefaultPassword:
            sysAdmin?.uses_default_password !== undefined
                ? Number(sysAdmin.uses_default_password) === 1
                : true,
        backupUsesDefaultPassword: getBackupPassword(database, protector) === defaultCredential,
    };
};
