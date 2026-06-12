/** @format */

import type { FC } from 'react';

import { AppDatePicker } from '../../components/AppDatePicker/AppDatePicker';
import { RecordsFieldControl } from './RecordsFieldControl';
import type { AppRecord, EditableRecord, RecordLineItem } from './RecordStoreContext';
import type { ConfiguredFieldDefinition } from './RecordsPageSupport';
import { RecordsLineItemsSection } from './RecordsLineItemsSection';

type RecordsFormSectionProps = {
    readonly configuredDocumentFields: readonly ConfiguredFieldDefinition[];
    readonly configuredLineFields: readonly ConfiguredFieldDefinition[];
    readonly isReadOnly: boolean;
    readonly onAddLineItem: () => void;
    readonly onRecordChange: (nextRecord: EditableRecord) => void;
    readonly onUpdateLineItem: (rowId: string, changes: Partial<RecordLineItem>) => void;
    readonly record: EditableRecord;
    readonly recordTotals: {
        readonly subtotal: string;
        readonly taxTotal: string;
        readonly roundOff: string;
        readonly grandTotal: string;
    };
    readonly selectedStoredRecord: AppRecord | undefined;
};

/** Renders the editable record fields, line items, and totals. */
export const RecordsFormSection: FC<RecordsFormSectionProps> = ({
    configuredDocumentFields,
    configuredLineFields,
    isReadOnly,
    onAddLineItem,
    onRecordChange,
    onUpdateLineItem,
    record,
    recordTotals,
    selectedStoredRecord,
}) => (
    <>
        {selectedStoredRecord?.documentNumber ? (
            <div className="record-status-row">
                <span className="status-pill">{selectedStoredRecord.status}</span>
                <strong>{selectedStoredRecord.documentNumber}</strong>
            </div>
        ) : null}
        <div className="form-grid">
            <AppDatePicker
                disabled={isReadOnly}
                label="Invoice date"
                onChange={(invoiceDate) => {
                    onRecordChange({ ...record, invoiceDate });
                }}
                value={record.invoiceDate}
            />
            <label>
                <span>Customer name</span>
                <input
                    disabled={isReadOnly}
                    onChange={(event) => {
                        onRecordChange({ ...record, customerName: event.currentTarget.value });
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
                        onRecordChange({ ...record, gstin: event.currentTarget.value });
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
                        onRecordChange({ ...record, state: event.currentTarget.value });
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
                        onRecordChange({ ...record, billingAddress: event.currentTarget.value });
                    }}
                    placeholder="Address shown on the document"
                    readOnly={isReadOnly}
                    value={record.billingAddress}
                />
            </label>
            {configuredDocumentFields.map((field) => (
                <RecordsFieldControl
                    disabled={isReadOnly}
                    field={field}
                    key={field.FieldId}
                    onChange={(value) => {
                        onRecordChange({
                            ...record,
                            fieldValues: { ...(record.fieldValues ?? {}), [field.FieldId]: value },
                        });
                    }}
                    value={record.fieldValues?.[field.FieldId] ?? ''}
                />
            ))}
        </div>
        <RecordsLineItemsSection
            configuredLineFields={configuredLineFields}
            isReadOnly={isReadOnly}
            onAddLineItem={onAddLineItem}
            onUpdateLineItem={onUpdateLineItem}
            record={record}
            recordTotals={recordTotals}
        />
    </>
);
