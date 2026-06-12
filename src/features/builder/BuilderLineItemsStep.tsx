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
    onLabelChange,
    onMaxRowsChange,
    onAdd,
    onChange,
    onEdit,
}) => (
    <>
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
