/** @format */

/** Settings store that persists business profile, security, and integration preferences. */

import { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';

export const BusinessSettingsSchema = z.object({
    companyName: z.string().trim().min(1),
    address: z.string().trim().min(1),
    gstin: z.string().trim(),
    theme: z.string().trim().min(1),
    outputTarget: z.enum(['PreviewOnly', 'DownloadPdf', 'SystemPrinter']),
});

const SecretEntrySchema = z.object({
    key: z.string().trim().min(1),
    value: z.string(),
    description: z.string().trim().optional().default(''),
});

export const IntegrationSettingsSchema = z.object({
    secrets: z.array(SecretEntrySchema),
});
export const HostedWebSettingsSchema = z.object({
    lanEnabled: z.boolean(),
    passwordRequired: z.boolean(),
    port: z.number().int().min(1024).max(65_535),
});

export type BusinessSettings = z.infer<typeof BusinessSettingsSchema>;
export type IntegrationSettings = z.infer<typeof IntegrationSettingsSchema>;
export type HostedWebSettings = z.infer<typeof HostedWebSettingsSchema>;

const defaultBusinessSettings: BusinessSettings = {
    companyName: '',
    address: '',
    gstin: '',
    theme: 'teal-flow',
    outputTarget: 'PreviewOnly',
};

const defaultIntegrationSettings: IntegrationSettings = {
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

    public getBusiness = (): BusinessSettings =>
        this.#read('business', BusinessSettingsSchema, defaultBusinessSettings);

    public saveBusiness = (input: unknown): BusinessSettings => {
        const business = BusinessSettingsSchema.parse(input);
        this.#write('business', business);
        return business;
    };

    public getIntegrations = (): IntegrationSettings => this.#readIntegrations();

    public saveIntegrations = (input: unknown): IntegrationSettings => {
        const integrations = IntegrationSettingsSchema.parse(input);
        this.#write('integrations', integrations);
        return integrations;
    };

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

    #readIntegrations = (): IntegrationSettings => {
        const row = this.#database
            .prepare('SELECT setting_json FROM app_settings WHERE setting_key = ?;')
            .get('integrations');
        if (!row) return defaultIntegrationSettings;
        const parsed = JSON.parse(String(row.setting_json)) as Record<string, unknown>;
        const normalized = IntegrationSettingsSchema.safeParse(parsed);
        if (normalized.success) return normalized.data;
        if (typeof parsed !== 'object') return defaultIntegrationSettings;
        const legacy = parsed;
        const secrets: IntegrationSettings['secrets'] = [];
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
