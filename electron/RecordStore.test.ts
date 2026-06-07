// @vitest-environment node

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { DesktopRecordStore } from './RecordStore.js';

let directory = '';
let store: DesktopRecordStore | undefined;

afterEach(() => {
  store?.close();
  store = undefined;
  if (directory) rmSync(directory, { recursive: true, force: true });
});

describe('DesktopRecordStore report queries', () => {
  it('combines filters and returns deterministic cursor pages', () => {
    directory = mkdtempSync(path.join(tmpdir(), 'vaultbill-report-query-'));
    store = new DesktopRecordStore(path.join(directory, 'vaultbill.sqlite'));
    createFinalizedRecord(store, 'record-b', 'Aster Works', '2026-06-02');
    createFinalizedRecord(store, 'record-a', 'Aster Works', '2026-06-02');
    createFinalizedRecord(store, 'record-c', 'Blue River', '2026-06-03');

    const first = store.queryReport({
      reportId: 'sales-register',
      customer: 'aster',
      status: 'Finalized',
      limit: 1,
    });
    expect(first.total).toBe(2);
    expect(first.rows).toHaveLength(1);
    expect(first.nextCursor).toBe('1');

    const second = store.queryReport({
      reportId: 'sales-register',
      customer: 'aster',
      status: 'Finalized',
      cursor: first.nextCursor,
      limit: 1,
    });
    expect(second.rows).toHaveLength(1);
    expect(second.rows[0]?.recordId).not.toBe(first.rows[0]?.recordId);
    expect(second.nextCursor).toBeUndefined();
  });
});

const createFinalizedRecord = (
  store: DesktopRecordStore,
  recordId: string,
  customerName: string,
  invoiceDate: string,
) => {
  const request = {
    record: {
      recordId,
      formatId: 'TaxInvoice',
      formatName: 'GST Invoice',
      invoiceDate,
      customerName,
      gstin: '',
      state: '',
      billingAddress: '',
      lineItems: [],
      grandTotal: '100.00',
    },
    operatorContext: {
      account: {
        userId: 'admin_1',
        username: 'admin',
        displayName: 'Operations Admin',
        role: 'Admin' as const,
        isActive: true,
      },
      role: 'Admin' as const,
      CreatedBy: 'admin_1',
      CreatedByName: 'Operations Admin',
      LastActionBy: 'admin_1',
      LastActionByName: 'Operations Admin',
    },
  };
  store.saveDraft(request);
  store.finalize(request);
};
