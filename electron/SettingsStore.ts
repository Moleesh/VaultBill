/** @format */

import { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';

export const BusinessSettingsSchema = z.object({
    companyName: z.string().trim().min(1),
    address: z.string().trim().min(1),
    gstin: z.string().trim(),
    theme: z.string().trim().min(1),
    outputTarget: z.enum(['PreviewOnly', 'DownloadPdf', 'SystemPrinter']),
});

export const IntegrationSettingsSchema = z.object({
    gstEnabled: z.boolean(),
    gspProvider: z.string().trim(),
    smsEnabled: z.boolean(),
    smsProvider: z.string().trim(),
    signatureEnabled: z.boolean(),
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
    gstEnabled: false,
    gspProvider: '',
    smsEnabled: false,
    smsProvider: '',
    signatureEnabled: false,
};
const defaultHostedWebSettings: HostedWebSettings = {
    lanEnabled: false,
    passwordRequired: true,
    port: 4317,
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

    public getIntegrations = (): IntegrationSettings =>
        this.#read('integrations', IntegrationSettingsSchema, defaultIntegrationSettings);

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
