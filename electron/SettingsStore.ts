/** @format */

/** Settings store that persists business profile, security, and secrets preferences. */

import { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import { defaultHostedWebPort } from './server/LocalApiSecurity.js';

/** Stored business settings shared by runtime branding, printing, and reports. */
export const BusinessSettingsSchema = z.object({
    companyName: z.string().trim().min(1),
    address: z.string().trim().min(1),
    gstin: z.string().trim(),
    theme: z.string().trim().min(1),
    outputTarget: z.enum(['PreviewOnly', 'DownloadPdf', 'SystemPrinter']),
    preferredPrinterName: z.string().trim().default(''),
    includeDraftsInReports: z.boolean().default(false),
});

/** One secret entry stored in the simplified secrets settings model. */
const SecretEntrySchema = z.object({
    key: z.string().trim().min(1),
    value: z.string(),
    description: z.string().trim().optional().default(''),
});

/** Stored secrets used by formula helpers and integration adapters. */
export const SecretsSettingsSchema = z.object({
    secrets: z.array(SecretEntrySchema),
});

/** Hosted web settings for the desktop-served browser workspace. */
export const HostedWebSettingsSchema = z.object({
    lanEnabled: z.boolean(),
    passwordRequired: z.boolean(),
    port: z.number().int().min(1).max(65_535),
});

/** Parsed business settings shape returned to the application runtime. */
export type BusinessSettings = z.output<typeof BusinessSettingsSchema>;
/** Parsed secrets settings shape returned to the application runtime. */
export type SecretsSettings = z.infer<typeof SecretsSettingsSchema>;
/** Parsed hosted-web settings shape returned to the application runtime. */
export type HostedWebSettings = z.infer<typeof HostedWebSettingsSchema>;

/** Defaults used before a business completes setup. */
const defaultBusinessSettings: BusinessSettings = {
    companyName: '',
    address: '',
    gstin: '',
    theme: 'teal-flow',
    outputTarget: 'PreviewOnly',
    preferredPrinterName: '',
    includeDraftsInReports: false,
};

/** Defaults used before any secrets are configured. */
const defaultSecretsSettings: SecretsSettings = {
    secrets: [],
};

/** Defaults used before hosted web settings are customized. */
const defaultHostedWebSettings: HostedWebSettings = {
    lanEnabled: false,
    passwordRequired: true,
    port: defaultHostedWebPort,
};

/** Backup metadata tracked separately from live business settings. */
const BackupMetadataSchema = z.object({
    lastBackupAt: z.string().nullable(),
});

/** Parsed backup metadata returned to the application runtime. */
export type BackupMetadata = z.infer<typeof BackupMetadataSchema>;

/** Defaults used before the first backup completes. */
const defaultBackupMetadata: BackupMetadata = {
    lastBackupAt: null,
};

/** Persists business, secrets, hosted-web, and backup settings in SQLite. */
export class SettingsStore {
    readonly #database: DatabaseSync;

    public constructor(databasePath: string) {
        this.#database = new DatabaseSync(databasePath);
        this.#database.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS app_settings (
        setting_key TEXT PRIMARY KEY,
        setting_json TEXT NOT NULL CHECK (json_valid(setting_json)),
        updated_at TEXT NOT NULL
      );
    `);
    }

    /** Reads the stored business settings or returns setup-time defaults. */
    public getBusiness = (): BusinessSettings => {
        const row = this.#database
            .prepare('SELECT setting_json FROM app_settings WHERE setting_key = ?;')
            .get('business');
        if (!row) return defaultBusinessSettings;
        return BusinessSettingsSchema.parse(JSON.parse(String(row.setting_json)));
    };

    /** Validates and saves the business settings payload. */
    public saveBusiness = (input: unknown): BusinessSettings => {
        const business: BusinessSettings = BusinessSettingsSchema.parse(input);
        this.#write('business', business);
        return business;
    };

    /** Reads the simplified secrets settings payload. */
    public getSecrets = (): SecretsSettings => this.#readSecrets();

    /** Keeps legacy integrations callers pointed at the unified secrets model. */
    public getIntegrations = (): SecretsSettings => this.getSecrets();

    /** Validates and saves the unified secrets settings payload. */
    public saveSecrets = (input: unknown): SecretsSettings => {
        const secrets = SecretsSettingsSchema.parse(input);
        this.#write('secrets', secrets);
        return secrets;
    };

    /** Keeps legacy integrations callers pointed at the unified secrets model. */
    public saveIntegrations = (input: unknown): SecretsSettings => this.saveSecrets(input);

    /** Reads hosted-web settings or returns the desktop-safe defaults. */
    public getHostedWeb = (): HostedWebSettings =>
        this.#read('hosted-web', HostedWebSettingsSchema, defaultHostedWebSettings);

    /** Validates and saves hosted-web settings. */
    public saveHostedWeb = (input: unknown): HostedWebSettings => {
        const hostedWeb = HostedWebSettingsSchema.parse(input);
        this.#write('hosted-web', hostedWeb);
        return hostedWeb;
    };

    /** Reads backup metadata for dashboard and status surfaces. */
    public getBackupMetadata = (): BackupMetadata =>
        this.#read('backup-metadata', BackupMetadataSchema, defaultBackupMetadata);

    /** Validates and saves backup metadata. */
    public saveBackupMetadata = (input: unknown): BackupMetadata => {
        const metadata = BackupMetadataSchema.parse(input);
        this.#write('backup-metadata', metadata);
        return metadata;
    };

    /** Reports whether the minimum business identity for setup completion exists. */
    public isSetupComplete = (): boolean => {
        const business = this.getBusiness();
        return business.companyName.length > 0 && business.address.length > 0;
    };

    /** Closes the SQLite settings connection. */
    public close = () => {
        this.#database.close();
    };

    /** Reads and validates one settings payload, or returns the provided fallback. */
    #read = <T>(key: string, schema: z.ZodType<T>, fallback: T): T => {
        const row = this.#database
            .prepare('SELECT setting_json FROM app_settings WHERE setting_key = ?;')
            .get(key);
        if (!row) return fallback;
        return schema.parse(JSON.parse(String(row.setting_json)));
    };

    /** Reads secrets, including migration support for older integration-shaped payloads. */
    #readSecrets = (): SecretsSettings => {
        const readRow = (settingKey: string) =>
            this.#database
                .prepare('SELECT setting_json FROM app_settings WHERE setting_key = ?;')
                .get(settingKey);

        const row = readRow('secrets') ?? readRow('integrations');
        if (!row) return defaultSecretsSettings;
        const parsed = JSON.parse(String(row.setting_json)) as Record<string, unknown>;
        const normalized = SecretsSettingsSchema.safeParse(parsed);
        if (normalized.success) return normalized.data;
        if (typeof parsed !== 'object') return defaultSecretsSettings;
        const legacy = parsed;
        const secrets: SecretsSettings['secrets'] = [];
        for (const [prefix, rawService] of [
            ['GST', legacy.gst],
            ['SMS', legacy.sms],
        ] as const) {
            if (!rawService || typeof rawService !== 'object') continue;
            const service = rawService as Record<string, unknown>;
            const fields = Array.isArray(service.fields) ? service.fields : [];
            for (const field of fields) {
                const entry = SecretEntrySchema.safeParse(field);
                if (!entry.success) continue;
                secrets.push({
                    key: entry.data.key,
                    value: entry.data.value,
                    description: entry.data.description || `${prefix} legacy setting`,
                });
            }
        }
        return { secrets };
    };

    /** Writes one settings payload with an updated timestamp. */
    #write = (key: string, value: unknown) => {
        this.#database
            .prepare(
                `INSERT INTO app_settings (setting_key, setting_json, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(setting_key) DO UPDATE SET
          setting_json = excluded.setting_json,
          updated_at = excluded.updated_at;`,
            )
            .run(key, JSON.stringify(value), new Date().toISOString());
    };
}
