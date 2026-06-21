/** @format */

import type { FC } from 'react';

import { ActionButton } from '../../components/ActionButton';
import { FormField } from '../../components/FormFields';
import type { FieldConfig } from './BuilderPageSupport';
import { BuilderFieldEditor } from './BuilderFieldEditor';
import { BuilderLineItemsPreview } from './BuilderLineItemsStepSupport';

type LineSection = {
    readonly Label: string;
    readonly Enabled?: boolean | undefined;
    readonly MaxRows: number;
    readonly Fields: readonly FieldConfig[];
};

type BuilderLineItemsStepProps = {
    readonly lineSection: LineSection;
    readonly enabled: boolean;
    readonly referencedFieldIds: ReadonlySet<string>;
    readonly onPrevious: () => void;
    readonly onEnabledChange: (value: boolean) => void;
    readonly onLabelChange: (value: string) => void;
    readonly onMaxRowsChange: (value: number) => void;
    readonly onAdd: () => void;
    readonly onChange: (fields: readonly FieldConfig[]) => void;
    readonly onEdit: (index: number) => void;
};

/** Renders the line-item section editor step. */
export const BuilderLineItemsStep: FC<BuilderLineItemsStepProps> = ({
    lineSection,
    enabled,
    referencedFieldIds,
    onPrevious,
    onEnabledChange,
    onLabelChange,
    onMaxRowsChange,
    onAdd,
    onChange,
    onEdit,
}) => {
    return (
        <>
            <div className="builder-step-bridge">
                <div>
                    <p className="eyebrow">Step separator</p>
                    <h3>Previous: Fields</h3>
                    <p>
                        Keep subtotal and total formulas in JSON so the row summary stays visible.
                    </p>
                </div>
                <ActionButton onClick={onPrevious} variant="secondary">
                    Previous: Fields
                </ActionButton>
            </div>
            <FormField.CheckboxField
                checked={enabled}
                label="Enable line items"
                onChange={(event) => {
                    onEnabledChange(event.currentTarget.checked);
                }}
                wrapperClassName="builder-line-items-toggle"
            />
            {!enabled ? (
                <p className="field-note">
                    Turn this on to include the repeating row section in the form, previews, and
                    published format.
                </p>
            ) : null}
            <div className="form-grid">
                <FormField.TextField
                    label="Section label"
                    onChange={(event) => {
                        onLabelChange(event.currentTarget.value);
                    }}
                    value={lineSection.Label}
                />
                <FormField.TextField
                    label="Maximum rows"
                    min="1"
                    onChange={(event) => {
                        onMaxRowsChange(Number(event.currentTarget.value));
                    }}
                    type="number"
                    value={lineSection.MaxRows}
                />
            </div>
            {enabled ? (
                <BuilderFieldEditor
                    fields={lineSection.Fields}
                    onAdd={onAdd}
                    onChange={onChange}
                    onEdit={onEdit}
                    referencedFieldIds={referencedFieldIds}
                />
            ) : null}
            <BuilderLineItemsPreview enabled={enabled} fields={lineSection.Fields} />
        </>
    );
};
