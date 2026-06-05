import { openNodeSqliteConnection } from '../../db/adapters/sqliteAdapter';
import { listStoredDocumentFormats } from '../../db/adapters/documentFormatRepository';
import type { SqliteConnection } from '../../db/sqlite/SqliteConnection';
import { runDatabaseStartupChecks } from '../../db/startup/DatabaseStartup';
import { resolveDocumentFormatSelection } from '../../engines/schemaEngine/DocumentFormatResolver';
import { bootstrapOperatorAccounts, createOperatorContext } from '../auth/AccountBootstrap';
import type { OperatorAccount } from '../auth/AccountTypes';
import { saveDraftRecord } from './RecordRepository';

export const fixedNow = '2026-06-04T10:00:00.000Z';
export const laterNow = '2026-06-04T10:05:00.000Z';

export const openStartedDatabase = () => {
  const connection = openNodeSqliteConnection(':memory:');
  runDatabaseStartupChecks(connection, { nowIso: () => fixedNow });
  return connection;
};

export const getDefaultFormat = (db: SqliteConnection) =>
  resolveDocumentFormatSelection({ formatId: 'TaxInvoice' }, listStoredDocumentFormats(db)).format;

export const sampleLineItems = () => ({
  Items: [
    {
      RowId: 'Row_01',
      DisplayOrder: 1,
      Values: {
        ItemName: 'Sample Item',
        Quantity: '2.000',
        Rate: '500.0000',
        Amount: '1000.00',
      },
    },
  ],
});

export const getSampleAccount = (index: number): OperatorAccount => {
  const account = bootstrapOperatorAccounts[index];

  if (!account) {
    throw new Error('Expected sample account.');
  }

  return account;
};

export const createOtherUser = (): OperatorAccount => ({
  userId: 'user_2',
  username: 'second-user',
  displayName: 'Second User',
  role: 'User',
  isActive: true,
});

export const createDraft = (db: SqliteConnection, recordId = 'Record_01') =>
  saveDraftRecord(db, {
    recordId,
    format: getDefaultFormat(db),
    values: {
      InvoiceDate: '2026-06-04',
      CustomerName: 'Sample Customer',
      GrandTotal: '1180.00',
    },
    lineItemSections: sampleLineItems(),
    operatorContext: createOperatorContext(getSampleAccount(2)),
    nowIso: fixedNow,
    recordIdFactory: () => recordId,
  });
