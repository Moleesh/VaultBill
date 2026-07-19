/** @format */

import type { FC } from 'react';
import { useEffect } from 'react';

import { useForm } from '@tanstack/react-form';

import { AppDatePicker } from '../../components/AppDatePicker/AppDatePicker';
import { FormField } from '../../components/FormFields';
import type { EditableRecord } from './RecordStoreContext';

type RecordsDocumentFormValues = {
    readonly billingAddress: string;
    readonly customerName: string;
    readonly gstin: string;
    readonly invoiceDate: string;
    readonly state: string;
};

type RecordsStandardFieldsProps = {
    readonly isReadOnly: boolean;
    readonly onRecordChange: (nextRecord: EditableRecord) => void;
    readonly record: EditableRecord;
};

export const RecordsStandardFields: FC<RecordsStandardFieldsProps> = ({
    isReadOnly,
    onRecordChange,
    record,
}) => {
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
                            onRecordChange({ ...record, customerName: event.currentTarget.value });
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
        </>
    );
};
