import { z } from 'zod';

import {
  PrinterProfileConfigSchema,
  type PrinterProfileConfig,
  type PrinterProfileRecord,
} from '../../engines/printEngine/PrinterProfileTypes';
import { stringifyValidatedJson } from '../startup/JsonParsing';
import type { SqliteConnection } from '../sqlite/SqliteConnection';

export type SavePrinterProfileInput = {
  readonly profileId: string;
  readonly profileName: string;
  readonly profileConfig: PrinterProfileConfig;
  readonly isDefault: boolean;
  readonly updatedAt: string;
};

const printerProfileRowSchema = z.object({
  profile_id: z.string(),
  profile_name: z.string(),
  profile_json: z.string(),
  is_default: z.number(),
  updated_at: z.string(),
});

export const savePrinterProfile = (
  connection: SqliteConnection,
  input: SavePrinterProfileInput,
) => {
  const profileConfig = validatePrinterProfileConfig(input);

  connection.exec('BEGIN IMMEDIATE TRANSACTION;');

  try {
    if (input.isDefault) {
      connection.run('UPDATE printer_profiles SET is_default = 0;');
    }

    const existing = connection.get(
      'SELECT profile_id FROM printer_profiles WHERE profile_id = ?;',
      [input.profileId],
    );
    const parameters = [
      input.profileName,
      stringifyValidatedJson(profileConfig, PrinterProfileConfigSchema),
      input.isDefault ? 1 : 0,
      input.updatedAt,
      input.profileId,
    ];

    if (existing) {
      connection.run(
        `UPDATE printer_profiles
          SET profile_name = ?, profile_json = ?, is_default = ?, updated_at = ?
          WHERE profile_id = ?;`,
        parameters,
      );
    } else {
      connection.run(
        `INSERT INTO printer_profiles
          (profile_name, profile_json, is_default, updated_at, profile_id)
          VALUES (?, ?, ?, ?, ?);`,
        parameters,
      );
    }

    connection.exec('COMMIT;');
  } catch (error) {
    connection.exec('ROLLBACK;');
    throw error;
  }
};

export const listPrinterProfiles = (
  connection: SqliteConnection,
): readonly PrinterProfileRecord[] =>
  connection
    .all(
      `SELECT profile_id, profile_name, profile_json, is_default, updated_at
        FROM printer_profiles
        ORDER BY is_default DESC, profile_name ASC;`,
    )
    .map(parsePrinterProfileRow);

export const loadDefaultPrinterProfile = (
  connection: SqliteConnection,
): PrinterProfileRecord | undefined => {
  const row = connection.get(
    `SELECT profile_id, profile_name, profile_json, is_default, updated_at
      FROM printer_profiles
      WHERE is_default = 1
      LIMIT 1;`,
  );

  return row ? parsePrinterProfileRow(row) : undefined;
};

const validatePrinterProfileConfig = (input: SavePrinterProfileInput): PrinterProfileConfig => {
  const parsed = PrinterProfileConfigSchema.parse(input.profileConfig);

  if (parsed.ProfileId !== input.profileId || parsed.ProfileName !== input.profileName) {
    throw new Error('Printer profile metadata must match profile JSON.');
  }

  return parsed;
};

const parsePrinterProfileRow = (row: unknown): PrinterProfileRecord => {
  const parsed = printerProfileRowSchema.parse(row);
  const profileJson: unknown = JSON.parse(parsed.profile_json);

  return {
    profileId: parsed.profile_id,
    profileName: parsed.profile_name,
    profileConfig: PrinterProfileConfigSchema.parse(profileJson),
    isDefault: parsed.is_default === 1,
    updatedAt: parsed.updated_at,
  };
};
