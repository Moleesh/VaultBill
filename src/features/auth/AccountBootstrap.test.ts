// @vitest-environment node

import { afterEach, describe, expect, it } from 'vitest';

import { openNodeSqliteConnection } from '../../db/adapters/sqliteAdapter';
import { runDatabaseStartupChecks } from '../../db/startup/DatabaseStartup';
import type { SqliteConnection } from '../../db/sqlite/SqliteConnection';
import {
  bootstrapOperatorAccounts,
  createOperatorContext,
  validateAccountLimits,
} from './AccountBootstrap';
import { seedBootstrapAccountsIfNeeded } from './AccountBootstrapDb';
import type { OperatorAccount } from './AccountTypes';

let connection: SqliteConnection | undefined;

const openMemoryConnection = () => {
  connection = openNodeSqliteConnection(':memory:');
  return connection;
};

const fixedNow = () => '2026-06-04T10:00:00.000Z';

afterEach(() => {
  connection?.close();
  connection = undefined;
});

describe('AccountBootstrap', () => {
  it('creates operator metadata from the selected account identity', () => {
    const operatorAccount: OperatorAccount = {
      userId: 'user_1',
      username: 'operator',
      displayName: 'Counter Operator',
      role: 'User',
      isActive: true,
    };

    expect(createOperatorContext(operatorAccount)).toEqual({
      account: operatorAccount,
      role: 'User',
      CreatedBy: 'user_1',
      CreatedByName: 'Counter Operator',
      LastActionBy: 'user_1',
      LastActionByName: 'Counter Operator',
    });
  });

  it('validates active account limits while ignoring inactive accounts', () => {
    const accounts: readonly OperatorAccount[] = [
      ...bootstrapOperatorAccounts,
      {
        userId: 'sysadmin_2',
        username: 'sysadmin-two',
        displayName: 'Second SysAdmin',
        role: 'SysAdmin',
        isActive: true,
      },
      {
        userId: 'admin_2',
        username: 'inactive-admin',
        displayName: 'Inactive Admin',
        role: 'Admin',
        isActive: false,
      },
    ];

    expect(validateAccountLimits(accounts)).toEqual({
      isValid: false,
      messages: ['Only one active SysAdmin account is allowed.'],
    });
  });

  it('seeds only the protected SysAdmin row on a clean database', () => {
    const db = openMemoryConnection();
    runDatabaseStartupChecks(db, { nowIso: fixedNow });

    const result = seedBootstrapAccountsIfNeeded(db, fixedNow());

    expect(result).toEqual({
      seeded: true,
      createdAccountIds: ['sysadmin_1'],
    });
    expect(db.get('SELECT COUNT(*) AS count FROM users;')).toEqual({ count: 1 });
  });
});
