/** @format */

import type { FC } from 'react';
import { useState } from 'react';

import { BadgeCheck, EyeOff, ListChecks, Minus, Plus } from 'lucide-react';

import { IconButton } from '../../components/IconButton';
import { SearchableDropdown } from '../../components/SearchableDropdown/SearchableDropdown';
import {
    formatPlacementLabel,
    normalizeFieldPlacement,
    type FieldDisplayPlacement,
} from './BuilderFieldPlacementSupport';
import type { FieldConfig } from './BuilderPageSupport';

type BuilderSummaryStepProps = {
    readonly fields: readonly FieldConfig[];
    readonly onAdd: () => void;
    readonly onChange: (fields: readonly FieldConfig[]) => void;
    readonly onEdit: (index: number) => void;
};

const summaryPlacementOptions: readonly FieldDisplayPlacement[] = ['Summary', 'Form', 'Hidden'];

const isSummaryCandidate = (field: FieldConfig): boolean =>
    Boolean(field.Calculated) ||
    normalizeFieldPlacement(field, 'document') === 'Summary' ||
    ['Money', 'Number', 'Decimal', 'Quantity', 'Rate'].includes(field.Type);

/** Configures calculated document fields that appear in the Records totals area. */
export const BuilderSummaryStep: FC<BuilderSummaryStepProps> = ({
    fields,
    onAdd,
    onChange,
    onEdit,
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const candidates = fields
        .map((field, index) => ({ field, index }))
        .filter(({ field }) => isSummaryCandidate(field));
    const summaryFields = candidates.filter(
        ({ field }) => normalizeFieldPlacement(field, 'document') === 'Summary',
    );
    const availableFields = candidates.filter(
        ({ field }) => normalizeFieldPlacement(field, 'document') !== 'Summary',
    );

    const updateFieldPlacement = (index: number, placement: FieldDisplayPlacement) => {
        onChange(
            fields.map((field, fieldIndex) =>
                fieldIndex === index
                    ? {
                          ...field,
                          DisplayPlacement: placement,
                          Visible: placement === 'Hidden' ? false : true,
                      }
                    : field,
            ),
        );
    };

    return (
        <div className="builder-summary-step">
            <div className="section-heading builder-summary-heading">
                <div>
                    <h3>Summary totals</h3>
                    <p>Choose which calculated document fields appear below the line-item table.</p>
                </div>
                <div className="builder-summary-actions">
                    <span className="status-pill">
                        {`${String(summaryFields.length)} summary field${
                            summaryFields.length === 1 ? '' : 's'
                        }`}
                    </span>
                    <IconButton
                        icon={<Plus size={16} />}
                        onClick={() => {
                            if (availableFields.length === 0) {
                                onAdd();
                                return;
                            }
                            setIsAdding((current) => !current);
                        }}
                        variant="primary"
                    >
                        Add summary field
                    </IconButton>
                </div>
            </div>
            <div className="builder-summary-list">
                {summaryFields.map(({ field, index }) => {
                    const placement = normalizeFieldPlacement(field, 'document');
                    const displayPlacement: FieldDisplayPlacement =
                        placement === 'Summary' || placement === 'Hidden' ? placement : 'Form';

                    return (
                        <article
                            className={`builder-summary-row builder-summary-row--${displayPlacement.toLowerCase()}`}
                            key={field.FieldId}
                        >
                            <span className="builder-summary-row-icon" aria-hidden="true">
                                {displayPlacement === 'Summary' ? (
                                    <BadgeCheck size={18} />
                                ) : displayPlacement === 'Hidden' ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <ListChecks size={18} />
                                )}
                            </span>
                            <div className="builder-summary-row-copy">
                                <strong>{field.Label}</strong>
                                <small>
                                    {field.Formula
                                        ? `${field.FieldId} = ${field.Formula}`
                                        : `${field.FieldId} ${field.Calculated ? 'calculated' : field.Type}`}
                                </small>
                            </div>
                            <SearchableDropdown
                                hideLabel
                                label={`${field.Label} placement`}
                                onChange={(value) => {
                                    if (
                                        !summaryPlacementOptions.includes(
                                            value as FieldDisplayPlacement,
                                        )
                                    ) {
                                        return;
                                    }
                                    updateFieldPlacement(index, value as FieldDisplayPlacement);
                                }}
                                options={summaryPlacementOptions.map((option) => ({
                                    value: option,
                                    label: formatPlacementLabel(option),
                                }))}
                                value={displayPlacement}
                                wrapperClassName="builder-summary-placement"
                            />
                            <IconButton
                                className="builder-summary-toggle"
                                icon={<Minus size={16} />}
                                onClick={() => {
                                    updateFieldPlacement(index, 'Form');
                                }}
                                variant="secondary"
                            >
                                Remove
                            </IconButton>
                            <IconButton
                                onClick={() => {
                                    onEdit(index);
                                }}
                                variant="secondary"
                            >
                                Edit field
                            </IconButton>
                        </article>
                    );
                })}
            </div>
            {isAdding && availableFields.length > 0 ? (
                <div className="builder-summary-add-panel">
                    <div>
                        <strong>Add an existing field</strong>
                        <p>Promote a calculated or numeric field into the summary totals.</p>
                    </div>
                    <div className="builder-summary-list">
                        {availableFields.map(({ field, index }) => (
                            <article
                                className="builder-summary-row builder-summary-row--form"
                                key={field.FieldId}
                            >
                                <span className="builder-summary-row-icon" aria-hidden="true">
                                    <ListChecks size={18} />
                                </span>
                                <div className="builder-summary-row-copy">
                                    <strong>{field.Label}</strong>
                                    <small>
                                        {field.Formula
                                            ? `${field.FieldId} = ${field.Formula}`
                                            : `${field.FieldId} ${field.Calculated ? 'calculated' : field.Type}`}
                                    </small>
                                </div>
                                <IconButton
                                    icon={<Plus size={16} />}
                                    onClick={() => {
                                        updateFieldPlacement(index, 'Summary');
                                        setIsAdding(false);
                                    }}
                                    variant="primary"
                                >
                                    Add
                                </IconButton>
                            </article>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
};
