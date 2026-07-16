/** @format */

import type { CSSProperties, FC } from 'react';
import { useEffect } from 'react';

import { useForm } from '@tanstack/react-form';

import { AppDatePicker } from '../../components/AppDatePicker/AppDatePicker';
import { FormField } from '../../components/FormFields';
import type { BuilderLayoutConfig } from '../builder/BuilderPageSupport';
import { RecordsFieldControl } from './RecordsFieldControl';
import { RecordsLineItemsSection } from './RecordsLineItemsSection';
import type { ConfiguredFieldDefinition } from './RecordsPageSupport';
import type { AppRecord, EditableRecord, RecordLineItem } from './RecordStoreContext';

type RecordsDocumentFormValues = {
    readonly billingAddress: string;
    readonly customerName: string;
    readonly gstin: string;
    readonly invoiceDate: string;
    readonly state: string;
};

type RecordsFormSectionProps = {
    readonly configuredDocumentFields: readonly ConfiguredFieldDefinition[];
    readonly configuredLineFields: readonly ConfiguredFieldDefinition[];
    readonly isReadOnly: boolean;
    readonly layout: BuilderLayoutConfig;
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
    layout,
    onAddLineItem,
    onRecordChange,
    onUpdateLineItem,
    record,
    recordTotals,
    selectedStoredRecord,
}) => {
    const columns = Math.max(1, Math.min(5, layout.Columns));
    const gap = Math.max(0, layout.Gap);
    const form = useForm({
        defaultValues: {
            billingAddress: record.billingAddress,
            customerName: record.customerName,
            gstin: record.gstin,
            invoiceDate: record.invoiceDate,
            state: record.state,
        } satisfies RecordsDocumentFormValues,
    });

    useEffect(() => {
        form.reset({
            billingAddress: record.billingAddress,
            customerName: record.customerName,
            gstin: record.gstin,
            invoiceDate: record.invoiceDate,
            state: record.state,
        });
    }, [
        form,
        record.billingAddress,
        record.customerName,
        record.gstin,
        record.invoiceDate,
        record.state,
    ]);

    return (
        <>
            {selectedStoredRecord?.documentNumber ? (
                <div className="record-status-row">
                    <span className="status-pill">{selectedStoredRecord.status}</span>
                    <strong>{selectedStoredRecord.documentNumber}</strong>
                </div>
            ) : null}
            <div
                className="form-grid records-layout-grid"
                style={
                    {
                        gap: `${String(gap)}px`,
                        '--records-layout-columns': String(columns),
                    } as CSSProperties
                }
            >
                <form.Field name="invoiceDate">
                    {(field) => (
                        <AppDatePicker
                            disabled={isReadOnly}
                            label="Invoice date"
                            onChange={(invoiceDate) => {
                                field.handleChange(invoiceDate);
                                onRecordChange({ ...record, invoiceDate });
                            }}
                            value={field.state.value}
                        />
                    )}
                </form.Field>
                <form.Field name="customerName">
                    {(field) => (
                        <FormField.TextField
                            disabled={isReadOnly}
                            label="Customer name"
                            onChange={(event) => {
                                field.handleChange(event.currentTarget.value);
                                onRecordChange({
                                    ...record,
                                    customerName: event.currentTarget.value,
                                });
                            }}
                            placeholder="Business or customer name"
                            readOnly={isReadOnly}
                            value={field.state.value}
                        />
                    )}
                </form.Field>
                <form.Field name="gstin">
                    {(field) => (
                        <FormField.TextField
                            disabled={isReadOnly}
                            label="GSTIN"
                            onChange={(event) => {
                                field.handleChange(event.currentTarget.value);
                                onRecordChange({ ...record, gstin: event.currentTarget.value });
                            }}
                            placeholder="Optional GST number"
                            readOnly={isReadOnly}
                            value={field.state.value}
                        />
                    )}
                </form.Field>
                <form.Field name="state">
                    {(field) => (
                        <FormField.TextField
                            disabled={isReadOnly}
                            label="State"
                            onChange={(event) => {
                                field.handleChange(event.currentTarget.value);
                                onRecordChange({ ...record, state: event.currentTarget.value });
                            }}
                            placeholder="State"
                            readOnly={isReadOnly}
                            value={field.state.value}
                        />
                    )}
                </form.Field>
                <form.Field name="billingAddress">
                    {(field) => (
                        <FormField.TextAreaField
                            disabled={isReadOnly}
                            label="Billing address"
                            onChange={(event) => {
                                field.handleChange(event.currentTarget.value);
                                onRecordChange({
                                    ...record,
                                    billingAddress: event.currentTarget.value,
                                });
                            }}
                            placeholder="Address shown on the document"
                            readOnly={isReadOnly}
                            value={field.state.value}
                        />
                    )}
                </form.Field>
                {configuredDocumentFields.map((field) => (
                    <RecordsFieldControl
                        disabled={isReadOnly}
                        field={field}
                        key={field.FieldId}
                        onChange={(value) => {
                            onRecordChange({
                                ...record,
                                fieldValues: {
                                    ...(record.fieldValues ?? {}),
                                    [field.FieldId]: value,
                                },
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
};
