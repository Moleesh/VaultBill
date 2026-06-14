/** @format */

import type { FC } from 'react';

import { BuilderFieldEditor } from './BuilderFieldEditor';
import { previewValue } from './BuilderPagePreviewSupport';
import type { FieldConfig } from './BuilderPageSupport';

type LineSection = {
    readonly Label: string;
    readonly MaxRows: number;
    readonly Fields: readonly FieldConfig[];
};

type BuilderLineItemsStepProps = {
    readonly lineSection: LineSection;
    readonly referencedFieldIds: ReadonlySet<string>;
    readonly onPrevious: () => void;
    readonly onLabelChange: (value: string) => void;
    readonly onMaxRowsChange: (value: number) => void;
    readonly onAdd: () => void;
    readonly onChange: (fields: readonly FieldConfig[]) => void;
    readonly onEdit: (index: number) => void;
};

/** Renders the line-item section editor step. */
export const BuilderLineItemsStep: FC<BuilderLineItemsStepProps> = ({
    lineSection,
    referencedFieldIds,
    onPrevious,
    onLabelChange,
    onMaxRowsChange,
    onAdd,
    onChange,
    onEdit,
}) => {
    const sampleRows = ['Sample row 1', 'Sample row 2'];

    return (
        <>
            <div className="builder-step-bridge">
                <div>
                    <p className="eyebrow">Step separator</p>
                    <h3>Previous: Fields</h3>
                    <p>
                        Keep subtotal and total formulas in JSON so the row-level summary logic
                        stays easy to review.
                    </p>
                </div>
                <button className="button-secondary" onClick={onPrevious} type="button">
                    Previous: Fields
                </button>
            </div>
            <section className="builder-line-summary" aria-labelledby="builder-line-summary-title">
                <div className="section-heading builder-line-summary__heading">
                    <div>
                        <p className="eyebrow">Summary formulas</p>
                        <h3 id="builder-line-summary-title">Subtotal, tax, and total</h3>
                    </div>
                    <p>Keep these calculations visible so operators can review how totals are built.</p>
                </div>
                <div className="builder-line-summary__cards">
                    <article>
                        <small>Subtotal</small>
                        <strong>SUMALL(Amount)</strong>
                    </article>
                    <article>
                        <small>Tax</small>
                        <strong>GST + CGST + SGST</strong>
                    </article>
                    <article>
                        <small>Round off</small>
                        <strong>RoundOff</strong>
                    </article>
                    <article>
                        <small>Total</small>
                        <strong>Subtotal + Tax + RoundOff</strong>
                    </article>
                </div>
            </section>
            <section className="builder-line-preview" aria-labelledby="builder-line-preview-title">
                <div className="section-heading builder-line-preview__heading">
                    <div>
                        <p className="eyebrow">Row preview</p>
                        <h3 id="builder-line-preview-title">Sample rows</h3>
                    </div>
                    <p>Review the row order and totals before moving on.</p>
                </div>
                <div className="builder-preview-table builder-preview-table--desktop">
                    <div
                        className="builder-preview-table__row builder-preview-table__row--header"
                        style={{
                            gridTemplateColumns: `repeat(${String(lineSection.Fields.length || 1)}, minmax(8rem, 1fr))`,
                        }}
                    >
                        {lineSection.Fields.map((field) => (
                            <span key={`header-${field.FieldId}`}>{field.Label}</span>
                        ))}
                    </div>
                    {sampleRows.map((rowLabel, rowIndex) => (
                        <div
                            className="builder-preview-table__row builder-preview-table__row--body"
                            key={rowLabel}
                            style={{
                                gridTemplateColumns: `repeat(${String(
                                    lineSection.Fields.length || 1,
                                )}, minmax(8rem, 1fr))`,
                            }}
                        >
                            {lineSection.Fields.map((field) => (
                                <span key={`${field.FieldId}-${String(rowIndex)}`}>
                                    {previewValue(
                                        rowIndex === 0
                                            ? field.SampleValue ?? field.DefaultValue ?? field.Label
                                            : field.Type === 'Text' || field.Type === 'Textarea'
                                              ? `${previewValue(
                                                    field.SampleValue ??
                                                        field.DefaultValue ??
                                                        field.Label,
                                                )} 2`
                                              : field.SampleValue ?? field.DefaultValue ?? 'Sample',
                                    )}
                                </span>
                            ))}
                        </div>
                    ))}
                </div>
                <div className="builder-preview-table builder-preview-table--mobile">
                    {sampleRows.map((rowLabel, rowIndex) => (
                        <article className="builder-preview-table__mobile-row" key={rowLabel}>
                            <strong>{rowLabel}</strong>
                            <div className="builder-preview-table__mobile-grid">
                                {lineSection.Fields.map((field) => (
                                    <div
                                        className="builder-preview-table__mobile-cell"
                                        key={`${field.FieldId}-${String(rowIndex)}-mobile`}
                                    >
                                        <span>{field.Label}</span>
                                        <strong>
                                            {previewValue(
                                                rowIndex === 0
                                                    ? field.SampleValue ?? field.DefaultValue ?? field.Label
                                                    : field.Type === 'Text' || field.Type === 'Textarea'
                                                      ? `${previewValue(
                                                            field.SampleValue ??
                                                                field.DefaultValue ??
                                                                field.Label,
                                                        )} 2`
                                                      : field.SampleValue ?? field.DefaultValue ?? 'Sample',
                                            )}
                                        </strong>
                                    </div>
                                ))}
                            </div>
                        </article>
                    ))}
                </div>
                <div className="builder-line-preview__totals">
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
            <div className="form-grid">
                <label>
                    <span>Section label</span>
                    <input
                        value={lineSection.Label}
                        onChange={(event) => {
                            onLabelChange(event.currentTarget.value);
                        }}
                    />
                </label>
                <label>
                    <span>Maximum rows</span>
                    <input
                        min="1"
                        type="number"
                        value={lineSection.MaxRows}
                        onChange={(event) => {
                            onMaxRowsChange(Number(event.currentTarget.value));
                        }}
                    />
                </label>
            </div>
            <BuilderFieldEditor
                fields={lineSection.Fields}
                onAdd={onAdd}
                onChange={onChange}
                onEdit={onEdit}
                referencedFieldIds={referencedFieldIds}
            />
        </>
    );
};
