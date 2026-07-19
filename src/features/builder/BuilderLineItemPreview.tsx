/** @format */

import type { FC } from 'react';

import { HorizontalProgress } from '../../components/HorizontalProgress/HorizontalProgress';
import { previewValue } from './BuilderPagePreviewSupport';
import type { FieldConfig } from './BuilderPageSupport';

type BuilderLineItemPreviewProps = {
    readonly label: string;
    readonly lineItemColumns: readonly FieldConfig[];
    readonly lineItemDetails: readonly FieldConfig[];
};

const previewLineValue = (field: FieldConfig, rowIndex: number): string => {
    const value = field.SampleValue ?? field.DefaultValue ?? field.Label;
    if (rowIndex === 0) return previewValue(value);
    if (field.Type === 'Text' || field.Type === 'Textarea') return `${previewValue(value)} 2`;
    return previewValue(field.SampleValue ?? field.DefaultValue ?? 'Sample');
};

/** Mirrors the Records line-item table while keeping wide rows inside a scroll rail. */
export const BuilderLineItemPreview: FC<BuilderLineItemPreviewProps> = ({
    label,
    lineItemColumns,
    lineItemDetails,
}) => {
    const gridTemplateColumns = `repeat(${String(lineItemColumns.length || 1)}, minmax(8rem, 1fr))`;

    return (
        <>
            <HorizontalProgress
                className="builder-preview-table-scroll builder-preview-table-scroll--desktop"
                label="Line item preview"
                showControls={false}
            >
                <div
                    className="builder-preview-table builder-preview-table--desktop"
                    aria-label="Line item preview"
                >
                    <div className="builder-preview-table-heading">
                        <div>
                            <strong>{label}</strong>
                            <small>Two sample rows stay visible for row-level review.</small>
                        </div>
                    </div>
                    <div
                        className="builder-preview-table-row builder-preview-table-row--header"
                        style={{ gridTemplateColumns }}
                    >
                        {lineItemColumns.map((field) => (
                            <span key={field.FieldId}>{field.Label}</span>
                        ))}
                    </div>
                    {['Sample row 1', 'Sample row 2'].map((rowLabel, rowIndex) => (
                        <div className="builder-preview-row-block" key={rowLabel}>
                            <div
                                className="builder-preview-table-row builder-preview-table-row--body"
                                style={{ gridTemplateColumns }}
                            >
                                {lineItemColumns.map((field) => (
                                    <span key={`${field.FieldId}-${String(rowIndex)}`}>
                                        {previewLineValue(field, rowIndex)}
                                    </span>
                                ))}
                            </div>
                            {lineItemDetails.length > 0 ? (
                                <div className="builder-preview-line-details">
                                    {lineItemDetails.map((field) => (
                                        <div key={`${field.FieldId}-${String(rowIndex)}-detail`}>
                                            <span>{field.Label}</span>
                                            <strong>{previewLineValue(field, rowIndex)}</strong>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    ))}
                </div>
            </HorizontalProgress>
            <div className="builder-preview-table builder-preview-table--mobile">
                <div className="builder-preview-table-heading">
                    <div>
                        <strong>{label}</strong>
                        <small>Two sample rows stay visible for row-level review.</small>
                    </div>
                </div>
                {['Sample row 1', 'Sample row 2'].map((rowLabel, rowIndex) => (
                    <article className="builder-preview-table-mobile-row" key={rowLabel}>
                        <strong>{rowLabel}</strong>
                        <div className="builder-preview-table-mobile-grid">
                            {lineItemColumns.map((field) => (
                                <div
                                    className="builder-preview-table-mobile-cell"
                                    key={`${field.FieldId}-${String(rowIndex)}-mobile`}
                                >
                                    <span>{field.Label}</span>
                                    <strong>{previewLineValue(field, rowIndex)}</strong>
                                </div>
                            ))}
                        </div>
                        {lineItemDetails.length > 0 ? (
                            <div className="builder-preview-table-mobile-grid">
                                {lineItemDetails.map((field) => (
                                    <div
                                        className="builder-preview-table-mobile-cell"
                                        key={`${field.FieldId}-${String(rowIndex)}-detail-mobile`}
                                    >
                                        <span>{field.Label}</span>
                                        <strong>{previewLineValue(field, rowIndex)}</strong>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </article>
                ))}
            </div>
        </>
    );
};
