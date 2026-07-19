/** @format */

import type { CSSProperties, FC, ReactNode } from 'react';

import { ActionButton } from '../../components/ActionButton';
import { HorizontalProgress } from '../../components/HorizontalProgress/HorizontalProgress';
import { RecordsFieldControl } from './RecordsFieldControl';
import {
    documentFieldValue,
    knownLineFieldRole,
    lineItemFieldValue,
    normalizeId,
    type ConfiguredFieldDefinition,
} from './RecordsPageSupport';
import type { EditableRecord, RecordLineItem } from './RecordStoreContext';

type RecordsLineItemsSectionProps = {
    readonly children?: ReactNode;
    readonly configuredLineFields: readonly ConfiguredFieldDefinition[];
    readonly configuredLineDetailFields: readonly ConfiguredFieldDefinition[];
    readonly configuredSummaryFields: readonly ConfiguredFieldDefinition[];
    readonly isReadOnly: boolean;
    readonly onAddLineItem: () => void;
    readonly onUpdateLineItem: (rowId: string, changes: Partial<RecordLineItem>) => void;
    readonly record: EditableRecord;
    readonly recordTotals: {
        readonly subtotal: string;
        readonly taxTotal: string;
        readonly roundOff: string;
        readonly grandTotal: string;
    };
};

const summaryValue = (
    record: EditableRecord,
    field: ConfiguredFieldDefinition,
    recordTotals: RecordsLineItemsSectionProps['recordTotals'],
): string => {
    const configuredValue = documentFieldValue(record, field.FieldId);
    if (configuredValue) return configuredValue;
    const normalizedId = normalizeId(field.FieldId);
    if (normalizedId === 'subtotal') return recordTotals.subtotal;
    if (normalizedId === 'taxtotal' || normalizedId === 'taxamount') return recordTotals.taxTotal;
    if (normalizedId === 'roundoff') return recordTotals.roundOff;
    if (normalizedId === 'grandtotal') return recordTotals.grandTotal;
    return '0.00';
};

/** Renders the repeating line-item rows and summary totals. */
export const RecordsLineItemsSection: FC<RecordsLineItemsSectionProps> = ({
    children,
    configuredLineFields,
    configuredLineDetailFields,
    configuredSummaryFields,
    isReadOnly,
    onAddLineItem,
    onUpdateLineItem,
    record,
    recordTotals,
}) => {
    const columns = Math.max(1, configuredLineFields.length);
    const tableWidth = `${String(Math.max(44, columns * 9))}rem`;
    const gridStyle = {
        gridTemplateColumns: `repeat(${String(columns)}, minmax(9rem, 1fr))`,
        minWidth: tableWidth,
        width: tableWidth,
    } as CSSProperties;
    const onLineFieldChange = (
        item: RecordLineItem,
        field: ConfiguredFieldDefinition,
        value: string,
    ) => {
        const role = knownLineFieldRole(field);
        if (role === 'itemName') onUpdateLineItem(item.rowId, { itemName: value });
        else if (role === 'hsnSac') onUpdateLineItem(item.rowId, { hsnSac: value });
        else if (role === 'quantity') onUpdateLineItem(item.rowId, { quantity: value });
        else if (role === 'rate') onUpdateLineItem(item.rowId, { rate: value });
        else if (role === 'taxPercent') onUpdateLineItem(item.rowId, { taxPercent: value });
        else
            onUpdateLineItem(item.rowId, {
                values: {
                    ...(item.values ?? {}),
                    [field.FieldId]: value,
                },
            });
    };

    return (
        <>
            <HorizontalProgress className="line-item-grid" label="Line item columns">
                <div className="line-item-grid-row line-item-grid-header" style={gridStyle}>
                    {configuredLineFields.map((field) => (
                        <span key={field.FieldId}>{field.Label}</span>
                    ))}
                </div>
                {record.lineItems.map((item) => (
                    <div className="line-item-grid-item" key={item.rowId}>
                        <div className="line-item-grid-row" style={gridStyle}>
                            {configuredLineFields.map((field) => (
                                <RecordsFieldControl
                                    disabled={
                                        isReadOnly ||
                                        Boolean(field.ReadOnly) ||
                                        Boolean(field.Calculated)
                                    }
                                    field={field}
                                    hideLabel
                                    key={field.FieldId}
                                    onChange={(value) => {
                                        onLineFieldChange(item, field, value);
                                    }}
                                    value={lineItemFieldValue(item, field.FieldId)}
                                    wrapperClassName="line-item-grid-control"
                                />
                            ))}
                        </div>
                        {configuredLineDetailFields.length > 0 ? (
                            <div className="line-item-detail-grid">
                                {configuredLineDetailFields.map((field) => (
                                    <RecordsFieldControl
                                        disabled={
                                            isReadOnly ||
                                            Boolean(field.ReadOnly) ||
                                            Boolean(field.Calculated)
                                        }
                                        field={field}
                                        key={field.FieldId}
                                        onChange={(value) => {
                                            onLineFieldChange(item, field, value);
                                        }}
                                        value={lineItemFieldValue(item, field.FieldId)}
                                        wrapperClassName="line-item-detail-control"
                                    />
                                ))}
                            </div>
                        ) : null}
                    </div>
                ))}
            </HorizontalProgress>
            {!isReadOnly ? (
                <ActionButton onClick={onAddLineItem}>Add line item</ActionButton>
            ) : null}
            {children}
            {configuredSummaryFields.length > 0 ? (
                <div className="record-summary" aria-label="Record totals">
                    {configuredSummaryFields.map((field) => (
                        <div
                            className={
                                normalizeId(field.FieldId) === 'grandtotal'
                                    ? 'record-summary-grand'
                                    : undefined
                            }
                            key={field.FieldId}
                        >
                            <span>{field.Label}</span>
                            <strong>₹{summaryValue(record, field, recordTotals)}</strong>
                        </div>
                    ))}
                </div>
            ) : (
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
                    <div className="record-summary-grand">
                        <span>Grand total</span>
                        <strong>₹{recordTotals.grandTotal}</strong>
                    </div>
                </div>
            )}
        </>
    );
};
