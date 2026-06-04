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
    const operatorAccount = bootstrapOperatorAccounts[2];

    if (!operatorAccount) {
      throw new Error('Expected a sample operator account.');
    }

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

  it('seeds SysAdmin and Admin rows on a clean database', () => {
    const db = openMemoryConnection();
    runDatabaseStartupChecks(db, { nowIso: fixedNow });

    const result = seedBootstrapAccountsIfNeeded(db, fixedNow());

    expect(result).toEqual({
      seeded: true,
      createdAccountIds: ['sysadmin_1', 'admin_1'],
    });
    expect(db.get('SELECT COUNT(*) AS count FROM users;')).toEqual({ count: 2 });
  });
});
