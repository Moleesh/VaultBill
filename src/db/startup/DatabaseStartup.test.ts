// @vitest-environment node

import { afterEach, describe, expect, it } from 'vitest';

import { openNodeSqliteConnection } from '../adapters/sqliteAdapter';
import {
  DatabaseConfigurationError,
  DatabaseRecoveryError,
  type SqliteConnection,
} from '../sqlite/SqliteConnection';
import { builtInDefaultFormat } from './BuiltInDefaultFormat';
import { DocumentFormatConfigSchema } from './ConfigSchemas';
import { runDatabaseStartupChecks } from './DatabaseStartup';
import { stringifyValidatedJson } from './JsonParsing';

let connection: SqliteConnection | undefined;

const openMemoryConnection = () => {
  connection = openNodeSqliteConnection(':memory:');
  return connection;
};

const fixedNow = () => '2026-06-04T10:00:00.000Z';

const validDefaultFormatJson = () =>
  stringifyValidatedJson(builtInDefaultFormat, DocumentFormatConfigSchema);

afterEach(() => {
  connection?.close();
  connection = undefined;
});

describe('runDatabaseStartupChecks', () => {
  it('creates required tables, indexes, seed format, and settings on a clean database', () => {
    const db = openMemoryConnection();

    const result = runDatabaseStartupChecks(db, { nowIso: fixedNow });

    expect(result.defaultFormatId).toBe('TaxInvoice');
    expect(result.appliedPatches).toContain('seed:builtInDefaultFormat');
    expect(result.appliedPatches).toContain('settings:startupHealth');
    expect(db.get('PRAGMA foreign_keys;')).toEqual({ foreign_keys: 1 });
    expect(db.get('SELECT COUNT(*) AS count FROM document_formats WHERE is_default = 1;')).toEqual({
      count: 1,
    });
    expect(
      db.get('SELECT setting_json FROM settings WHERE setting_key = ?;', [
        'settings.startupHealth',
      ]),
    ).toEqual({
      setting_json: '{"LastStartupCheckAt":"2026-06-04T10:00:00.000Z","SchemaVersion":2}',
    });
  });

  it('adds missing safe columns to existing tables before validation continues', () => {
    const db = openMemoryConnection();
    db.exec('CREATE TABLE printer_profiles (profile_id TEXT PRIMARY KEY);');

    runDatabaseStartupChecks(db, { nowIso: fixedNow });

    const columns = db.all('PRAGMA table_info(printer_profiles);').map((row) => row.name);

    expect(columns).toContain('profile_json');
    expect(columns).toContain('is_default');
    expect(columns).toContain('updated_at');
  });

  it('stops startup with a recovery error when unique index creation finds duplicate defaults', () => {
    const db = openMemoryConnection();
    db.exec(`CREATE TABLE document_formats (
      format_id TEXT PRIMARY KEY,
      format_name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      format_json TEXT NOT NULL CHECK (json_valid(format_json)),
      is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
      updated_at TEXT NOT NULL
    );`);
    db.run('INSERT INTO document_formats VALUES (?, ?, ?, 1, ?);', [
      'FormatOne',
      'Format One',
      validDefaultFormatJson(),
      fixedNow(),
    ]);
    db.run('INSERT INTO document_formats VALUES (?, ?, ?, 1, ?);', [
      'FormatTwo',
      'Format Two',
      validDefaultFormatJson(),
      fixedNow(),
    ]);

    expect(() => runDatabaseStartupChecks(db, { nowIso: fixedNow })).toThrow(DatabaseRecoveryError);
  });

  it('stops startup when the single default format JSON does not match metadata', () => {
    const db = openMemoryConnection();
    db.exec(`CREATE TABLE document_formats (
      format_id TEXT PRIMARY KEY,
      format_name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      format_json TEXT NOT NULL CHECK (json_valid(format_json)),
      is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
      updated_at TEXT NOT NULL
    );`);
    db.run('INSERT INTO document_formats VALUES (?, ?, ?, 1, ?);', [
      'DifferentId',
      'GST Invoice',
      validDefaultFormatJson(),
      fixedNow(),
    ]);

    expect(() => runDatabaseStartupChecks(db, { nowIso: fixedNow })).toThrow(
      DatabaseConfigurationError,
    );
  });
});
