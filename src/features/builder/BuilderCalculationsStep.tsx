/** @format */

import { ArrowRight, GripVertical } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { DragEvent, FC } from 'react';

import type { DocumentFormatConfig } from '../../db/startup/ConfigSchemas';
import { move } from './BuilderPageSupport';
import { type CalculationTarget } from './BuilderPageCalculationSupport';
import type { FieldConfig } from './BuilderPageSupport';

type BuilderCalculationsStepProps = {
    readonly calculationTargets: readonly CalculationTarget[];
    readonly allFields: readonly FieldConfig[];
    readonly currencyPolicy: DocumentFormatConfig['CalculationPolicy'];
    readonly onOrderChange: (orderedFieldIds: readonly string[]) => void;
    readonly onEditFormula: (fieldId: string) => void;
};

/** Renders the calculated field order with drag handles and formula previews. */
export const BuilderCalculationsStep: FC<BuilderCalculationsStepProps> = ({
    calculationTargets,
    allFields,
    currencyPolicy,
    onOrderChange,
    onEditFormula,
}) => {
    const calculatedTargets = useMemo(
        () => calculationTargets.filter((target) => target.field.Calculated),
        [calculationTargets],
    );
    const [draggedIndex, setDraggedIndex] = useState<number | undefined>();

    const reorder = (from: number, to: number) => {
        if (from === to) return;
        const next = move(calculatedTargets, from, to);
        onOrderChange(next.map((target) => target.field.FieldId));
    };

    const handleDrop = (event: DragEvent<HTMLElement>, index: number) => {
        event.preventDefault();
        const from = draggedIndex;
        setDraggedIndex(undefined);
        if (from === undefined) return;
        reorder(from, index);
    };

    return (
        <div className="builder-calculations">
            <div className="section-heading">
                <div>
                    <h3>Calculation order</h3>
                    <p>Drag calculated rows into the trigger order you want to review.</p>
                </div>
            </div>
            <div className="calculation-list">
                {calculatedTargets.map((target, index) => {
                    const { field } = target;
                    const sectionLabel =
                        target.kind === 'document' ? 'Document field' : 'Line item';
                    return (
                        <article
                            draggable
                            key={`${field.FieldId}-${String(target.sectionIndex)}-${String(target.fieldIndex)}`}
                            onDragEnd={() => {
                                setDraggedIndex(undefined);
                            }}
                            onDragOver={(event) => {
                                event.preventDefault();
                            }}
                            onDragStart={(event) => {
                                setDraggedIndex(index);
                                event.dataTransfer.effectAllowed = 'move';
                                event.dataTransfer.setData('text/plain', field.FieldId);
                            }}
                            onDrop={(event) => {
                                handleDrop(event, index);
                            }}
                        >
                            <button
                                aria-label={`Drag ${field.Label}`}
                                className="builder-field-handle"
                                onClick={(event) => {
                                    event.preventDefault();
                                }}
                                tabIndex={-1}
                                type="button"
                            >
                                <GripVertical aria-hidden="true" size={17} />
                            </button>
                            <button
                                aria-label={`Edit ${field.Label}`}
                                className="builder-calculation-main"
                                onClick={() => {
                                    onEditFormula(field.FieldId);
                                }}
                                type="button"
                            >
                                <strong>{`Edit ${field.Label}`}</strong>
                                <span>{sectionLabel}</span>
                                <small>{field.Formula ?? 'No formula yet'}</small>
                            </button>
                            <small className="builder-calculation-order">
                                <ArrowRight size={14} />
                                {index === 0 ? 'First trigger' : 'Next trigger'}
                            </small>
                            <button
                                onClick={() => {
                                    onEditFormula(field.FieldId);
                                }}
                                type="button"
                            >
                                Formula
                            </button>
                        </article>
                    );
                })}
            </div>
            <div className="helper-card">
                <strong>Formula helper</strong>
                <p>
                    Use same-row fields such as <code>Quantity * Rate</code>. Keep GST, subtotal,
                    grand total, and round-off formulas separate so the preview stays easy to
                    follow.
                </p>
                <p>Drag the rows to make the trigger order easier to inspect before publishing.</p>
            </div>
            <div className="helper-card">
                <strong>Formula preview</strong>
                <p>
                    Live samples for the current order stay visible in the preview step alongside
                    the print template.
                </p>
                <small>
                    {calculatedTargets.length} calculated fields across {allFields.length} total
                    fields. Currency: {currencyPolicy.Currency}.
                </small>
            </div>
        </div>
    );
};
