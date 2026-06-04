import { afterEach, describe, expect, it } from 'vitest';

import type { SqliteConnection } from '../sqlite/SqliteConnection';
import { runDatabaseStartupChecks } from '../startup/DatabaseStartup';
import { loadAppAsset, saveAppAsset } from './appAssetRepository';
import { openNodeSqliteConnection } from './sqliteAdapter';

let connection: SqliteConnection | undefined;
const fixedNow = '2026-06-04T10:00:00.000Z';

const openStartedDatabase = () => {
  connection = openNodeSqliteConnection(':memory:');
  runDatabaseStartupChecks(connection, { nowIso: () => fixedNow });
  return connection;
};

afterEach(() => {
  connection?.close();
  connection = undefined;
});

describe('appAssetRepository', () => {
  it('stores and loads app asset blobs for logos and favicons', () => {
    const db = openStartedDatabase();

    saveAppAsset(db, {
      assetId: 'asset_logo',
      assetName: 'logo.png',
      mimeType: 'image/png',
      assetBlob: new Uint8Array([1, 2, 3]),
      sizeBytes: 3,
      createdAt: fixedNow,
    });

    expect(loadAppAsset(db, 'asset_logo')).toMatchObject({
      assetId: 'asset_logo',
      assetName: 'logo.png',
      mimeType: 'image/png',
      sizeBytes: 3,
    });
    expect(Array.from(loadAppAsset(db, 'asset_logo')?.assetBlob ?? [])).toEqual([
      1, 2, 3,
    ]);
  });
});
