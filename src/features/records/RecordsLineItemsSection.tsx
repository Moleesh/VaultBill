/** @format */

import type { FC } from 'react';

import { ActionButton } from '../../components/ActionButton';
import { FormField } from '../../components/FormFields';
import { HorizontalProgress } from '../../components/HorizontalProgress/HorizontalProgress';
import { RecordsFieldControl } from './RecordsFieldControl';
import type { ConfiguredFieldDefinition } from './RecordsPageSupport';
import type { EditableRecord, RecordLineItem } from './RecordStoreContext';

type RecordsLineItemsSectionProps = {
    readonly configuredLineFields: readonly ConfiguredFieldDefinition[];
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

/** Renders the repeating line-item rows and summary totals. */
export const RecordsLineItemsSection: FC<RecordsLineItemsSectionProps> = ({
    configuredLineFields,
    isReadOnly,
    onAddLineItem,
    onUpdateLineItem,
    record,
    recordTotals,
}) => (
    <>
        <HorizontalProgress className="line-item-grid" label="Line item columns">
            <div className="line-item-grid-row line-item-grid-header">
                <span>Item</span>
                <span>HSN/SAC</span>
                <span>Qty</span>
                <span>Rate</span>
                <span>Tax</span>
                <span>Amount</span>
            </div>
            {record.lineItems.map((item) => (
                <div className="line-item-grid-item" key={item.rowId}>
                    <div className="line-item-grid-row">
                        <FormField.TextField
                            disabled={isReadOnly}
                            hideLabel
                            label="Item name"
                            onChange={(event) => {
                                onUpdateLineItem(item.rowId, {
                                    itemName: event.currentTarget.value,
                                });
                            }}
                            placeholder="Item or service"
                            readOnly={isReadOnly}
                            value={item.itemName}
                            wrapperClassName="line-item-grid-control"
                        />
                        <FormField.TextField
                            disabled={isReadOnly}
                            hideLabel
                            label="HSN or SAC"
                            onChange={(event) => {
                                onUpdateLineItem(item.rowId, { hsnSac: event.currentTarget.value });
                            }}
                            readOnly={isReadOnly}
                            value={item.hsnSac}
                            wrapperClassName="line-item-grid-control"
                        />
                        <FormField.TextField
                            disabled={isReadOnly}
                            hideLabel
                            inputMode="decimal"
                            label="Quantity"
                            onChange={(event) => {
                                onUpdateLineItem(item.rowId, {
                                    quantity: event.currentTarget.value,
                                });
                            }}
                            placeholder="0"
                            readOnly={isReadOnly}
                            value={item.quantity}
                            wrapperClassName="line-item-grid-control"
                        />
                        <FormField.TextField
                            disabled={isReadOnly}
                            hideLabel
                            inputMode="decimal"
                            label="Rate"
                            onChange={(event) => {
                                onUpdateLineItem(item.rowId, { rate: event.currentTarget.value });
                            }}
                            placeholder="0.00"
                            readOnly={isReadOnly}
                            value={item.rate}
                            wrapperClassName="line-item-grid-control"
                        />
                        <FormField.TextField
                            disabled={isReadOnly}
                            hideLabel
                            inputMode="decimal"
                            label="Tax"
                            onChange={(event) => {
                                onUpdateLineItem(item.rowId, {
                                    taxPercent: event.currentTarget.value,
                                });
                            }}
                            placeholder="0"
                            readOnly={isReadOnly}
                            value={item.taxPercent}
                            wrapperClassName="line-item-grid-control"
                        />
                        <output aria-label="Amount">₹{item.amount}</output>
                    </div>
                    {configuredLineFields.length > 0 ? (
                        <div className="line-item-grid-custom">
                            {configuredLineFields.map((field) => (
                                <RecordsFieldControl
                                    disabled={isReadOnly || Boolean(field.ReadOnly)}
                                    field={field}
                                    key={field.FieldId}
                                    onChange={(value) => {
                                        onUpdateLineItem(item.rowId, {
                                            values: {
                                                ...(item.values ?? {}),
                                                [field.FieldId]: value,
                                            },
                                        });
                                    }}
                                    value={item.values?.[field.FieldId] ?? ''}
                                />
                            ))}
                        </div>
                    ) : null}
                </div>
            ))}
        </HorizontalProgress>
        {!isReadOnly ? <ActionButton onClick={onAddLineItem}>Add line item</ActionButton> : null}
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
    </>
);
