/* eslint-disable max-lines */
import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FC, KeyboardEvent } from 'react';

import { useCapabilities } from '../../capability/CapabilityContext';
import { ActionBar, type RecordActionState } from '../../components/ActionBar';
import { AppConfirmDialog } from '../../components/AppConfirmDialog/AppConfirmDialog';
import { AppDatePicker } from '../../components/AppDatePicker/AppDatePicker';
import { AppModal } from '../../components/AppModal/AppModal';
import { HorizontalProgress } from '../../components/HorizontalProgress/HorizontalProgress';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import { documentFormatSummaries } from '../../constants/PhaseFourFormats';
import { useSession } from '../auth/SessionContext';
import { RecordCollection } from './RecordCollection';
import {
  type AppRecord,
  type EditableRecord,
  type RecordLineItem,
  useRecordStore,
} from './RecordStoreContext';

const emptyLineItem = (): RecordLineItem => ({
  rowId: crypto.randomUUID(),
  itemName: '',
  hsnSac: '',
  quantity: '1',
  rate: '',
  taxPercent: '18',
  amount: '0.00',
});

const calculateItemAmount = (item: RecordLineItem): string => {
  const quantity = Number.parseFloat(item.quantity) || 0;
  const rate = Number.parseFloat(item.rate) || 0;
  const tax = Number.parseFloat(item.taxPercent) || 0;
  return (quantity * rate * (1 + tax / 100)).toFixed(2);
};

const createEmptyRecord = (): EditableRecord => ({
  recordId: crypto.randomUUID(),
  formatId: 'TaxInvoice',
  formatName: 'GST Invoice',
  invoiceDate: new Date().toISOString().slice(0, 10),
  customerName: '',
  gstin: '',
  state: '',
  billingAddress: '',
  lineItems: [emptyLineItem()],
  grandTotal: '0.00',
});

const toEditableRecord = (record: AppRecord): EditableRecord => ({
  recordId: record.recordId,
  formatId: record.formatId,
  formatName: record.formatName,
  invoiceDate: record.invoiceDate,
  customerName: record.customerName,
  gstin: record.gstin,
  state: record.state,
  billingAddress: record.billingAddress,
  lineItems: record.lineItems,
  grandTotal: record.grandTotal,
});

export const RecordsPage: FC = () => {
  const capabilities = useCapabilities();
  const { operatorContext } = useSession();
  const { cancelRecord, error, finalizeRecord, isLoading, records, saveDraft } = useRecordStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const formRef = useRef<HTMLDivElement>(null);
  const [record, setRecord] = useState<EditableRecord>(createEmptyRecord);
  const [actionState, setActionState] = useState<RecordActionState>('New');
  const [notice, setNotice] = useState('');
  const [operationError, setOperationError] = useState('');
  const [isFinalizeOpen, setIsFinalizeOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const activeTab = searchParams.get('tab') === 'reprint' ? 'reprint' : 'create';
  const selectedStoredRecord = records.find((item) => item.recordId === record.recordId);
  const isReadOnly = actionState === 'Finalized' || actionState === 'Reprint';
  const formatOptions = (
    capabilities.isDemoMode ? documentFormatSummaries.slice(0, 1) : documentFormatSummaries
  ).map((format) => ({
    value: format.formatId,
    label: format.formatName,
    description: format.description,
  }));
  const reprintRecords = records.filter((item) => {
    const isPrintable = item.status === 'Finalized' || item.status === 'Cancelled';
    const query = searchQuery.trim().toLocaleLowerCase();
    return (
      isPrintable &&
      (!query ||
        item.customerName.toLocaleLowerCase().includes(query) ||
        item.documentNumber?.toLocaleLowerCase().includes(query))
    );
  });
  const outputTarget = window.localStorage.getItem('vaultbill.output-target') ?? 'PreviewOnly';
  const printLabel = outputTarget === 'DownloadPdf' ? 'Print / PDF' : 'Print';
  const showShortcuts =
    !window.matchMedia('(pointer: coarse)').matches &&
    (capabilities.isDesktop || capabilities.isLanBrowser || capabilities.isDemoMode);

  const markChanged = (nextRecord: EditableRecord) => {
    setRecord(nextRecord);
    setNotice('');
    setOperationError('');
    setActionState((current) => (current === 'DraftSaved' ? 'DraftDirty' : current));
  };

  const updateLineItem = (rowId: string, changes: Partial<RecordLineItem>) => {
    const lineItems = record.lineItems.map((item) => {
      if (item.rowId !== rowId) return item;
      const nextItem = { ...item, ...changes };
      return { ...nextItem, amount: calculateItemAmount(nextItem) };
    });
    const grandTotal = lineItems
      .reduce((total, item) => total + (Number.parseFloat(item.amount) || 0), 0)
      .toFixed(2);
    markChanged({ ...record, lineItems, grandTotal });
  };

  const focusAction = (actionId: string) => {
    window.setTimeout(() => {
      document.querySelector<HTMLButtonElement>(`[data-action-id="${actionId}"]`)?.focus();
    }, 0);
  };

  const printCurrentRecord = (kind: 'Draft Print' | 'Print' | 'Reprint') => {
    setNotice(`${kind} opened using the configured ${outputTarget} output profile.`);
    window.print();
    focusAction(
      kind === 'Draft Print' ? 'finalize' : actionState === 'Reprint' ? 'reprint' : 'print',
    );
  };

  const runAction = (actionId: string) => {
    if (!operatorContext) return;

    setOperationError('');
    if (actionId === 'draft') {
      if (!record.customerName.trim()) {
        setOperationError('Customer name is required before saving a Draft.');
        return;
      }
      void saveDraft(record, operatorContext)
        .then((saved) => {
          setRecord(toEditableRecord(saved));
          setActionState('DraftSaved');
          setNotice('Draft saved. Draft Print and Finalize are now available.');
          focusAction('draft-print');
        })
        .catch((reason: unknown) => {
          setOperationError(reason instanceof Error ? reason.message : 'Draft could not be saved.');
        });
      return;
    }
    if (actionId === 'draft-print') {
      printCurrentRecord('Draft Print');
      return;
    }
    if (actionId === 'finalize') {
      setIsFinalizeOpen(true);
      return;
    }
    printCurrentRecord(actionId === 'reprint' ? 'Reprint' : 'Print');
  };

  const handleEntryNavigation = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      event.key !== 'Enter' ||
      event.currentTarget !== formRef.current ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLButtonElement
    ) {
      return;
    }

    const form = event.currentTarget;
    const focusable = [
      ...form.querySelectorAll<HTMLElement>(
        'input:not(:disabled):not([readonly]), textarea:not(:disabled):not([readonly]), button:not(:disabled)',
      ),
      ...document.querySelectorAll<HTMLElement>('.action-bar button:not(:disabled)'),
    ];
    const currentIndex = focusable.indexOf(event.target as HTMLElement);
    if (focusable.length === 0 || currentIndex < 0) return;
    const direction = event.shiftKey ? -1 : 1;
    const nextIndex = (currentIndex + direction + focusable.length) % focusable.length;
    event.preventDefault();
    focusable[nextIndex]?.focus();
  };

  const selectReprintRecord = (selected: AppRecord) => {
    setRecord(toEditableRecord(selected));
    setActionState('Reprint');
    setNotice('');
    setOperationError('');
  };

  return (
    <div className="page-stack records-page">
      <div className="operational-header">
        <div>
          <p className="eyebrow">Records</p>
          <h1>{activeTab === 'create' ? 'Create GST Invoice' : 'Find and reprint records'}</h1>
        </div>
        {activeTab === 'create' ? (
          <SearchableDropdown
            label="Format"
            onChange={(formatId) => {
              const format = documentFormatSummaries.find((item) => item.formatId === formatId);
              if (format) {
                markChanged({ ...record, formatId, formatName: format.formatName });
              }
            }}
            options={formatOptions}
            value={record.formatId}
          />
        ) : null}
      </div>
      <HorizontalProgress className="page-tabs records-tabs" label="Record tabs">
        {(['create', 'reprint'] as const).map((tab) => (
          <button
            aria-pressed={activeTab === tab}
            key={tab}
            onClick={() => {
              setSearchParams({ tab });
              setActionState(tab === 'create' ? 'New' : 'Reprint');
              if (tab === 'create') setRecord(createEmptyRecord());
            }}
            type="button"
          >
            {tab === 'create' ? 'Create' : 'Reprint'}
          </button>
        ))}
      </HorizontalProgress>

      {activeTab === 'reprint' && !selectedStoredRecord ? (
        <section className="data-panel">
          <label className="record-search">
            <span>Search finalized records</span>
            <input
              autoFocus
              onChange={(event) => {
                setSearchQuery(event.currentTarget.value);
              }}
              placeholder="Document number or customer"
              value={searchQuery}
            />
          </label>
          <RecordCollection
            error={error}
            isLoading={isLoading}
            onSelect={selectReprintRecord}
            records={reprintRecords}
          />
        </section>
      ) : (
        <section className="record-workspace">
          {activeTab === 'reprint' ? (
            <button
              className="record-back-button"
              onClick={() => {
                setRecord(createEmptyRecord());
                setActionState('Reprint');
              }}
              type="button"
            >
              ← Back to record search
            </button>
          ) : null}
          <div className="record-workspace__form" onKeyDown={handleEntryNavigation} ref={formRef}>
            <div className="record-status-row">
              <span className="status-pill">
                {actionState === 'New' || actionState === 'DraftDirty'
                  ? 'Unsaved'
                  : (selectedStoredRecord?.status ?? actionState)}
              </span>
              {selectedStoredRecord?.documentNumber ? (
                <strong>{selectedStoredRecord.documentNumber}</strong>
              ) : null}
            </div>
            <div className="form-grid">
              <AppDatePicker
                disabled={isReadOnly}
                label="Invoice date"
                onChange={(invoiceDate) => {
                  markChanged({ ...record, invoiceDate });
                }}
                value={record.invoiceDate}
              />
              <label>
                <span>Customer name</span>
                <input
                  disabled={isReadOnly}
                  onChange={(event) => {
                    markChanged({ ...record, customerName: event.currentTarget.value });
                  }}
                  placeholder="Business or customer name"
                  readOnly={isReadOnly}
                  value={record.customerName}
                />
              </label>
              <label>
                <span>GSTIN</span>
                <input
                  disabled={isReadOnly}
                  onChange={(event) => {
                    markChanged({ ...record, gstin: event.currentTarget.value });
                  }}
                  placeholder="Optional GST number"
                  readOnly={isReadOnly}
                  value={record.gstin}
                />
              </label>
              <label>
                <span>State</span>
                <input
                  disabled={isReadOnly}
                  onChange={(event) => {
                    markChanged({ ...record, state: event.currentTarget.value });
                  }}
                  placeholder="State"
                  readOnly={isReadOnly}
                  value={record.state}
                />
              </label>
              <label className="span-2">
                <span>Billing address</span>
                <textarea
                  disabled={isReadOnly}
                  onChange={(event) => {
                    markChanged({ ...record, billingAddress: event.currentTarget.value });
                  }}
                  placeholder="Address shown on the document"
                  readOnly={isReadOnly}
                  value={record.billingAddress}
                />
              </label>
            </div>
            <HorizontalProgress className="line-item-grid" label="Line item columns">
              <div className="line-item-grid__row line-item-grid__header">
                <span>Item</span>
                <span>HSN/SAC</span>
                <span>Qty</span>
                <span>Rate</span>
                <span>Tax</span>
                <span>Amount</span>
              </div>
              {record.lineItems.map((item) => (
                <div className="line-item-grid__row" key={item.rowId}>
                  <input
                    aria-label="Item name"
                    disabled={isReadOnly}
                    onChange={(event) => {
                      updateLineItem(item.rowId, { itemName: event.currentTarget.value });
                    }}
                    placeholder="Item or service"
                    readOnly={isReadOnly}
                    value={item.itemName}
                  />
                  <input
                    aria-label="HSN or SAC"
                    disabled={isReadOnly}
                    onChange={(event) => {
                      updateLineItem(item.rowId, { hsnSac: event.currentTarget.value });
                    }}
                    readOnly={isReadOnly}
                    value={item.hsnSac}
                  />
                  <input
                    aria-label="Quantity"
                    disabled={isReadOnly}
                    inputMode="decimal"
                    onChange={(event) => {
                      updateLineItem(item.rowId, { quantity: event.currentTarget.value });
                    }}
                    readOnly={isReadOnly}
                    value={item.quantity}
                  />
                  <input
                    aria-label="Rate"
                    disabled={isReadOnly}
                    inputMode="decimal"
                    onChange={(event) => {
                      updateLineItem(item.rowId, { rate: event.currentTarget.value });
                    }}
                    readOnly={isReadOnly}
                    value={item.rate}
                  />
                  <input
                    aria-label="Tax"
                    disabled={isReadOnly}
                    inputMode="decimal"
                    onChange={(event) => {
                      updateLineItem(item.rowId, { taxPercent: event.currentTarget.value });
                    }}
                    readOnly={isReadOnly}
                    value={item.taxPercent}
                  />
                  <output aria-label="Amount">₹{item.amount}</output>
                </div>
              ))}
            </HorizontalProgress>
            {!isReadOnly ? (
              <button
                onClick={() => {
                  markChanged({ ...record, lineItems: [...record.lineItems, emptyLineItem()] });
                }}
                type="button"
              >
                Add line item
              </button>
            ) : null}
            <div className="record-total">
              <span>Grand total</span>
              <strong>₹{record.grandTotal}</strong>
            </div>
          </div>
          {operationError ? <p className="feedback-error">{operationError}</p> : null}
          {notice ? (
            <p className="feedback-success" role="status">
              {notice}
            </p>
          ) : null}
          {activeTab === 'reprint' &&
          selectedStoredRecord?.status === 'Finalized' &&
          operatorContext?.role !== 'User' ? (
            <button
              className="button-danger"
              onClick={() => {
                setIsCancelOpen(true);
              }}
              type="button"
            >
              Cancel finalized record
            </button>
          ) : null}
          <ActionBar
            onAction={runAction}
            printLabel={printLabel}
            showShortcuts={showShortcuts}
            state={activeTab === 'reprint' ? 'Reprint' : actionState}
          />
        </section>
      )}

      <AppConfirmDialog
        confirmLabel="Finalize"
        description="VaultBill will allocate the next document number and lock this record for editing."
        isOpen={isFinalizeOpen}
        onCancel={() => {
          setIsFinalizeOpen(false);
        }}
        onConfirm={() => {
          if (!operatorContext) return;
          void finalizeRecord(record, operatorContext)
            .then((finalized) => {
              setRecord(toEditableRecord(finalized));
              setActionState('Finalized');
              setNotice(`Document ${finalized.documentNumber ?? ''} finalized successfully.`);
              setIsFinalizeOpen(false);
              focusAction('print');
            })
            .catch((reason: unknown) => {
              setOperationError(
                reason instanceof Error ? reason.message : 'Document could not be finalized.',
              );
              setIsFinalizeOpen(false);
            });
        }}
        title="Finalize this document?"
      />
      <AppModal
        isOpen={isCancelOpen}
        onClose={() => {
          setIsCancelOpen(false);
        }}
        title="Cancel finalized record"
      >
        <label>
          <span>Cancellation reason</span>
          <textarea
            onChange={(event) => {
              setCancelReason(event.currentTarget.value);
            }}
            placeholder="Required audit reason"
            value={cancelReason}
          />
        </label>
        <div className="popup-actions">
          <button
            onClick={() => {
              setIsCancelOpen(false);
            }}
            type="button"
          >
            Keep record
          </button>
          <button
            className="button-danger"
            disabled={!cancelReason.trim()}
            onClick={() => {
              if (!operatorContext) return;
              void cancelRecord(record.recordId, cancelReason, operatorContext)
                .then((cancelled) => {
                  setRecord(toEditableRecord(cancelled));
                  setNotice('Record cancelled. It remains available for audit and reprint.');
                  setIsCancelOpen(false);
                })
                .catch((reason: unknown) => {
                  setOperationError(
                    reason instanceof Error ? reason.message : 'Record could not be cancelled.',
                  );
                  setIsCancelOpen(false);
                });
            }}
            type="button"
          >
            Cancel record
          </button>
        </div>
      </AppModal>
    </div>
  );
};
