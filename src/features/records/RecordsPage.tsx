/**
 * eslint-disable max-lines
 *
 * @format
 */

import { useEffect, useMemo, useRef, useState } from 'react';
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
import { builtInDefaultFormat } from '../../db/startup/BuiltInDefaultFormat';
import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
import { evaluateFormula } from '../../engines/formulaEngine/FormulaEngine';
import { requestHostedApi } from '../../runtime/HostedApi';
import { useSession } from '../auth/SessionContext';
import { RecordCollection } from './RecordCollection';
import {
    loadRecordPrintPackage,
    renderRecordHtml,
    type RecordPrintPackage,
} from './RecordPrintHtml';
import {
    type AppRecord,
    type EditableRecord,
    type RecordLineItem,
    useRecordStore,
} from './RecordStoreContext';
import { calculateRecordTotals } from './RecordTotals';

const emptyLineItem = (): RecordLineItem => ({
    rowId: crypto.randomUUID(),
    itemName: '',
    hsnSac: '',
    quantity: '1',
    rate: '',
    taxPercent: '18',
    amount: '0.00',
    values: {},
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
    fieldValues: {},
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
    fieldValues: record.fieldValues ?? {},
});

type OutputTask = {
    readonly jobId: string;
    readonly title: string;
    readonly completed: number;
    readonly total: number;
    readonly message: string;
    readonly state: 'Running' | 'Complete' | 'Failed' | 'Cancelled';
};

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
    const [outputTask, setOutputTask] = useState<OutputTask>();
    const [activePrintPackage, setActivePrintPackage] = useState<RecordPrintPackage>();
    const [publishedFormats, setPublishedFormats] = useState<
        readonly { readonly formatId: string; readonly formatName: string }[]
    >([]);
    const activeTab = searchParams.get('tab') === 'reprint' ? 'reprint' : 'create';
    const selectedStoredRecord = records.find((item) => item.recordId === record.recordId);
    const isReadOnly = actionState === 'Finalized' || actionState === 'Reprint';
    const formatOptions = (
        publishedFormats.length > 0
            ? publishedFormats
            : capabilities.isDemoMode
              ? documentFormatSummaries.slice(0, 1)
              : documentFormatSummaries
    ).map((format) => ({
        value: format.formatId,
        label: format.formatName,
    }));
    const activeConfig = activePrintPackage?.config ?? builtInDefaultFormat;
    const recordTotals = useMemo(() => calculateRecordTotals(record), [record]);
    const configuredDocumentFields = useMemo(
        () =>
            activeConfig.Fields.filter(
                (field) => !knownDocumentFields.has(normalizeId(field.FieldId)),
            ),
        [activeConfig],
    );
    const configuredLineFields = useMemo(
        () =>
            (activeConfig.LineItemSections[0]?.Fields ?? []).filter(
                (field) => !knownLineFields.has(normalizeId(field.FieldId)),
            ),
        [activeConfig],
    );
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
    const preferredPrinterName = window.localStorage.getItem('vaultbill.preferred-printer') ?? '';
    const printLabel = outputTarget === 'DownloadPdf' ? 'Print / PDF' : 'Print';
    const showShortcuts =
        !window.matchMedia('(pointer: coarse)').matches &&
        (capabilities.isDesktop || capabilities.isLanBrowser || capabilities.isDemoMode);

    useEffect(() => {
        const inventory = window.vaultBillDesktop
            ? window.vaultBillDesktop.listBuilderInventory()
            : capabilities.isLanBrowser
              ? requestHostedApi<
                    readonly { readonly formatId: string; readonly formatName: string }[]
                >('/print/formats')
              : undefined;
        void inventory
            ?.then((formats) => {
                setPublishedFormats(formats);
            })
            .catch(() => {
                setPublishedFormats([]);
            });
    }, [capabilities.isLanBrowser]);

    useEffect(() => {
        setActivePrintPackage(undefined);
        void loadRecordPrintPackage(record.formatId, capabilities.isLanBrowser)
            .then(setActivePrintPackage)
            .catch(() => {
                setActivePrintPackage(undefined);
            });
    }, [capabilities.isLanBrowser, record.formatId]);

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
            const calculated = calculateConfiguredLineItem(
                { ...nextItem, amount: calculateItemAmount(nextItem) },
                activePrintPackage?.config,
            );
            return calculated;
        });
        const grandTotal = lineItems
            .reduce((total, item) => total + (Number.parseFloat(item.amount) || 0), 0)
            .toFixed(2);
        markChanged(
            applyDocumentCalculations(
                { ...record, lineItems, grandTotal },
                activePrintPackage?.config,
            ),
        );
    };

    const focusAction = (actionId: string) => {
        window.setTimeout(() => {
            document.querySelector<HTMLButtonElement>(`[data-action-id="${actionId}"]`)?.focus();
        }, 0);
    };

    const printCurrentRecord = (kind: 'Draft Print' | 'Print' | 'Reprint') => {
        const jobId = crypto.randomUUID();
        const title = `${kind} document`;
        setOutputTask({
            jobId,
            title,
            completed: 0,
            total: 1,
            message: 'Preparing the document and output device.',
            state: 'Running',
        });
        const runOutput = async () => {
            const printPackage = await loadRecordPrintPackage(
                record.formatId,
                capabilities.isLanBrowser,
            ).catch(() => undefined);
            const html = renderRecordHtml(record, selectedStoredRecord, printPackage);
            if (window.vaultBillDesktop && outputTarget === 'DownloadPdf') {
                const result = await window.vaultBillDesktop.downloadPdf({
                    html,
                    fileName: selectedStoredRecord?.documentNumber ?? 'vaultbill-draft',
                    jobId,
                });
                if (!result.success || !result.pdfData) {
                    throw new Error(result.warning ?? 'PDF generation failed.');
                }
                downloadBytes(result.pdfData, result.fileName, 'application/pdf');
                return;
            }
            if (window.vaultBillDesktop) {
                const result = await window.vaultBillDesktop.printHtml({
                    html,
                    jobId,
                    ...(preferredPrinterName ? { printerName: preferredPrinterName } : {}),
                });
                if (!result.success) throw new Error(result.warning ?? 'Printing failed.');
                return;
            }
            if (capabilities.isLanBrowser) {
                const result = await requestHostedApi<{ success: boolean; warning?: string }>(
                    '/print/html',
                    'POST',
                    { html, jobId },
                );
                if (!result.success) throw new Error(result.warning ?? 'Host printing failed.');
                return;
            }
            window.print();
        };
        void runOutput()
            .then(() => {
                setOutputTask({
                    jobId,
                    title,
                    completed: 1,
                    total: 1,
                    message: `${kind} completed successfully.`,
                    state: 'Complete',
                });
                setNotice(`${kind} completed using the configured ${outputTarget} output profile.`);
                focusAction(
                    kind === 'Draft Print'
                        ? 'finalize'
                        : actionState === 'Reprint'
                          ? 'reprint'
                          : 'print',
                );
            })
            .catch((reason: unknown) => {
                setOutputTask({
                    jobId,
                    title,
                    completed: 0,
                    total: 1,
                    message: reason instanceof Error ? reason.message : 'Output failed.',
                    state: 'Failed',
                });
            });
    };

    const runAction = (actionId: string) => {
        if (!operatorContext) return;

        setOperationError('');
        if (actionId === 'draft') {
            if (!record.customerName.trim()) {
                setOperationError('Customer name is required before saving a Draft.');
                return;
            }
            const missingField = firstMissingRequiredField(record, activeConfig);
            if (missingField) {
                setOperationError(`${missingField} is required before saving a Draft.`);
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
                    setOperationError(
                        reason instanceof Error ? reason.message : 'Draft could not be saved.',
                    );
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
                    <h1>
                        {activeTab === 'create'
                            ? `Create ${record.formatName}`
                            : 'Find and reprint records'}
                    </h1>
                </div>
                {activeTab === 'create' ? (
                    <SearchableDropdown
                        label="Format"
                        onChange={(formatId) => {
                            const format = formatOptions.find((item) => item.value === formatId);
                            if (format) {
                                markChanged({
                                    ...record,
                                    formatId,
                                    formatName: format.label,
                                    fieldValues: {},
                                    lineItems: [emptyLineItem()],
                                    grandTotal: '0.00',
                                });
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
                    <div
                        className="record-workspace__form"
                        onKeyDown={handleEntryNavigation}
                        ref={formRef}
                    >
                        {actionState !== 'New' && actionState !== 'DraftDirty' ? (
                            <div className="record-status-row">
                                <span className="status-pill">
                                    {actionState === 'DraftSaved'
                                        ? 'Draft'
                                        : (selectedStoredRecord?.status ?? actionState)}
                                </span>
                                {selectedStoredRecord?.documentNumber ? (
                                    <strong>{selectedStoredRecord.documentNumber}</strong>
                                ) : null}
                            </div>
                        ) : null}
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
                                        markChanged({
                                            ...record,
                                            customerName: event.currentTarget.value,
                                        });
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
                                        markChanged({
                                            ...record,
                                            gstin: event.currentTarget.value,
                                        });
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
                                        markChanged({
                                            ...record,
                                            state: event.currentTarget.value,
                                        });
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
                                        markChanged({
                                            ...record,
                                            billingAddress: event.currentTarget.value,
                                        });
                                    }}
                                    placeholder="Address shown on the document"
                                    readOnly={isReadOnly}
                                    value={record.billingAddress}
                                />
                            </label>
                            {configuredDocumentFields.map((field) => (
                                <ConfiguredField
                                    disabled={isReadOnly}
                                    field={field}
                                    key={field.FieldId}
                                    onChange={(value) => {
                                        markChanged(
                                            applyDocumentCalculations(
                                                {
                                                    ...record,
                                                    fieldValues: {
                                                        ...(record.fieldValues ?? {}),
                                                        [field.FieldId]: value,
                                                    },
                                                },
                                                activePrintPackage?.config,
                                            ),
                                        );
                                    }}
                                    value={
                                        record.fieldValues?.[field.FieldId] ??
                                        defaultFieldValue(field)
                                    }
                                />
                            ))}
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
                                <div className="line-item-grid__item" key={item.rowId}>
                                    <div className="line-item-grid__row">
                                        <input
                                            aria-label="Item name"
                                            disabled={isReadOnly}
                                            onChange={(event) => {
                                                updateLineItem(item.rowId, {
                                                    itemName: event.currentTarget.value,
                                                });
                                            }}
                                            placeholder="Item or service"
                                            readOnly={isReadOnly}
                                            value={item.itemName}
                                        />
                                        <input
                                            aria-label="HSN or SAC"
                                            disabled={isReadOnly}
                                            onChange={(event) => {
                                                updateLineItem(item.rowId, {
                                                    hsnSac: event.currentTarget.value,
                                                });
                                            }}
                                            readOnly={isReadOnly}
                                            value={item.hsnSac}
                                        />
                                        <input
                                            aria-label="Quantity"
                                            disabled={isReadOnly}
                                            inputMode="decimal"
                                            onChange={(event) => {
                                                updateLineItem(item.rowId, {
                                                    quantity: event.currentTarget.value,
                                                });
                                            }}
                                            readOnly={isReadOnly}
                                            value={item.quantity}
                                        />
                                        <input
                                            aria-label="Rate"
                                            disabled={isReadOnly}
                                            inputMode="decimal"
                                            onChange={(event) => {
                                                updateLineItem(item.rowId, {
                                                    rate: event.currentTarget.value,
                                                });
                                            }}
                                            readOnly={isReadOnly}
                                            value={item.rate}
                                        />
                                        <input
                                            aria-label="Tax"
                                            disabled={isReadOnly}
                                            inputMode="decimal"
                                            onChange={(event) => {
                                                updateLineItem(item.rowId, {
                                                    taxPercent: event.currentTarget.value,
                                                });
                                            }}
                                            readOnly={isReadOnly}
                                            value={item.taxPercent}
                                        />
                                        <output aria-label="Amount">₹{item.amount}</output>
                                    </div>
                                    {configuredLineFields.length > 0 ? (
                                        <div className="line-item-grid__custom">
                                            {configuredLineFields.map((field) => (
                                                <ConfiguredField
                                                    disabled={isReadOnly || Boolean(field.ReadOnly)}
                                                    field={field}
                                                    key={field.FieldId}
                                                    onChange={(value) => {
                                                        updateLineItem(item.rowId, {
                                                            values: {
                                                                ...(item.values ?? {}),
                                                                [field.FieldId]: value,
                                                            },
                                                        });
                                                    }}
                                                    value={
                                                        item.values?.[field.FieldId] ??
                                                        defaultFieldValue(field)
                                                    }
                                                />
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                        </HorizontalProgress>
                        {!isReadOnly ? (
                            <button
                                onClick={() => {
                                    markChanged({
                                        ...record,
                                        lineItems: [...record.lineItems, emptyLineItem()],
                                    });
                                }}
                                type="button"
                            >
                                Add line item
                            </button>
                        ) : null}
                        <div className="record-summary" aria-label="Record totals">
                            <div>
                                <span>Subtotal</span>
                                <strong>₹{recordTotals.subtotal}</strong>
                            </div>
                            <div>
                                <span>GST / tax</span>
                                <strong>₹{recordTotals.taxTotal}</strong>
                            </div>
                            <div>
                                <span>Round off</span>
                                <strong>₹{recordTotals.roundOff}</strong>
                            </div>
                            <div className="record-summary__grand">
                                <span>Grand total</span>
                                <strong>₹{recordTotals.grandTotal}</strong>
                            </div>
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
                    <p className="sr-only" id="record-action-status" role="status" />
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
                            setNotice(
                                `Document ${finalized.documentNumber ?? ''} finalized successfully.`,
                            );
                            setIsFinalizeOpen(false);
                            focusAction('print');
                        })
                        .catch((reason: unknown) => {
                            setOperationError(
                                reason instanceof Error
                                    ? reason.message
                                    : 'Document could not be finalized.',
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
                                    setNotice(
                                        'Record cancelled. It remains available for audit and reprint.',
                                    );
                                    setIsCancelOpen(false);
                                })
                                .catch((reason: unknown) => {
                                    setOperationError(
                                        reason instanceof Error
                                            ? reason.message
                                            : 'Record could not be cancelled.',
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
            <AppModal
                isOpen={Boolean(outputTask)}
                onClose={() => {
                    if (outputTask?.state !== 'Running') setOutputTask(undefined);
                }}
                title={outputTask?.title ?? 'Document output'}
            >
                {outputTask ? (
                    <div className="print-progress">
                        <div>
                            <strong>{outputTask.message}</strong>
                            <span>{outputTask.completed === outputTask.total ? '100%' : '0%'}</span>
                        </div>
                        <progress max={outputTask.total} value={outputTask.completed} />
                        <div className="popup-actions">
                            <button
                                onClick={() => {
                                    if (outputTask.state !== 'Running') {
                                        setOutputTask(undefined);
                                        return;
                                    }
                                    const cancel = window.vaultBillDesktop
                                        ? window.vaultBillDesktop.cancelOutput(outputTask.jobId)
                                        : capabilities.isLanBrowser
                                          ? requestHostedApi('/print/cancel', 'POST', {
                                                jobId: outputTask.jobId,
                                            })
                                          : Promise.resolve(false);
                                    void cancel.finally(() => {
                                        setOutputTask({
                                            ...outputTask,
                                            message: 'Output cancelled before completion.',
                                            state: 'Cancelled',
                                        });
                                    });
                                }}
                                type="button"
                            >
                                {outputTask.state === 'Running' ? 'Cancel output' : 'Close'}
                            </button>
                        </div>
                    </div>
                ) : null}
            </AppModal>
        </div>
    );
};

type ConfiguredFieldDefinition = DocumentFormatConfig['Fields'][number];

const knownDocumentFields = new Set([
    'invoicedate',
    'customername',
    'customergstin',
    'gstin',
    'state',
    'billingaddress',
    'grandtotal',
]);
const knownLineFields = new Set(['itemname', 'hsnsac', 'quantity', 'rate', 'taxpercent', 'amount']);
const normalizeId = (value: string): string => value.replaceAll(/[^a-z0-9]/giu, '').toLowerCase();

const ConfiguredField: FC<{
    readonly disabled: boolean;
    readonly field: ConfiguredFieldDefinition;
    readonly onChange: (value: string) => void;
    readonly value: string;
}> = ({ disabled, field, onChange, value }) => {
    if (field.Visible === false) return null;
    if (field.Type === 'Checkbox') {
        return (
            <label className="checkbox-field">
                <input
                    checked={value === 'true'}
                    disabled={disabled}
                    onChange={(event) => {
                        onChange(String(event.currentTarget.checked));
                    }}
                    type="checkbox"
                />
                <span>
                    {field.Label}
                    {field.Required ? ' *' : ''}
                </span>
            </label>
        );
    }
    const common = {
        disabled,
        maxLength: field.MaxLength,
        placeholder: field.Placeholder,
        readOnly: disabled || field.ReadOnly === true || field.Calculated === true,
        required: field.Required,
        value,
    };
    return (
        <label>
            <span>
                {field.Label}
                {field.Required ? ' *' : ''}
            </span>
            {field.Type === 'Textarea' ? (
                <textarea
                    {...common}
                    onChange={(event) => {
                        onChange(event.currentTarget.value);
                    }}
                />
            ) : (
                <input
                    {...common}
                    inputMode={isNumericField(field) ? 'decimal' : undefined}
                    onChange={(event) => {
                        onChange(event.currentTarget.value);
                    }}
                    type={
                        field.Type === 'Date'
                            ? 'date'
                            : field.Type === 'DateTime'
                              ? 'datetime-local'
                              : 'text'
                    }
                />
            )}
        </label>
    );
};

const isNumericField = (field: ConfiguredFieldDefinition): boolean =>
    ['Number', 'Decimal', 'Money', 'Quantity', 'Rate'].includes(field.Type);

const defaultFieldValue = (field: ConfiguredFieldDefinition): string => {
    const value = field.DefaultValue;
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
        ? String(value)
        : '';
};

const calculateConfiguredLineItem = (
    item: RecordLineItem,
    config: DocumentFormatConfig | undefined,
): RecordLineItem => {
    const section = config?.LineItemSections[0];
    if (!section) return item;
    let next = item;
    const values: Record<string, string | number> = {
        ItemName: item.itemName,
        HsnSac: item.hsnSac,
        Quantity: item.quantity,
        Rate: item.rate,
        TaxPercent: item.taxPercent,
        Amount: item.amount,
        ...(item.values ?? {}),
    };
    for (const field of section.Fields.filter(
        (candidate) => candidate.Calculated && candidate.Formula,
    ).sort((left, right) => (left.CalculationOrder ?? 0) - (right.CalculationOrder ?? 0))) {
        try {
            const value = evaluateFormula(
                field.Formula ?? '',
                values,
                config.CalculationPolicy,
                field.Precision ?? config.CalculationPolicy.MoneyPrecision,
            ).formatted;
            values[field.FieldId] = value;
            const normalized = normalizeId(field.FieldId);
            if (normalized === 'amount') next = { ...next, amount: value };
            else next = { ...next, values: { ...(next.values ?? {}), [field.FieldId]: value } };
        } catch {
            // Builder validation reports invalid formulas; entry keeps the last valid value.
        }
    }
    return next;
};

const applyDocumentCalculations = (
    record: EditableRecord,
    config: DocumentFormatConfig | undefined,
): EditableRecord => {
    if (!config) return record;
    let next = record;
    const values: Record<string, string | number> = {
        InvoiceDate: record.invoiceDate,
        CustomerName: record.customerName,
        CustomerGstin: record.gstin,
        Gstin: record.gstin,
        State: record.state,
        BillingAddress: record.billingAddress,
        GrandTotal: record.grandTotal,
        ...(record.fieldValues ?? {}),
    };
    for (const field of config.Fields.filter(
        (candidate) => candidate.Calculated && candidate.Formula,
    ).sort((left, right) => (left.CalculationOrder ?? 0) - (right.CalculationOrder ?? 0))) {
        const formula = field.Formula ?? '';
        let value: string;
        const sumMatch = /^SUM\(Items\.([^)]+)\)$/iu.exec(formula);
        if (sumMatch?.[1]) {
            value = record.lineItems
                .reduce(
                    (total, item) =>
                        total +
                        (Number.parseFloat(lineItemFieldValue(item, sumMatch[1] ?? '')) || 0),
                    0,
                )
                .toFixed(field.Precision ?? config.CalculationPolicy.MoneyPrecision);
        } else if (/^COUNT\(Items\)$/iu.test(formula)) {
            value = String(record.lineItems.length);
        } else {
            try {
                value = evaluateFormula(
                    formula,
                    values,
                    config.CalculationPolicy,
                    field.Precision ?? config.CalculationPolicy.MoneyPrecision,
                ).formatted;
            } catch {
                continue;
            }
        }
        values[field.FieldId] = value;
        if (normalizeId(field.FieldId) === 'grandtotal') next = { ...next, grandTotal: value };
        else
            next = {
                ...next,
                fieldValues: { ...(next.fieldValues ?? {}), [field.FieldId]: value },
            };
    }
    return next;
};

const lineItemFieldValue = (item: RecordLineItem, fieldId: string): string => {
    const values: Readonly<Record<string, string>> = {
        itemname: item.itemName,
        hsnsac: item.hsnSac,
        quantity: item.quantity,
        rate: item.rate,
        taxpercent: item.taxPercent,
        amount: item.amount,
    };
    return values[normalizeId(fieldId)] ?? item.values?.[fieldId] ?? '';
};

const firstMissingRequiredField = (
    record: EditableRecord,
    config: DocumentFormatConfig,
): string | undefined =>
    config.Fields.find(
        (field) =>
            field.Required &&
            !field.Calculated &&
            !documentFieldValue(record, field.FieldId).trim(),
    )?.Label;

const documentFieldValue = (record: EditableRecord, fieldId: string): string => {
    const values: Readonly<Record<string, string>> = {
        invoicedate: record.invoiceDate,
        customername: record.customerName,
        customergstin: record.gstin,
        gstin: record.gstin,
        state: record.state,
        billingaddress: record.billingAddress,
        grandtotal: record.grandTotal,
    };
    return values[normalizeId(fieldId)] ?? record.fieldValues?.[fieldId] ?? '';
};

const downloadBytes = (bytes: Uint8Array, fileName: string, type: string) => {
    const arrayBuffer = new Uint8Array(bytes).buffer;
    const url = URL.createObjectURL(new Blob([arrayBuffer], { type }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
};
