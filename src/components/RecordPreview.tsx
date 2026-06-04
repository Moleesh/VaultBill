import type { FC } from 'react';

import type { OperatorContext } from '../features/auth/AccountTypes';
import type { DocumentFormatSummary } from '../types/AppTypes';

type RecordPreviewProps = {
  readonly activeFormat: DocumentFormatSummary | undefined;
  readonly operatorContext: OperatorContext;
};

export const RecordPreview: FC<RecordPreviewProps> = ({
  activeFormat,
  operatorContext,
}) => (
  <section className="form-preview" aria-labelledby="record-preview-title">
    <div className="form-preview__header">
      <div>
        <p className="eyebrow">Record entry</p>
        <h2 id="record-preview-title">
          {activeFormat?.formatName ?? 'Default format'} draft
        </h2>
      </div>
      <span className="status-pill">Draft by {operatorContext.CreatedByName}</span>
    </div>

    <div className="form-preview__grid" aria-label="Preview fields">
      <label>
        <span>Invoice date</span>
        <input readOnly value="2026-06-04" />
      </label>
      <label>
        <span>Customer name</span>
        <input readOnly value="Sample Customer" />
      </label>
      <label className="span-2">
        <span>Billing address</span>
        <textarea readOnly value="Sample Traders, Main Road" />
      </label>
    </div>

    <div className="line-item-preview" role="region" aria-label="Line items">
      <div className="line-item-preview__track">
        <span>Item Name</span>
        <span>Quantity</span>
        <span>Rate</span>
        <span>Amount</span>
      </div>
      <div className="line-item-preview__track line-item-preview__row">
        <span>Sample Item</span>
        <span>2.000</span>
        <span>500.0000</span>
        <span>1000.00</span>
      </div>
    </div>
  </section>
);
