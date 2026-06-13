/** @format */

import type { FC } from 'react';

import { BuilderFieldEditor } from './BuilderFieldEditor';
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
}) => (
    <>
        <div className="builder-step-bridge">
            <div>
                <p className="eyebrow">Step separator</p>
                <h3>Previous: Fields</h3>
                <p>
                    Keep subtotal and total formulas in JSON so the row-level summary logic stays
                    easy to review.
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
                    <h3 id="builder-line-summary-title">Subtotal and total</h3>
                </div>
                <p>Keep these calculations visible so operators can review how totals are built.</p>
            </div>
            <div className="builder-line-summary__cards">
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
