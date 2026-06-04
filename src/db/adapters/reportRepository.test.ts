import { afterEach, describe, expect, it } from 'vitest';

import type { ReportConfig } from '../../engines/reportEngine/ReportTypes';
import type { SqliteConnection } from '../sqlite/SqliteConnection';
import { runDatabaseStartupChecks } from '../startup/DatabaseStartup';
import { listReports, loadReport, saveReport } from './reportRepository';
import { openNodeSqliteConnection } from './sqliteAdapter';

let connection: SqliteConnection | undefined;

const fixedNow = '2026-06-04T10:00:00.000Z';

const reportConfig: ReportConfig = {
  ReportId: 'SalesSummary',
  ReportName: 'Sales Summary',
  Source: 'Records',
  FormatIds: ['TaxInvoice'],
  Filters: [],
  Columns: [
    {
      ColumnId: 'CustomerName',
      Label: 'Customer',
      SourceField: 'CustomerName',
    },
  ],
  PrintTemplates: [{ TemplateId: 'SalesSummaryA4', IsDefault: true }],
};

const openStartedDatabase = () => {
  connection = openNodeSqliteConnection(':memory:');
  runDatabaseStartupChecks(connection, { nowIso: () => fixedNow });
  return connection;
};

afterEach(() => {
  connection?.close();
  connection = undefined;
});

describe('reportRepository', () => {
  it('stores and loads JSON report configurations', () => {
    const db = openStartedDatabase();

    saveReport(db, {
      reportId: 'SalesSummary',
      reportName: 'Sales Summary',
      reportConfig,
      updatedAt: fixedNow,
    });

    expect(loadReport(db, 'SalesSummary')).toMatchObject({
      reportId: 'SalesSummary',
      reportName: 'Sales Summary',
      reportConfig,
    });
    expect(listReports(db)).toHaveLength(1);
  });

  it('rejects mismatched report metadata', () => {
    const db = openStartedDatabase();

    expect(() => {
      saveReport(db, {
        reportId: 'OtherReport',
        reportName: 'Other Report',
        reportConfig,
        updatedAt: fixedNow,
      });
    }).toThrow('Report metadata must match report JSON.');
  });
});
