/** @format */

import type { FC } from 'react';

import { HorizontalProgress } from '../../components/HorizontalProgress/HorizontalProgress';
import { previewValue } from './BuilderPagePreviewSupport';
import type { FieldConfig } from './BuilderPageSupport';

type BuilderLineItemsPreviewProps = {
    readonly enabled: boolean;
    readonly fields: readonly FieldConfig[];
};

const sampleRows = ['Sample row 1', 'Sample row 2'];

export const BuilderLineItemsPreview: FC<BuilderLineItemsPreviewProps> = ({ enabled, fields }) => (
    <>
        <section className="builder-line-summary" aria-labelledby="builder-line-summary-title">
            <div className="section-heading builder-line-summary-heading">
                <div>
                    <p className="eyebrow">Summary formulas</p>
                    <h3 id="builder-line-summary-title">Subtotal, tax, and total</h3>
                </div>
                <p>Keep these calculations visible so operators can review how totals are built.</p>
            </div>
            <div className="builder-line-summary-cards">
                <article>
                    <small>Subtotal</small>
                    <strong>SUMALL(Amount)</strong>
                </article>
                <article>
                    <small>Tax total</small>
                    <strong>GST + CGST + SGST</strong>
                </article>
                <article>
                    <small>Round off</small>
                    <strong>RoundOff</strong>
                </article>
                <article>
                    <small>Total</small>
                    <strong>Subtotal + TaxTotal + RoundOff</strong>
                </article>
            </div>
        </section>
        <section className="builder-line-preview" aria-labelledby="builder-line-preview-title">
            <div className="section-heading builder-line-preview-heading">
                <div>
                    <p className="eyebrow">Row preview</p>
                    <h3 id="builder-line-preview-title">Sample rows</h3>
                </div>
                <p>Review the row order and totals after the fields are configured.</p>
            </div>
            {enabled ? (
                <>
                    <HorizontalProgress
                        className="builder-preview-table-scroll builder-preview-table-scroll--desktop"
                        label="Line item preview"
                        showControls={false}
                    >
                        <div className="builder-preview-table builder-preview-table--desktop">
                            <div
                                className="builder-preview-table-row builder-preview-table-row--header"
                                style={{
                                    gridTemplateColumns: `repeat(${String(fields.length || 1)}, minmax(8rem, 1fr))`,
                                }}
                            >
                                {fields.map((field) => (
                                    <span key={`header-${field.FieldId}`}>{field.Label}</span>
                                ))}
                            </div>
                            {sampleRows.map((rowLabel, rowIndex) => (
                                <div
                                    className="builder-preview-table-row builder-preview-table-row--body"
                                    key={rowLabel}
                                    style={{
                                        gridTemplateColumns: `repeat(${String(fields.length || 1)}, minmax(8rem, 1fr))`,
                                    }}
                                >
                                    {fields.map((field) => (
                                        <span key={`${field.FieldId}-${String(rowIndex)}`}>
                                            {previewValue(
                                                rowIndex === 0
                                                    ? (field.SampleValue ??
                                                          field.DefaultValue ??
                                                          field.Label)
                                                    : field.Type === 'Text' ||
                                                        field.Type === 'Textarea'
                                                      ? `${previewValue(
                                                            field.SampleValue ??
                                                                field.DefaultValue ??
                                                                field.Label,
                                                        )} 2`
                                                      : (field.SampleValue ??
                                                        field.DefaultValue ??
                                                        'Sample'),
                                            )}
                                        </span>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </HorizontalProgress>
                    <div className="builder-preview-table builder-preview-table--mobile">
                        {sampleRows.map((rowLabel, rowIndex) => (
                            <article className="builder-preview-table-mobile-row" key={rowLabel}>
                                <strong>{rowLabel}</strong>
                                <div className="builder-preview-table-mobile-grid">
                                    {fields.map((field) => (
                                        <div
                                            className="builder-preview-table-mobile-cell"
                                            key={`${field.FieldId}-${String(rowIndex)}-mobile`}
                                        >
                                            <span>{field.Label}</span>
                                            <strong>
                                                {previewValue(
                                                    rowIndex === 0
                                                        ? (field.SampleValue ??
                                                              field.DefaultValue ??
                                                              field.Label)
                                                        : field.Type === 'Text' ||
                                                            field.Type === 'Textarea'
                                                          ? `${previewValue(
                                                                field.SampleValue ??
                                                                    field.DefaultValue ??
                                                                    field.Label,
                                                            )} 2`
                                                          : (field.SampleValue ??
                                                            field.DefaultValue ??
                                                            'Sample'),
                                                )}
                                            </strong>
                                        </div>
                                    ))}
                                </div>
                            </article>
                        ))}
                    </div>
                </>
            ) : (
                <div className="builder-line-preview-disabled" role="status">
                    Line items are disabled. Enable them to review sample rows here.
                </div>
            )}
            <div className="builder-line-preview-totals">
                <article>
                    <small>Subtotal</small>
                    <strong>SUMALL(Amount)</strong>
                </article>
                <article>
                    <small>Total</small>
                    <strong>Subtotal + TaxTotal + RoundOff</strong>
                </article>
            </div>
        </section>
    </>
);
