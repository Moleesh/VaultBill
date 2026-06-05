// @vitest-environment node

import { afterEach, describe, expect, it } from 'vitest';

import type { PrinterProfileConfig } from '../../engines/printEngine/PrinterProfileTypes';
import type { SqliteConnection } from '../sqlite/SqliteConnection';
import { runDatabaseStartupChecks } from '../startup/DatabaseStartup';
import { openNodeSqliteConnection } from './sqliteAdapter';
import {
  listPrinterProfiles,
  loadDefaultPrinterProfile,
  savePrinterProfile,
} from './printerProfileRepository';

let connection: SqliteConnection | undefined;

const fixedNow = '2026-06-04T10:00:00.000Z';

const createProfile = (
  profileId = 'OfficeA4',
  profileName = 'Office A4 Printer',
): PrinterProfileConfig => ({
  ProfileId: profileId,
  ProfileName: profileName,
  OutputTarget: 'SelectedPrinter',
  PrinterName: 'HP LaserJet Pro',
  PaperSize: 'A4',
  Orientation: 'Portrait',
  Margins: { Top: 10, Right: 10, Bottom: 10, Left: 10 },
  Scale: 1,
  ShowPreviewBeforePrint: true,
  AskCopiesBeforePrint: false,
  DefaultCopies: 1,
  FirstPageOnly: true,
});

const openStartedDatabase = () => {
  connection = openNodeSqliteConnection(':memory:');
  runDatabaseStartupChecks(connection, { nowIso: () => fixedNow });
  return connection;
};

afterEach(() => {
  connection?.close();
  connection = undefined;
});

describe('printerProfileRepository', () => {
  it('stores printer profile JSON and loads the default profile', () => {
    const db = openStartedDatabase();

    savePrinterProfile(db, {
      profileId: 'OfficeA4',
      profileName: 'Office A4 Printer',
      profileConfig: createProfile(),
      isDefault: true,
      updatedAt: fixedNow,
    });

    expect(loadDefaultPrinterProfile(db)).toMatchObject({
      profileId: 'OfficeA4',
      profileName: 'Office A4 Printer',
      isDefault: true,
    });
    expect(listPrinterProfiles(db)).toHaveLength(1);
  });

  it('keeps only the latest saved default profile marked as default', () => {
    const db = openStartedDatabase();

    savePrinterProfile(db, {
      profileId: 'OfficeA4',
      profileName: 'Office A4 Printer',
      profileConfig: createProfile(),
      isDefault: true,
      updatedAt: fixedNow,
    });
    savePrinterProfile(db, {
      profileId: 'Thermal',
      profileName: 'Thermal Counter',
      profileConfig: createProfile('Thermal', 'Thermal Counter'),
      isDefault: true,
      updatedAt: fixedNow,
    });

    expect(listPrinterProfiles(db).map((profile) => profile.isDefault)).toEqual([
      true,
      false,
    ]);
    expect(loadDefaultPrinterProfile(db)?.profileId).toBe('Thermal');
  });

  it('rejects mismatched printer profile metadata', () => {
    const db = openStartedDatabase();

    expect(() => {
      savePrinterProfile(db, {
        profileId: 'OfficeA4',
        profileName: 'Office A4 Printer',
        profileConfig: createProfile('OtherProfile', 'Other Profile'),
        isDefault: true,
        updatedAt: fixedNow,
      });
    }).toThrow('Printer profile metadata must match profile JSON.');
  });
});
