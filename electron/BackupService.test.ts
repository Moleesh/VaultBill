// @vitest-environment node

import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { BackupService } from './BackupService.js';

let directory = '';
let databasePath = '';
let service: BackupService;

beforeEach(() => {
  directory = mkdtempSync(path.join(tmpdir(), 'vaultbill-backup-service-'));
  databasePath = path.join(directory, 'vaultbill.sqlite');
  const database = new DatabaseSync(databasePath);
  database.exec(`
    CREATE TABLE app_users (user_id TEXT PRIMARY KEY, display_name TEXT NOT NULL);
    CREATE TABLE app_records (record_id TEXT PRIMARY KEY, record_json TEXT NOT NULL);
    INSERT INTO app_users VALUES ('sysadmin_1', 'System Administrator');
    INSERT INTO app_records VALUES ('record_1', '{"customerName":"Aster Works"}');
  `);
  database.close();
  service = new BackupService(databasePath, {
    chooseBackupDestination: () => Promise.resolve(undefined),
    chooseRestoreSource: () => Promise.resolve(undefined),
  });
});

afterEach(() => {
  if (directory) rmSync(directory, { recursive: true, force: true });
});

describe('BackupService', () => {
  it('creates, validates, and replaces an unencrypted SQLite backup', () => {
    const archive = service.createArchive(false);
    overwriteRecord('Changed locally');
    const preparedPath = service.prepareRestoreArchive(archive.bytes);

    service.replaceDatabase(preparedPath);

    expect(readCustomerName(databasePath)).toBe('Aster Works');
    expect(readCustomerName(`${databasePath}.before-restore`)).toBe('Changed locally');
  });

  it('restores encrypted backups with either password or recovery key', () => {
    const archive = service.createArchive(true, 'strong-backup-password');
    expect(archive.recoveryKey).toBeTruthy();

    const passwordRestore = service.prepareRestoreArchive(archive.bytes, 'strong-backup-password');
    expect(readCustomerName(passwordRestore)).toBe('Aster Works');
    rmSync(passwordRestore, { force: true });

    const recoveryRestore = service.prepareRestoreArchive(
      archive.bytes,
      undefined,
      archive.recoveryKey,
    );
    expect(readCustomerName(recoveryRestore)).toBe('Aster Works');
    rmSync(recoveryRestore, { force: true });
  });

  it('rejects changed payloads and incomplete VaultBill databases', () => {
    const archive = service.createArchive(false);
    const files = unzipSync(archive.bytes);
    const databaseBytes = requiredFile(files, 'database.sqlite');
    databaseBytes[0] = (databaseBytes[0] ?? 0) ^ 0xff;
    expect(() => service.prepareRestoreArchive(zipSync(files))).toThrow(
      'Backup checksum failed for database.sqlite.',
    );

    const incompletePath = path.join(directory, 'incomplete.sqlite');
    const incomplete = new DatabaseSync(incompletePath);
    incomplete.exec('CREATE TABLE unrelated (id TEXT);');
    incomplete.close();
    const incompleteFiles = unzipSync(archive.bytes);
    incompleteFiles['database.sqlite'] = new Uint8Array(readFileSync(incompletePath));
    const manifestBytes = requiredFile(incompleteFiles, 'manifest.json');
    const manifest = JSON.parse(strFromU8(manifestBytes)) as {
      DatabaseFile: string;
    };
    const payloadName = manifest.DatabaseFile;
    const checksums = {
      'manifest.json': sha256(manifestBytes),
      [payloadName]: sha256(requiredFile(incompleteFiles, payloadName)),
    };
    incompleteFiles['checksums.json'] = strToU8(JSON.stringify(checksums));

    expect(() => service.prepareRestoreArchive(zipSync(incompleteFiles))).toThrow(
      'not a complete VaultBill database',
    );
  });

  it('removes the database and sidecars during an application reset', () => {
    writeFileSync(`${databasePath}-wal`, 'wal');
    writeFileSync(`${databasePath}-shm`, 'shm');

    service.resetDatabase();

    expect(() => readFileSync(databasePath)).toThrow();
    expect(() => readFileSync(`${databasePath}-wal`)).toThrow();
    expect(() => readFileSync(`${databasePath}-shm`)).toThrow();
  });
});

const overwriteRecord = (customerName: string) => {
  const database = new DatabaseSync(databasePath);
  database
    .prepare("UPDATE app_records SET record_json = json_set(record_json, '$.customerName', ?);")
    .run(customerName);
  database.close();
};

const readCustomerName = (filePath: string): string => {
  const database = new DatabaseSync(filePath, { readOnly: true });
  try {
    const row = database
      .prepare("SELECT record_json FROM app_records WHERE record_id = 'record_1';")
      .get();
    return (JSON.parse(String(row?.record_json)) as { customerName: string }).customerName;
  } finally {
    database.close();
  }
};

const sha256 = (bytes: Uint8Array): string => {
  return createHash('sha256').update(bytes).digest('hex');
};

const requiredFile = (
  files: Readonly<Record<string, Uint8Array | undefined>>,
  name: string,
): Uint8Array => {
  const bytes = files[name];
  if (!bytes) throw new Error(`Expected ${name} in test backup.`);
  return bytes;
};
