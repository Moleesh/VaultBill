/** @format */

/** Preview surface for record data, printable output, and resolved field values. */

import type { FC } from 'react';

import type { OperatorContext } from '../features/auth/AccountTypes';
import type { DocumentFormatSummary } from '../types/AppTypes';
import { FormField } from './FormFields';

type RecordPreviewProps = {
    readonly activeFormat: DocumentFormatSummary | undefined;
    readonly operatorContext: OperatorContext;
};

export const RecordPreview: FC<RecordPreviewProps> = ({ activeFormat, operatorContext }) => (
    <section className="form-preview" aria-labelledby="record-preview-title">
        <div className="form-preview-header">
            <div>
                <p className="eyebrow">Record entry</p>
                <h2 id="record-preview-title">
                    {activeFormat?.formatName ?? 'Default format'} draft
                </h2>
            </div>
            <span className="status-pill">Draft by {operatorContext.CreatedByName}</span>
        </div>

        <div className="form-preview-grid" aria-label="Preview fields">
            <FormField.TextField label="Invoice date" readOnly value="2026-06-04" />
            <FormField.TextField label="Customer name" readOnly value="Sample Customer" />
            <FormField.TextAreaField
                label="Billing address"
                readOnly
                value="Sample Traders, Main Road"
                wrapperClassName="span-2"
            />
        </div>

        <div className="line-item-preview" role="region" aria-label="Line items">
            <div className="line-item-preview-track">
                <span>Item Name</span>
                <span>Quantity</span>
                <span>Rate</span>
                <span>Amount</span>
            </div>
            <div className="line-item-preview-track line-item-preview-row">
                <span>Sample Item</span>
                <span>2.000</span>
                <span>500.0000</span>
                <span>1000.00</span>
            </div>
        </div>
    </section>
);
