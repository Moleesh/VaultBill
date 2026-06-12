/** @format */

import type { FC } from 'react';

import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
import type { FieldConfig } from './BuilderPageSupport';
import { sampleFormula } from './BuilderPageCalculationSupport';

type BuilderCalculationsStepProps = {
    readonly fields: readonly FieldConfig[];
    readonly allFields: readonly FieldConfig[];
    readonly currencyPolicy: DocumentFormatConfig['CalculationPolicy'];
    readonly onEditFormula: (fieldId: string) => void;
};

/** Renders the calculation summary and edit shortcuts. */
export const BuilderCalculationsStep: FC<BuilderCalculationsStepProps> = ({
    fields,
    allFields,
    currencyPolicy,
    onEditFormula,
}) => (
    <div className="calculation-list">
        {fields
            .filter((field) => field.Calculated)
            .map((field) => (
                <article key={field.FieldId}>
                    <div>
                        <strong>{field.Label}</strong>
                        <code>{field.FieldId}</code>
                    </div>
                    <code>{field.Formula}</code>
                    <small>{sampleFormula(field, allFields, currencyPolicy)}</small>
                    <button
                        onClick={() => {
                            onEditFormula(field.FieldId);
                        }}
                        type="button"
                    >
                        Edit formula
                    </button>
                </article>
            ))}
        <div className="helper-card">
            <strong>Formula helper</strong>
            <p>
                Use same-row fields such as <code>Quantity * Rate</code>. Keep GST, subtotal, grand
                total, and round-off formulas separate so the preview stays easy to follow.
            </p>
        </div>
    </div>
);
