/** @format */

import type { z } from 'zod';

import {
    CompanyProfileSchema,
    RuntimeBrandingSchema,
    SignaturePadSettingsSchema,
    SecretsSettingsSchema,
    type CompanyProfileConfig,
    type RuntimeBrandingConfig,
    type SignaturePadSettings,
    type SecretsSettings,
} from '../startup/ConfigSchemas';
import { parseJsonWithSchema, stringifyValidatedJson } from '../startup/JsonParsing';
import {
    companyProfileSettingKey,
    runtimeBrandingSettingKey,
    signaturePadSettingKey,
    secretsSettingKey,
} from '../startup/StartupSettingKeys';
import type { SqliteConnection } from '../sqlite/SqliteConnection';

export const saveRuntimeBranding = (
    connection: SqliteConnection,
    branding: RuntimeBrandingConfig,
    updatedAt: string,
) => {
    upsertSetting(
        connection,
        runtimeBrandingSettingKey,
        stringifyValidatedJson(branding, RuntimeBrandingSchema),
        updatedAt,
    );
};

export const loadRuntimeBranding = (
    connection: SqliteConnection,
): RuntimeBrandingConfig | undefined =>
    loadSetting(connection, runtimeBrandingSettingKey, RuntimeBrandingSchema);

export const saveCompanyProfile = (
    connection: SqliteConnection,
    companyProfile: CompanyProfileConfig,
    updatedAt: string,
) => {
    upsertSetting(
        connection,
        companyProfileSettingKey,
        stringifyValidatedJson(companyProfile, CompanyProfileSchema),
        updatedAt,
    );
};

export const loadCompanyProfile = (
    connection: SqliteConnection,
): CompanyProfileConfig | undefined =>
    loadSetting(connection, companyProfileSettingKey, CompanyProfileSchema);

export const saveSignaturePadSettings = (
    connection: SqliteConnection,
    settings: SignaturePadSettings,
    updatedAt: string,
) => {
    upsertSetting(
        connection,
        signaturePadSettingKey,
        stringifyValidatedJson(settings, SignaturePadSettingsSchema),
        updatedAt,
    );
};

export const loadSignaturePadSettings = (
    connection: SqliteConnection,
): SignaturePadSettings | undefined =>
    loadSetting(connection, signaturePadSettingKey, SignaturePadSettingsSchema);

export const saveSecretsSettings = (
    connection: SqliteConnection,
    settings: SecretsSettings,
    updatedAt: string,
) => {
    upsertSetting(
        connection,
        secretsSettingKey,
        stringifyValidatedJson(settings, SecretsSettingsSchema),
        updatedAt,
    );
};

export const loadSecretsSettings = (
    connection: SqliteConnection,
): SecretsSettings | undefined =>
    loadSetting<SecretsSettings>(connection, secretsSettingKey, SecretsSettingsSchema);

const upsertSetting = (
    connection: SqliteConnection,
    settingKey: string,
    settingJson: string,
    updatedAt: string,
) => {
    const existing = connection.get('SELECT setting_key FROM settings WHERE setting_key = ?;', [
        settingKey,
    ]);

    if (existing) {
        connection.run(
            `UPDATE settings
        SET setting_json = ?, updated_at = ?
        WHERE setting_key = ?;`,
            [settingJson, updatedAt, settingKey],
        );
        return;
    }

    connection.run(
        `INSERT INTO settings (setting_key, setting_json, updated_at)
      VALUES (?, ?, ?);`,
        [settingKey, settingJson, updatedAt],
    );
};

const loadSetting = <T>(
    connection: SqliteConnection,
    settingKey: string,
    schema: z.ZodType<T>,
): T | undefined => {
    const row = connection.get('SELECT setting_json FROM settings WHERE setting_key = ?;', [
        settingKey,
    ]);

    if (!row || typeof row.setting_json !== 'string') {
        return undefined;
    }

    return parseJsonWithSchema(row.setting_json, schema);
};
