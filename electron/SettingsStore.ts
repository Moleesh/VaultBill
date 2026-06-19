/** @format */

/** Settings store that persists business profile, security, and secrets preferences. */

import { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';

export const BusinessSettingsSchema = z.object({
    companyName: z.string().trim().min(1),
    address: z.string().trim().min(1),
    gstin: z.string().trim(),
    theme: z.string().trim().min(1),
    outputTarget: z.enum(['PreviewOnly', 'DownloadPdf', 'SystemPrinter']),
    preferredPrinterName: z.string().trim().default(''),
    includeDraftsInReports: z.boolean().default(false),
});

const SecretEntrySchema = z.object({
    key: z.string().trim().min(1),
    value: z.string(),
    description: z.string().trim().optional().default(''),
});

export const SecretsSettingsSchema = z.object({
    secrets: z.array(SecretEntrySchema),
});
export const HostedWebSettingsSchema = z.object({
    lanEnabled: z.boolean(),
    passwordRequired: z.boolean(),
    port: z.number().int().min(1024).max(65_535),
});

export type BusinessSettings = z.output<typeof BusinessSettingsSchema>;
export type SecretsSettings = z.infer<typeof SecretsSettingsSchema>;
export type HostedWebSettings = z.infer<typeof HostedWebSettingsSchema>;

const defaultBusinessSettings: BusinessSettings = {
    companyName: '',
    address: '',
    gstin: '',
    theme: 'teal-flow',
    outputTarget: 'PreviewOnly',
    preferredPrinterName: '',
    includeDraftsInReports: false,
};

const defaultSecretsSettings: SecretsSettings = {
    secrets: [],
};
const defaultHostedWebSettings: HostedWebSettings = {
    lanEnabled: false,
    passwordRequired: true,
    port: 4317,
};

const BackupMetadataSchema = z.object({
    lastBackupAt: z.string().nullable(),
});

export type BackupMetadata = z.infer<typeof BackupMetadataSchema>;

const defaultBackupMetadata: BackupMetadata = {
    lastBackupAt: null,
};

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

    public getBusiness = (): BusinessSettings => {
        const row = this.#database
            .prepare('SELECT setting_json FROM app_settings WHERE setting_key = ?;')
            .get('business');
        if (!row) return defaultBusinessSettings;
        return BusinessSettingsSchema.parse(JSON.parse(String(row.setting_json)));
    };

    public saveBusiness = (input: unknown): BusinessSettings => {
        const business: BusinessSettings = BusinessSettingsSchema.parse(input);
        this.#write('business', business);
        return business;
    };

    public getSecrets = (): SecretsSettings => this.#readSecrets();

    public getIntegrations = (): SecretsSettings => this.getSecrets();

    public saveSecrets = (input: unknown): SecretsSettings => {
        const secrets = SecretsSettingsSchema.parse(input);
        this.#write('secrets', secrets);
        return secrets;
    };

    public saveIntegrations = (input: unknown): SecretsSettings => this.saveSecrets(input);

    public getHostedWeb = (): HostedWebSettings =>
        this.#read('hosted-web', HostedWebSettingsSchema, defaultHostedWebSettings);

    public saveHostedWeb = (input: unknown): HostedWebSettings => {
        const hostedWeb = HostedWebSettingsSchema.parse(input);
        this.#write('hosted-web', hostedWeb);
        return hostedWeb;
    };

    public getBackupMetadata = (): BackupMetadata =>
        this.#read('backup-metadata', BackupMetadataSchema, defaultBackupMetadata);

    public saveBackupMetadata = (input: unknown): BackupMetadata => {
        const metadata = BackupMetadataSchema.parse(input);
        this.#write('backup-metadata', metadata);
        return metadata;
    };

    public isSetupComplete = (): boolean => {
        const business = this.getBusiness();
        return business.companyName.length > 0 && business.address.length > 0;
    };

    public close = () => {
        this.#database.close();
    };

    #read = <T>(key: string, schema: z.ZodType<T>, fallback: T): T => {
        const row = this.#database
            .prepare('SELECT setting_json FROM app_settings WHERE setting_key = ?;')
            .get(key);
        if (!row) return fallback;
        return schema.parse(JSON.parse(String(row.setting_json)));
    };

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
